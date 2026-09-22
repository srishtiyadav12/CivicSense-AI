const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance from environment config
const sequelize = new Sequelize(
  process.env.DB_NAME || 'civicsense',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: false,
      freezeTableName: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Idempotent migrations. schema sync runs with alter:false, so new columns on
// existing tables aren't added automatically — apply them here, guarded by a
// column-existence check so re-running is safe.
async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const table = await queryInterface.describeTable('complaints');
    if (table && !table.clusterId) {
      await queryInterface.addColumn('complaints', 'clusterId', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
      console.log('Migration: added complaints.clusterId column');
    }
  } catch (error) {
    console.warn(`Migration check failed (continue): ${error.message}`);
  }
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected: ${sequelize.config.host}:${sequelize.config.port}/${sequelize.config.database}`);

    // Sync models if enabled (creates tables if they don't exist).
    // NOTE: run the column migration BEFORE syncAll() — sync tries to create
    // the model's indexes, so the clusterId column must already exist or the
    // index creation fails on existing tables.
    if (process.env.DB_SYNC === 'true') {
      await runMigrations();
      const models = require('../models');
      await models.syncAll();
      console.log('Database schema synced');
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };