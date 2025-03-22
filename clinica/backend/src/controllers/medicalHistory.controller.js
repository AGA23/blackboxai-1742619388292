const { MedicalHistory, User, Appointment } = require('../models');
const { APIError } = require('../middleware/error.middleware');
const { analyzePatternsTrends } = require('../services/analysis.service');

class MedicalHistoryController {
  /**
   * Create a new medical history record
   * @route POST /api/medical-history
   */
  static async create(req, res, next) {
    try {
      const {
        patientId,
        appointmentId,
        symptoms,
        diagnosis,
        treatment,
        bloodType,
        weight,
        height,
        allergies,
        chronicConditions,
        currentMedications,
        observations,
        oxygenSaturation,
        ozoneConcentration,
        treatmentDuration,
        treatmentRoute,
        followUpRequired,
        followUpNotes,
        nextAppointmentRecommended
      } = req.body;

      // Verify patient exists
      const patient = await User.findOne({
        where: { id: patientId, role: 'patient', status: 'active' }
      });
      if (!patient) {
        throw new APIError(404, 'Patient not found');
      }

      // Verify appointment exists and belongs to the patient
      const appointment = await Appointment.findOne({
        where: { id: appointmentId, patientId }
      });
      if (!appointment) {
        throw new APIError(404, 'Appointment not found');
      }

      // Create medical history record
      const medicalHistory = await MedicalHistory.create({
        patientId,
        doctorId: req.user.id, // Current authenticated doctor
        appointmentId,
        symptoms,
        diagnosis,
        treatment,
        bloodType,
        weight,
        height,
        allergies,
        chronicConditions,
        currentMedications,
        observations,
        oxygenSaturation,
        ozoneConcentration,
        treatmentDuration,
        treatmentRoute,
        followUpRequired,
        followUpNotes,
        nextAppointmentRecommended
      });

      // Update appointment status to completed
      await appointment.update({ status: 'completed' });

      res.status(201).json({
        status: 'success',
        data: {
          medicalHistory
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient's medical history
   * @route GET /api/medical-history/patient/:patientId
   */
  static async getPatientHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      
      // Check access permission
      if (
        req.user.role === 'patient' && 
        req.user.id !== patientId
      ) {
        throw new APIError(403, 'Access denied');
      }

      const medicalHistories = await MedicalHistory.findAll({
        where: { patientId },
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization']
          },
          {
            model: Appointment,
            as: 'appointment',
            attributes: ['id', 'date', 'type']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // If doctor is requesting, include pattern analysis
      let analysis = null;
      if (req.user.role === 'doctor') {
        analysis = await analyzePatternsTrends(medicalHistories);
      }

      res.json({
        status: 'success',
        data: {
          medicalHistories,
          analysis
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific medical history record
   * @route GET /api/medical-history/:id
   */
  static async getById(req, res, next) {
    try {
      const medicalHistory = await MedicalHistory.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization']
          },
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Appointment,
            as: 'appointment',
            attributes: ['id', 'date', 'type']
          }
        ]
      });

      if (!medicalHistory) {
        throw new APIError(404, 'Medical history record not found');
      }

      // Check access permission
      if (
        req.user.role === 'patient' && 
        req.user.id !== medicalHistory.patientId
      ) {
        throw new APIError(403, 'Access denied');
      }

      res.json({
        status: 'success',
        data: {
          medicalHistory
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update medical history record
   * @route PATCH /api/medical-history/:id
   */
  static async update(req, res, next) {
    try {
      const medicalHistory = await MedicalHistory.findByPk(req.params.id);

      if (!medicalHistory) {
        throw new APIError(404, 'Medical history record not found');
      }

      // Only the doctor who created the record can update it
      if (medicalHistory.doctorId !== req.user.id) {
        throw new APIError(403, 'Access denied');
      }

      const allowedUpdates = [
        'symptoms',
        'diagnosis',
        'treatment',
        'observations',
        'oxygenSaturation',
        'ozoneConcentration',
        'treatmentDuration',
        'treatmentRoute',
        'followUpRequired',
        'followUpNotes',
        'nextAppointmentRecommended'
      ];

      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      if (Object.keys(updates).length === 0) {
        throw new APIError(400, 'No valid update fields provided');
      }

      await medicalHistory.update(updates);

      res.json({
        status: 'success',
        data: {
          medicalHistory
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medical history statistics
   * @route GET /api/medical-history/statistics
   */
  static async getStatistics(req, res, next) {
    try {
      // This endpoint is only accessible by doctors and admins
      if (!['doctor', 'admin'].includes(req.user.role)) {
        throw new APIError(403, 'Access denied');
      }

      const statistics = await MedicalHistory.findAll({
        attributes: [
          'diagnosis',
          'treatmentRoute',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['diagnosis', 'treatmentRoute'],
        raw: true
      });

      // Process statistics to get insights
      const insights = {
        commonDiagnoses: statistics
          .reduce((acc, curr) => {
            if (!acc[curr.diagnosis]) {
              acc[curr.diagnosis] = 0;
            }
            acc[curr.diagnosis] += parseInt(curr.count);
            return acc;
          }, {}),
        treatmentRoutes: statistics
          .reduce((acc, curr) => {
            if (!acc[curr.treatmentRoute]) {
              acc[curr.treatmentRoute] = 0;
            }
            acc[curr.treatmentRoute] += parseInt(curr.count);
            return acc;
          }, {})
      };

      res.json({
        status: 'success',
        data: {
          statistics,
          insights
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MedicalHistoryController;