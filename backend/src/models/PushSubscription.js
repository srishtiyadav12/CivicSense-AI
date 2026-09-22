const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * PushSubscription — stores web push notification subscriptions.
 * Each row is one browser push subscription for a user.
 */
const PushSubscription = sequelize.define('push_subscriptions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  endpoint: {
    // VARCHAR (not TEXT) so MySQL can build the UNIQUE + index key on it.
    // Web push endpoint URLs are short (~200-300 chars). 500 x 4 bytes = 2000
    // bytes (utf8mb4), under MySQL's 3072-byte max index key length.
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  keys: {
    type: DataTypes.TEXT, // JSON { p256dh, auth }
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['endpoint'] },
    { fields: ['userId'] }
  ]
});

// Parse keys on read
PushSubscription.prototype.getKeys = function () {
  try { return JSON.parse(this.keys); } catch { return {}; }
};

PushSubscription.associate = (models) => {
  PushSubscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = PushSubscription;
