const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { USER_ROLES } = require('../config/constants');
const { sequelize } = require('../config/db');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Email is required' },
      isEmail: { msg: 'Please provide a valid email' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
    }
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: USER_ROLES.CITIZEN
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ward: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['department'] }
  ]
});

// Hash password before create/update
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 12);
});
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateAuthToken = function () {
  return jwt.sign(
    { id: this.id, role: this.role, email: this.email },
    process.env.JWT_SECRET || 'civicsense_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Serialize: never expose password
User.prototype.toJSON = function () {
  const obj = { ...this.get() };
  delete obj.password;
  return mapUser(obj);
};

// Additional serialization for objects coming from raw queries (already mapped)
function mapUser(obj) {
  delete obj.password;
  return obj;
}

// Register associations in index (done elsewhere)
User.associate = (models) => {
  // A user (official) can head a department
  User.hasOne(models.Department, {
    as: 'headedDepartment',
    foreignKey: 'headOfDepartmentId'
  });
};

module.exports = User;