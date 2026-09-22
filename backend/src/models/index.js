const { sequelize } = require('../config/db');
const User = require('./User');
const Department = require('./Department');
const Complaint = require('./Complaint');
const ActivityLog = require('./ActivityLog');
const PushSubscription = require('./PushSubscription');

const models = {
  User,
  Department,
  Complaint,
  ActivityLog,
  PushSubscription
};

// Define associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Sync all models (create tables if they don't exist)
async function syncAll() {
  await sequelize.sync({ alter: false });
}

module.exports = { ...models, syncAll, sequelize };