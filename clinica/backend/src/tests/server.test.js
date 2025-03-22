const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

describe('Server Tests', () => {
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'API is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Version Check', () => {
    it('should return version information', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      try {
        await sequelize.authenticate();
        expect(true).toBe(true); // Connection successful
      } catch (error) {
        expect(error).toBeNull(); // This will fail the test if there's an error
      }
    });

    it('should sync models without error', async () => {
      try {
        await sequelize.sync({ force: true });
        expect(true).toBe(true); // Sync successful
      } catch (error) {
        expect(error).toBeNull(); // This will fail the test if there's an error
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Route not found');
    });
  });

  describe('Error Handler', () => {
    it('should handle errors appropriately', async () => {
      // Trigger an error by sending invalid JSON
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json{')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});