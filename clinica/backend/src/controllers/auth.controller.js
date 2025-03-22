const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { APIError } = require('../middleware/error.middleware');
const { sendWelcomeEmail } = require('../services/email.service');

class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { firstName, lastName, email, password, phone, role, specialization } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new APIError(409, 'Email already registered');
      }

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password, // Password will be hashed by model hook
        phone,
        role,
        specialization: role === 'doctor' ? specialization : null
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Send welcome email
      await sendWelcomeEmail(user);

      res.status(201).json({
        status: 'success',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @route POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new APIError(401, 'Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new APIError(401, 'Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new APIError(401, 'Account is inactive. Please contact support.');
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        status: 'success',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * @route GET /api/auth/profile
   */
  static async getProfile(req, res) {
    res.json({
      status: 'success',
      data: {
        user: req.user.toJSON()
      }
    });
  }

  /**
   * Update user profile
   * @route PATCH /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'specialization'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      if (Object.keys(updates).length === 0) {
        throw new APIError(400, 'No valid update fields provided');
      }

      // Update user
      const user = req.user;
      Object.assign(user, updates);
      await user.save();

      res.json({
        status: 'success',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * @route POST /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isPasswordValid = await req.user.validatePassword(currentPassword);
      if (!isPasswordValid) {
        throw new APIError(401, 'Current password is incorrect');
      }

      // Update password
      req.user.password = newPassword;
      await req.user.save();

      res.json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @route POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // For security reasons, don't reveal if email exists
        return res.json({
          status: 'success',
          message: 'If your email is registered, you will receive password reset instructions'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      await sendPasswordResetEmail(user, resetToken);

      res.json({
        status: 'success',
        message: 'If your email is registered, you will receive password reset instructions'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @route POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new APIError(400, 'Invalid or expired reset token');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        status: 'success',
        message: 'Password reset successfully'
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new APIError(400, 'Invalid or expired reset token'));
      } else {
        next(error);
      }
    }
  }
}

module.exports = AuthController;