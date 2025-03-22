const express = require('express');
const authRoutes = require('./auth.routes');
const appointmentRoutes = require('./appointment.routes');
const medicalHistoryRoutes = require('./medicalHistory.routes');
const branchRoutes = require('./branch.routes');
const { notFoundHandler } = require('../middleware/error.middleware');

const router = express.Router();

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API Version
router.get('/version', (req, res) => {
  res.json({
    status: 'success',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-history', medicalHistoryRoutes);
router.use('/branches', branchRoutes);

// Handle 404 routes
router.use(notFoundHandler);

module.exports = router;