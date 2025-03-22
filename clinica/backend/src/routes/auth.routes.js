const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');
const { validateRequest, userValidationRules } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Public routes
router.post(
  '/register',
  userValidationRules.create,
  validateRequest,
  asyncHandler(AuthController.register)
);

router.post(
  '/login',
  [
    userValidationRules.login,
    validateRequest
  ],
  asyncHandler(AuthController.login)
);

router.post(
  '/forgot-password',
  [
    userValidationRules.forgotPassword,
    validateRequest
  ],
  asyncHandler(AuthController.forgotPassword)
);

router.post(
  '/reset-password',
  [
    userValidationRules.resetPassword,
    validateRequest
  ],
  asyncHandler(AuthController.resetPassword)
);

// Protected routes
router.get(
  '/profile',
  auth,
  asyncHandler(AuthController.getProfile)
);

router.patch(
  '/profile',
  [
    auth,
    userValidationRules.update,
    validateRequest
  ],
  asyncHandler(AuthController.updateProfile)
);

router.post(
  '/change-password',
  [
    auth,
    userValidationRules.changePassword,
    validateRequest
  ],
  asyncHandler(AuthController.changePassword)
);

// Refresh token route
router.post(
  '/refresh-token',
  asyncHandler(AuthController.refreshToken)
);

// Logout route
router.post(
  '/logout',
  auth,
  asyncHandler(AuthController.logout)
);

// Email verification routes
router.post(
  '/verify-email',
  asyncHandler(AuthController.verifyEmail)
);

router.post(
  '/resend-verification',
  auth,
  asyncHandler(AuthController.resendVerification)
);

module.exports = router;