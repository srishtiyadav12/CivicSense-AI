const { DataTypes } = require('sequelize');
const { COMPLAINT_STATUS, PRIORITY_LEVELS } = require('../config/constants');
const { sequelize } = require('../config/db');

/**
 * Complaint — relational representation.
 * Nested/array data (images, status history, similar complaints, AI analysis,
 * resolution proof) is stored as JSON TEXT columns. Location is flattened into
 * lat/lng + address columns for efficient spatial search.
 */
const Complaint = sequelize.define('complaints', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: { msg: 'Title is required' } }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: { msg: 'Description is required' } }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'other'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: PRIORITY_LEVELS.MEDIUM.score
  },
  priorityLabel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: COMPLAINT_STATUS.SUBMITTED
  },
  department: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'General Administration'
  },

  // Flattened location
  locLat: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  locLng: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  locAddress: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: ''
  },
  locWard: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: ''
  },
  locCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },
  locState: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: ''
  },

  // Relations
  reportedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  duplicateOfId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'complaints', key: 'id' }
  },
  // Cluster anchor for automatic grouping of similar complaints.
  // null  => complaint is not part of any cluster.
  // == id => complaint is the ROOT/representative of a cluster (its members share this id).
  // != id => complaint is a MEMBER of the cluster anchored at this id.
  clusterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'complaints', key: 'id' }
  },

  // JSON columns
  images: {
    type: DataTypes.TEXT, // JSON array
    allowNull: true,
    defaultValue: '[]'
  },
  statusHistory: {
    type: DataTypes.TEXT, // JSON array
    allowNull: true,
    defaultValue: '[]'
  },
  similarComplaints: {
    type: DataTypes.TEXT, // JSON array
    allowNull: true,
    defaultValue: '[]'
  },
  resolutionProof: {
    type: DataTypes.TEXT, // JSON object
    allowNull: true,
    defaultValue: '{}'
  },
  // Citizen review — set after resolution (1–5 stars + optional feedback)
  satisfactionRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  aiAnalysis: {
    type: DataTypes.TEXT, // JSON object
    allowNull: true,
    defaultValue: '{}'
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

}, {
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['department'] },
    { fields: ['priority'] },
    { fields: ['reportedById'] },
    { fields: ['assignedToId'] },
    { fields: ['clusterId'] },
    { fields: ['createdAt'] }
  ]
});

// Parse JSON columns on read, and seed statusHistory on create
function parseJSON(text, fallback) {
  if (text == null) return fallback;
  try { return JSON.parse(text); } catch (e) { return fallback; }
}

Complaint.prototype.getImages = function () { return parseJSON(this.images, []); };
Complaint.prototype.getStatusHistory = function () { return parseJSON(this.statusHistory, []); };
Complaint.prototype.getSimilarComplaints = function () { return parseJSON(this.similarComplaints, []); };
Complaint.prototype.getResolutionProof = function () { return parseJSON(this.resolutionProof, {}); };
Complaint.prototype.getAiAnalysis = function () { return parseJSON(this.aiAnalysis, {}); };

// Serialize into the nested object shape the frontend expects
Complaint.prototype.toJSON = function () {
  const obj = { ...this.get() };
  const id = obj.id;

  obj.location = {
    type: 'Point',
    coordinates:
      obj.locLat != null && obj.locLng != null
        ? [Number(obj.locLng), Number(obj.locLat)]
        : null,
    address: obj.locAddress || '',
    ward: obj.locWard || '',
    city: obj.locCity || '',
    state: obj.locState || ''
  };

  obj.images = parseJSON(obj.images, []);
  obj.statusHistory = parseJSON(obj.statusHistory, []);
  obj.similarComplaints = parseJSON(obj.similarComplaints, []);
  obj.resolutionProof = parseJSON(obj.resolutionProof, {});
  obj.aiAnalysis = parseJSON(obj.aiAnalysis, {});

  // Relative upload paths -> absolute URLs (frontend runs on a different port)
  const origin = `http://localhost:${process.env.PORT || 5000}`;
  obj.images = obj.images.map((img) => {
    const src = typeof img === 'string' ? img : (img && img.url) || '';
    return src.startsWith('/uploads/') ? origin + src : img;
  });

  // Top-level shorthand fields for frontend
  obj.reportedBy = obj.reportedBy || { id: obj.reportedById };
  obj.assignedTo = obj.assignedTo || (obj.assignedToId ? { id: obj.assignedToId } : null);
  obj.duplicateOf = obj.duplicateOfId || null;
  obj._id = id;

  // Remove raw columns from serialized output
  delete obj.locLat; delete obj.locLng; delete obj.locAddress;
  delete obj.locWard; delete obj.locCity; delete obj.locState;
  delete obj.reportedById; delete obj.assignedToId; delete obj.duplicateOfId;

  return obj;
};

Complaint.associate = (models) => {
  Complaint.belongsTo(models.User, { as: 'reportedBy', foreignKey: 'reportedById' });
  Complaint.belongsTo(models.User, { as: 'assignedTo', foreignKey: 'assignedToId' });
  Complaint.belongsTo(models.Complaint, { as: 'duplicateParent', foreignKey: 'duplicateOfId' });
};

// Seed initial status history on create
Complaint.beforeCreate((complaint) => {
  const history = parseJSON(complaint.statusHistory, []);
  if (!history.length) {
    history.push({
      status: COMPLAINT_STATUS.SUBMITTED,
      updatedBy: complaint.reportedById,
      note: 'Complaint submitted',
      timestamp: new Date().toISOString()
    });
  }
  complaint.statusHistory = JSON.stringify(history);
});

/**
 * Compute stats grouped by a given column.
 * @param {string} column column name in complaints table (status, type, department, priority)
 * @param {object} where optional filter
 * @returns Promise<[{_id, count}]>
 */
Complaint.groupCount = async function (column, where = {}) {
  const { fn, col, literal } = require('sequelize');
  const rows = await Complaint.findAll({
    attributes: [
      [col(column), '_id'],
      [fn('COUNT', col('id')), 'count']
    ],
    where,
    group: [column],
    raw: true
  });
  return rows.map(r => ({
    _id: column === 'priority' ? Number(r._id) : r._id,
    count: Number(r.count)
  }));
};

module.exports = Complaint;