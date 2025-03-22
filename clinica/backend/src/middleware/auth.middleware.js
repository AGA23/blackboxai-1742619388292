const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided'
      });
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({
      where: { 
        id: decoded.id,
        status: 'active'
      }
    });

    if (!user) {
      throw new Error();
    }

    // Add user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Please authenticate'
    });
  }
};

// Middleware to check user role
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Please authenticate'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    next();
  };
};

// Middleware to validate ownership of medical history
const checkMedicalHistoryAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const medicalHistory = await MedicalHistory.findByPk(id);

    if (!medicalHistory) {
      return res.status(404).json({
        status: 'error',
        message: 'Medical history not found'
      });
    }

    // Allow access if user is:
    // 1. The patient who owns the history
    // 2. The doctor who created the history
    // 3. An admin
    if (
      user.role === 'admin' ||
      (user.role === 'doctor' && medicalHistory.doctorId === user.id) ||
      (user.role === 'patient' && medicalHistory.patientId === user.id)
    ) {
      req.medicalHistory = medicalHistory;
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to validate appointment access
const checkAppointmentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Allow access if user is:
    // 1. The patient who owns the appointment
    // 2. The doctor assigned to the appointment
    // 3. An admin
    if (
      user.role === 'admin' ||
      (user.role === 'doctor' && appointment.doctorId === user.id) ||
      (user.role === 'patient' && appointment.patientId === user.id)
    ) {
      req.appointment = appointment;
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  auth,
  checkRole,
  checkMedicalHistoryAccess,
  checkAppointmentAccess
};