const express = require('express');
const MedicalHistoryController = require('../controllers/medicalHistory.controller');
const { auth, checkRole, checkMedicalHistoryAccess } = require('../middleware/auth.middleware');
const { validateRequest, medicalHistoryValidationRules } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create medical history record (doctors only)
router.post(
  '/',
  [
    checkRole('doctor'),
    medicalHistoryValidationRules.create,
    validateRequest
  ],
  asyncHandler(MedicalHistoryController.create)
);

// Get patient's medical history
router.get(
  '/patient/:patientId',
  [
    checkRole('doctor', 'patient', 'admin'),
    validateRequest
  ],
  asyncHandler(MedicalHistoryController.getPatientHistory)
);

// Get specific medical history record
router.get(
  '/:id',
  checkMedicalHistoryAccess,
  asyncHandler(MedicalHistoryController.getById)
);

// Update medical history record (doctors only)
router.patch(
  '/:id',
  [
    checkRole('doctor'),
    checkMedicalHistoryAccess,
    medicalHistoryValidationRules.update,
    validateRequest
  ],
  asyncHandler(MedicalHistoryController.update)
);

// Get medical history statistics (doctors and admins only)
router.get(
  '/statistics',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.getStatistics)
);

// Analysis routes
router.get(
  '/analysis/patterns',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.analyzePatterns)
);

router.get(
  '/analysis/trends',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.analyzeTrends)
);

router.get(
  '/analysis/effectiveness',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.analyzeEffectiveness)
);

// Export routes
router.post(
  '/export',
  [
    checkRole('doctor', 'admin'),
    validateRequest
  ],
  asyncHandler(MedicalHistoryController.exportRecords)
);

// Bulk operations (admin only)
router.post(
  '/bulk-update',
  [
    checkRole('admin'),
    medicalHistoryValidationRules.bulkUpdate,
    validateRequest
  ],
  asyncHandler(MedicalHistoryController.bulkUpdate)
);

// Search and filter routes
router.get(
  '/search',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.search)
);

router.get(
  '/filter',
  checkRole('doctor', 'admin'),
  asyncHandler(MedicalHistoryController.filter)
);

// Patient-specific summary
router.get(
  '/patient/:patientId/summary',
  checkRole('doctor', 'patient', 'admin'),
  asyncHandler(MedicalHistoryController.getPatientSummary)
);

// Treatment progress tracking
router.get(
  '/patient/:patientId/progress',
  checkRole('doctor', 'patient', 'admin'),
  asyncHandler(MedicalHistoryController.getPatientProgress)
);

// Condition-specific history
router.get(
  '/patient/:patientId/condition/:condition',
  checkRole('doctor', 'patient', 'admin'),
  asyncHandler(MedicalHistoryController.getConditionHistory)
);

module.exports = router;