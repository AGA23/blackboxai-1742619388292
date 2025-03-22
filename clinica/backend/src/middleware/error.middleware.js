const { ValidationError, DatabaseError, UniqueConstraintError } = require('sequelize');

// Custom error class for API errors
class APIError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      status: 'error',
      message: 'Unique constraint violation',
      errors: err.errors.map(error => ({
        field: error.path,
        message: `${error.path} already exists`
      }))
    });
  }

  // Handle Sequelize database errors
  if (err instanceof DatabaseError) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An internal database error occurred'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      status: 'error',
      message: 'Too many files'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Unexpected file type'
    });
  }

  // Handle 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      status: 'error',
      message: err.message || 'Resource not found'
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
};

// Async handler wrapper to avoid try-catch blocks in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};