const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { generateToken } = require('../services/auth.service');

describe('Authentication Tests', () => {
  let testUser;
  const userCredentials = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'Test123!',
    phone: '1234567890',
    role: 'patient'
  };

  beforeAll(async () => {
    // Clear users table
    await User.destroy({ where: {}, force: true });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userCredentials)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userCredentials.email);
      
      testUser = response.body.data.user;
    });

    it('should not register user with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userCredentials)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Email already registered');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('User Login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userCredentials.password
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('Profile Management', () => {
    let authToken;

    beforeAll(async () => {
      // Generate token for authenticated requests
      authToken = `Bearer ${generateToken(testUser)}`;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', authToken)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userCredentials.email);
    });

    it('should update user profile successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', authToken)
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.user.firstName).toBe(updates.firstName);
      expect(response.body.data.user.lastName).toBe(updates.lastName);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: userCredentials.password,
        newPassword: 'NewTest123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', authToken)
        .send(passwordData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Password updated successfully');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: passwordData.newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('status', 'success');
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'No authentication token provided');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Please authenticate');
    });
  });

  afterAll(async () => {
    // Clean up
    await User.destroy({ where: {}, force: true });
  });
});