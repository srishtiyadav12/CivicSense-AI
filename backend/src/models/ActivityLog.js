const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ActivityLog = sequelize.define('activity_logs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  targetModel: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  details: {
    type: DataTypes.TEXT, // JSON object
    allowNull: true,
    defaultValue: '{}'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    defaultValue: ''
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['targetModel', 'targetId'] },
    { fields: ['createdAt'] }
  ]
});

ActivityLog.prototype.toJSON = function () {
  const obj = { ...this.get() };
  if (obj.details) {
    try { obj.details = JSON.parse(obj.details); } catch (e) { obj.details = {}; }
  }
  obj.user = obj.user || { id: obj.userId };
  return obj;
};

ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
};

module.exports = ActivityLog;