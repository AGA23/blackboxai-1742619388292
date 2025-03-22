const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { APIError } = require('../middleware/error.middleware');

class AuthService {
  /**
   * Generate JWT token
   * @param {Object} user - User instance
   * @returns {string} JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new APIError(401, 'Token expired');
      }
      throw new APIError(401, 'Invalid token');
    }
  }

  /**
   * Hash password
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {boolean} Whether passwords match
   */
  static async comparePasswords(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @returns {string} Reset token
   */
  static generateResetToken(userId) {
    return jwt.sign(
      { id: userId, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Object} Decoded token payload
   */
  static verifyResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new APIError(400, 'Invalid reset token');
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new APIError(400, 'Reset token expired');
      }
      throw new APIError(400, 'Invalid reset token');
    }
  }

  /**
   * Generate email verification token
   * @param {string} userId - User ID
   * @returns {string} Verification token
   */
  static generateVerificationToken(userId) {
    return jwt.sign(
      { id: userId, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Verify email verification token
   * @param {string} token - Verification token
   * @returns {Object} Decoded token payload
   */
  static verifyVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'email_verification') {
        throw new APIError(400, 'Invalid verification token');
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new APIError(400, 'Verification token expired');
      }
      throw new APIError(400, 'Invalid verification token');
    }
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {Object} Decoded token payload
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new APIError(400, 'Invalid refresh token');
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new APIError(400, 'Refresh token expired');
      }
      throw new APIError(400, 'Invalid refresh token');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} Whether password meets requirements
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumbers ||
      !hasSpecialChar
    ) {
      throw new APIError(400, 'Password does not meet security requirements');
    }

    return true;
  }

  /**
   * Check if user has required role
   * @param {Object} user - User instance
   * @param {string|string[]} requiredRoles - Required role(s)
   * @returns {boolean} Whether user has required role
   */
  static hasRole(user, requiredRoles) {
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  }
}

module.exports = AuthService;