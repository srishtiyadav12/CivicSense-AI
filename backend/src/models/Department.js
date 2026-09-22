const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Department = sequelize.define('departments', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  headOfDepartmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: ''
  },
  contactPhone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: ''
  },
  assignedWards: {
    type: DataTypes.TEXT, // JSON string of ward names
    allowNull: true,
    defaultValue: '[]'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

Department.prototype.toJSON = function () {
  const obj = { ...this.get() };
  if (typeof obj.assignedWards === 'string') {
    try { obj.assignedWards = JSON.parse(obj.assignedWards); } catch (e) { obj.assignedWards = []; }
  }
  return obj;
};

Department.associate = (models) => {
  Department.belongsTo(models.User, { as: 'headOfDepartment', foreignKey: 'headOfDepartmentId' });
};

module.exports = Department;