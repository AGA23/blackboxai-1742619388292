const express = require('express');
const BranchController = require('../controllers/branch.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');
const { validateRequest, branchValidationRules } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Public routes (authenticated users)
router.get(
  '/',
  asyncHandler(BranchController.getAll)
);

router.get(
  '/:id',
  asyncHandler(BranchController.getById)
);

// Admin-only routes
router.post(
  '/',
  [
    checkRole('admin'),
    branchValidationRules.create,
    validateRequest
  ],
  asyncHandler(BranchController.create)
);

router.patch(
  '/:id',
  [
    checkRole('admin'),
    branchValidationRules.update,
    validateRequest
  ],
  asyncHandler(BranchController.update)
);

// Doctor assignment routes
router.post(
  '/:id/doctors',
  [
    checkRole('admin'),
    validateRequest
  ],
  asyncHandler(BranchController.assignDoctor)
);

router.delete(
  '/:id/doctors/:doctorId',
  checkRole('admin'),
  asyncHandler(BranchController.removeDoctor)
);

// Statistics and analytics
router.get(
  '/:id/statistics',
  checkRole('admin'),
  asyncHandler(BranchController.getStatistics)
);

router.get(
  '/statistics/overall',
  checkRole('admin'),
  asyncHandler(BranchController.getOverallStatistics)
);

// Capacity management
router.get(
  '/:id/capacity',
  asyncHandler(BranchController.getCurrentCapacity)
);

router.patch(
  '/:id/capacity',
  [
    checkRole('admin'),
    branchValidationRules.updateCapacity,
    validateRequest
  ],
  asyncHandler(BranchController.updateCapacity)
);

// Operating hours management
router.get(
  '/:id/operating-hours',
  asyncHandler(BranchController.getOperatingHours)
);

router.patch(
  '/:id/operating-hours',
  [
    checkRole('admin'),
    branchValidationRules.updateOperatingHours,
    validateRequest
  ],
  asyncHandler(BranchController.updateOperatingHours)
);

// Service management
router.get(
  '/:id/services',
  asyncHandler(BranchController.getServices)
);

router.patch(
  '/:id/services',
  [
    checkRole('admin'),
    branchValidationRules.updateServices,
    validateRequest
  ],
  asyncHandler(BranchController.updateServices)
);

// Doctor schedules
router.get(
  '/:id/doctor-schedules',
  checkRole('admin', 'doctor'),
  asyncHandler(BranchController.getDoctorSchedules)
);

router.patch(
  '/:id/doctor-schedules/:doctorId',
  [
    checkRole('admin'),
    branchValidationRules.updateDoctorSchedule,
    validateRequest
  ],
  asyncHandler(BranchController.updateDoctorSchedule)
);

// Search and filter
router.get(
  '/search',
  asyncHandler(BranchController.search)
);

router.get(
  '/filter',
  asyncHandler(BranchController.filter)
);

// Maintenance status
router.patch(
  '/:id/maintenance-status',
  [
    checkRole('admin'),
    branchValidationRules.updateMaintenanceStatus,
    validateRequest
  ],
  asyncHandler(BranchController.updateMaintenanceStatus)
);

// Equipment management
router.get(
  '/:id/equipment',
  checkRole('admin'),
  asyncHandler(BranchController.getEquipment)
);

router.patch(
  '/:id/equipment',
  [
    checkRole('admin'),
    branchValidationRules.updateEquipment,
    validateRequest
  ],
  asyncHandler(BranchController.updateEquipment)
);

module.exports = router;