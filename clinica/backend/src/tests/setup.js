const { sequelize } = require('../models');

beforeAll(async () => {
  // Connect to test database and sync models
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error closing test database connection:', error);
    throw error;
  }
});