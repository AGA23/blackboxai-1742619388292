const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const { auth, checkRole, checkAppointmentAccess } = require('../middleware/auth.middleware');
const { validateRequest, appointmentValidationRules } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create appointment
router.post(
  '/',
  [
    appointmentValidationRules.create,
    validateRequest
  ],
  asyncHandler(AppointmentController.create)
);

// Get all appointments (with filters)
router.get(
  '/',
  asyncHandler(AppointmentController.getAll)
);

// Get available time slots
router.get(
  '/available-slots',
  asyncHandler(AppointmentController.getAvailableSlots)
);

// Get specific appointment
router.get(
  '/:id',
  checkAppointmentAccess,
  asyncHandler(AppointmentController.getById)
);

// Update appointment
router.patch(
  '/:id',
  [
    checkAppointmentAccess,
    appointmentValidationRules.update,
    validateRequest
  ],
  asyncHandler(AppointmentController.update)
);

// Cancel appointment
router.post(
  '/:id/cancel',
  [
    checkAppointmentAccess,
    appointmentValidationRules.cancel,
    validateRequest
  ],
  asyncHandler(AppointmentController.cancel)
);

// Confirm appointment
router.post(
  '/:id/confirm',
  [
    checkAppointmentAccess,
    validateRequest
  ],
  asyncHandler(AppointmentController.confirm)
);

// Reschedule appointment
router.post(
  '/:id/reschedule',
  [
    checkAppointmentAccess,
    appointmentValidationRules.reschedule,
    validateRequest
  ],
  asyncHandler(AppointmentController.reschedule)
);

// Doctor-specific routes
router.get(
  '/doctor/schedule',
  checkRole('doctor'),
  asyncHandler(AppointmentController.getDoctorSchedule)
);

router.get(
  '/doctor/upcoming',
  checkRole('doctor'),
  asyncHandler(AppointmentController.getDoctorUpcoming)
);

// Patient-specific routes
router.get(
  '/patient/history',
  checkRole('patient'),
  asyncHandler(AppointmentController.getPatientHistory)
);

router.get(
  '/patient/upcoming',
  checkRole('patient'),
  asyncHandler(AppointmentController.getPatientUpcoming)
);

// Admin-specific routes
router.get(
  '/statistics',
  checkRole('admin'),
  asyncHandler(AppointmentController.getStatistics)
);

router.post(
  '/bulk-cancel',
  checkRole('admin'),
  asyncHandler(AppointmentController.bulkCancel)
);

router.post(
  '/bulk-reschedule',
  checkRole('admin'),
  asyncHandler(AppointmentController.bulkReschedule)
);

module.exports = router;