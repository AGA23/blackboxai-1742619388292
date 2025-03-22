const { validationResult, body } = require('express-validator');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const userValidationRules = {
  create: [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role')
      .isIn(['patient', 'doctor', 'admin'])
      .withMessage('Invalid role specified'),
    body('specialization')
      .if(body('role').equals('doctor'))
      .notEmpty()
      .withMessage('Specialization is required for doctors')
  ],
  update: [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('specialization')
      .optional()
      .if(body('role').equals('doctor'))
      .notEmpty()
      .withMessage('Specialization is required for doctors')
  ]
};

// Appointment validation rules
const appointmentValidationRules = {
  create: [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('branchId').notEmpty().withMessage('Branch ID is required'),
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('startTime')
      .notEmpty()
      .withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Invalid time format (HH:MM)'),
    body('endTime')
      .notEmpty()
      .withMessage('End time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Invalid time format (HH:MM)'),
    body('type')
      .isIn(['first_visit', 'follow_up'])
      .withMessage('Invalid appointment type')
  ],
  update: [
    body('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes').optional().trim(),
    body('cancellationReason')
      .if(body('status').equals('cancelled'))
      .notEmpty()
      .withMessage('Cancellation reason is required when cancelling appointment')
  ]
};

// Medical History validation rules
const medicalHistoryValidationRules = {
  create: [
    body('symptoms').notEmpty().withMessage('Symptoms are required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('treatment').notEmpty().withMessage('Treatment is required'),
    body('bloodType')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood type'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('height')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Height must be a positive number'),
    body('oxygenSaturation')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Oxygen saturation must be between 0 and 100'),
    body('ozoneConcentration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Ozone concentration must be a positive number'),
    body('treatmentDuration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Treatment duration must be a positive integer'),
    body('treatmentRoute')
      .optional()
      .isIn(['intravenosa', 'intramuscular', 'subcutánea', 'tópica', 'rectal', 'otro'])
      .withMessage('Invalid treatment route')
  ],
  update: [
    body('symptoms').optional().notEmpty().withMessage('Symptoms cannot be empty'),
    body('diagnosis').optional().notEmpty().withMessage('Diagnosis cannot be empty'),
    body('treatment').optional().notEmpty().withMessage('Treatment cannot be empty'),
    body('followUpNotes').optional().trim(),
    body('nextAppointmentRecommended')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for next appointment')
  ]
};

// Branch validation rules
const branchValidationRules = {
  create: [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('zipCode').trim().notEmpty().withMessage('ZIP code is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('capacity')
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('coordinates')
      .optional()
      .isObject()
      .withMessage('Coordinates must be an object with latitude and longitude')
  ],
  update: [
    body('name').optional().trim().notEmpty().withMessage('Branch name cannot be empty'),
    body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'maintenance'])
      .withMessage('Invalid status'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer')
  ]
};

module.exports = {
  validateRequest,
  userValidationRules,
  appointmentValidationRules,
  medicalHistoryValidationRules,
  branchValidationRules
};