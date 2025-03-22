const { Op } = require('sequelize');
const { Appointment, User, Branch } = require('../models');
const { APIError } = require('../middleware/error.middleware');
const { sendAppointmentConfirmation, sendAppointmentReminder } = require('../services/email.service');
const { sendSMSNotification } = require('../services/sms.service');

class AppointmentController {
  /**
   * Create a new appointment
   * @route POST /api/appointments
   */
  static async create(req, res, next) {
    try {
      const {
        patientId,
        doctorId,
        branchId,
        date,
        startTime,
        endTime,
        type
      } = req.body;

      // Verify doctor exists and is active
      const doctor = await User.findOne({
        where: { id: doctorId, role: 'doctor', status: 'active' }
      });
      if (!doctor) {
        throw new APIError(404, 'Doctor not found or inactive');
      }

      // Verify branch exists and is active
      const branch = await Branch.findOne({
        where: { id: branchId, status: 'active' }
      });
      if (!branch) {
        throw new APIError(404, 'Branch not found or inactive');
      }

      // Check for scheduling conflicts
      const conflictingAppointment = await Appointment.findOne({
        where: {
          doctorId,
          date,
          [Op.or]: [
            {
              startTime: {
                [Op.between]: [startTime, endTime]
              }
            },
            {
              endTime: {
                [Op.between]: [startTime, endTime]
              }
            }
          ],
          status: {
            [Op.notIn]: ['cancelled']
          }
        }
      });

      if (conflictingAppointment) {
        throw new APIError(409, 'Doctor is not available at this time');
      }

      // Create appointment
      const appointment = await Appointment.create({
        patientId,
        doctorId,
        branchId,
        date,
        startTime,
        endTime,
        type,
        status: 'scheduled'
      });

      // Send confirmation notifications
      await Promise.all([
        sendAppointmentConfirmation(appointment),
        sendSMSNotification(appointment)
      ]);

      // Schedule reminder for 24 hours before appointment
      const appointmentDate = new Date(date + ' ' + startTime);
      const reminderDate = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      
      // TODO: Implement job scheduler for reminders
      // scheduleJob(reminderDate, () => sendAppointmentReminder(appointment));

      res.status(201).json({
        status: 'success',
        data: {
          appointment
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all appointments (with filters)
   * @route GET /api/appointments
   */
  static async getAll(req, res, next) {
    try {
      const {
        startDate,
        endDate,
        status,
        type,
        doctorId,
        patientId,
        branchId
      } = req.query;

      // Build query conditions
      const where = {};
      
      if (startDate && endDate) {
        where.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      if (status) where.status = status;
      if (type) where.type = type;
      if (doctorId) where.doctorId = doctorId;
      if (patientId) where.patientId = patientId;
      if (branchId) where.branchId = branchId;

      // Add role-based filters
      if (req.user.role === 'doctor') {
        where.doctorId = req.user.id;
      } else if (req.user.role === 'patient') {
        where.patientId = req.user.id;
      }

      const appointments = await Appointment.findAll({
        where,
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
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }
        ],
        order: [['date', 'ASC'], ['startTime', 'ASC']]
      });

      res.json({
        status: 'success',
        data: {
          appointments
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment by ID
   * @route GET /api/appointments/:id
   */
  static async getById(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
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
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }
        ]
      });

      if (!appointment) {
        throw new APIError(404, 'Appointment not found');
      }

      // Check access permission
      if (
        req.user.role !== 'admin' &&
        req.user.id !== appointment.doctorId &&
        req.user.id !== appointment.patientId
      ) {
        throw new APIError(403, 'Access denied');
      }

      res.json({
        status: 'success',
        data: {
          appointment
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment status
   * @route PATCH /api/appointments/:id
   */
  static async update(req, res, next) {
    try {
      const { status, notes, cancellationReason } = req.body;
      const appointment = await Appointment.findByPk(req.params.id);

      if (!appointment) {
        throw new APIError(404, 'Appointment not found');
      }

      // Validate status transition
      if (status === 'cancelled' && !appointment.canBeCancelled()) {
        throw new APIError(400, 'Appointment cannot be cancelled less than 24 hours before');
      }

      // Update appointment
      appointment.status = status || appointment.status;
      appointment.notes = notes || appointment.notes;
      appointment.cancellationReason = cancellationReason || appointment.cancellationReason;
      
      await appointment.save();

      // Send notifications based on status change
      if (status === 'cancelled') {
        // TODO: Implement cancellation notifications
      }

      res.json({
        status: 'success',
        data: {
          appointment
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available time slots for a doctor
   * @route GET /api/appointments/available-slots
   */
  static async getAvailableSlots(req, res, next) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        throw new APIError(400, 'Doctor ID and date are required');
      }

      // Get doctor's appointments for the date
      const appointments = await Appointment.findAll({
        where: {
          doctorId,
          date,
          status: {
            [Op.notIn]: ['cancelled']
          }
        },
        order: [['startTime', 'ASC']]
      });

      // Get doctor's working hours (from branch assignment)
      // TODO: Implement proper working hours logic
      const workingHours = {
        start: '09:00',
        end: '17:00',
        slotDuration: 30 // minutes
      };

      // Generate available slots
      const slots = [];
      let currentTime = workingHours.start;

      while (currentTime < workingHours.end) {
        const isAvailable = !appointments.some(apt => 
          apt.startTime <= currentTime && apt.endTime > currentTime
        );

        if (isAvailable) {
          slots.push(currentTime);
        }

        // Add slot duration to current time
        const [hours, minutes] = currentTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + workingHours.slotDuration;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      }

      res.json({
        status: 'success',
        data: {
          date,
          doctorId,
          availableSlots: slots
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;