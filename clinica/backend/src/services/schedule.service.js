const { Op } = require('sequelize');
const { LoggerService } = require('./logger.service');
const { Appointment, User, Branch } = require('../models');
const { CacheService } = require('./cache.service');

class ScheduleService {
  static BUSINESS_HOURS = {
    start: '09:00',
    end: '17:00'
  };

  static APPOINTMENT_DURATION = 60; // minutes
  static CACHE_PREFIX = 'schedule:';
  static CACHE_TTL = 300; // 5 minutes

  /**
   * Get doctor availability
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date to check
   * @returns {Promise<Array>} Available time slots
   */
  static async getDoctorAvailability(doctorId, date) {
    try {
      const cacheKey = `${this.CACHE_PREFIX}availability:${doctorId}:${date}`;
      const cached = CacheService.get(cacheKey);
      if (cached) return cached;

      // Get doctor's appointments for the date
      const appointments = await Appointment.findAll({
        where: {
          doctorId,
          date,
          status: {
            [Op.notIn]: ['cancelled', 'rejected']
          }
        },
        order: [['startTime', 'ASC']]
      });

      // Generate all possible time slots
      const timeSlots = this.generateTimeSlots();

      // Filter out booked slots
      const availableSlots = timeSlots.filter(slot => {
        return !appointments.some(app => app.startTime === slot);
      });

      CacheService.set(cacheKey, availableSlots, this.CACHE_TTL);
      return availableSlots;
    } catch (error) {
      LoggerService.error('Error getting doctor availability:', error);
      throw error;
    }
  }

  /**
   * Get branch availability
   * @param {string} branchId - Branch ID
   * @param {string} date - Date to check
   * @returns {Promise<Object>} Branch availability
   */
  static async getBranchAvailability(branchId, date) {
    try {
      const cacheKey = `${this.CACHE_PREFIX}branch:${branchId}:${date}`;
      const cached = CacheService.get(cacheKey);
      if (cached) return cached;

      // Get all doctors in the branch
      const doctors = await User.findAll({
        where: {
          role: 'doctor',
          branchId
        }
      });

      // Get availability for each doctor
      const availability = await Promise.all(
        doctors.map(async doctor => ({
          doctor: {
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialization
          },
          availableSlots: await this.getDoctorAvailability(doctor.id, date)
        }))
      );

      CacheService.set(cacheKey, availability, this.CACHE_TTL);
      return availability;
    } catch (error) {
      LoggerService.error('Error getting branch availability:', error);
      throw error;
    }
  }

  /**
   * Schedule appointment
   * @param {Object} data - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  static async scheduleAppointment(data) {
    try {
      const { doctorId, date, startTime } = data;

      // Validate availability
      const isAvailable = await this.checkAvailability(doctorId, date, startTime);
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }

      // Create appointment
      const appointment = await Appointment.create({
        ...data,
        endTime: this.calculateEndTime(startTime),
        status: 'scheduled'
      });

      // Clear availability cache
      this.clearAvailabilityCache(doctorId, date);

      return appointment;
    } catch (error) {
      LoggerService.error('Error scheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} data - New appointment data
   * @returns {Promise<Object>} Updated appointment
   */
  static async rescheduleAppointment(appointmentId, data) {
    try {
      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const { doctorId, date, startTime } = data;

      // Validate availability (excluding current appointment)
      const isAvailable = await this.checkAvailability(
        doctorId,
        date,
        startTime,
        appointmentId
      );
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }

      // Update appointment
      const updated = await appointment.update({
        ...data,
        endTime: this.calculateEndTime(startTime),
        status: 'rescheduled'
      });

      // Clear availability cache
      this.clearAvailabilityCache(doctorId, date);
      if (appointment.doctorId !== doctorId) {
        this.clearAvailabilityCache(appointment.doctorId, appointment.date);
      }

      return updated;
    } catch (error) {
      LoggerService.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled appointment
   */
  static async cancelAppointment(appointmentId, reason) {
    try {
      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update appointment
      const cancelled = await appointment.update({
        status: 'cancelled',
        cancellationReason: reason
      });

      // Clear availability cache
      this.clearAvailabilityCache(appointment.doctorId, appointment.date);

      return cancelled;
    } catch (error) {
      LoggerService.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Get doctor schedule
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Doctor schedule
   */
  static async getDoctorSchedule(doctorId, options = {}) {
    try {
      const { startDate, endDate } = options;

      return await Appointment.findAll({
        where: {
          doctorId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'ASC'], ['startTime', 'ASC']]
      });
    } catch (error) {
      LoggerService.error('Error getting doctor schedule:', error);
      throw error;
    }
  }

  /**
   * Get patient schedule
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Patient schedule
   */
  static async getPatientSchedule(patientId, options = {}) {
    try {
      const { startDate, endDate } = options;

      return await Appointment.findAll({
        where: {
          patientId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'ASC'], ['startTime', 'ASC']]
      });
    } catch (error) {
      LoggerService.error('Error getting patient schedule:', error);
      throw error;
    }
  }

  /**
   * Generate time slots
   * @private
   * @returns {Array} Time slots
   */
  static generateTimeSlots() {
    const slots = [];
    const [startHour] = this.BUSINESS_HOURS.start.split(':').map(Number);
    const [endHour] = this.BUSINESS_HOURS.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += this.APPOINTMENT_DURATION) {
        slots.push(
          `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        );
      }
    }

    return slots;
  }

  /**
   * Calculate end time
   * @private
   * @param {string} startTime - Start time
   * @returns {string} End time
   */
  static calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.APPOINTMENT_DURATION;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  /**
   * Check availability
   * @private
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date
   * @param {string} startTime - Start time
   * @param {string} [excludeAppointmentId] - Appointment ID to exclude
   * @returns {Promise<boolean>} Whether time slot is available
   */
  static async checkAvailability(doctorId, date, startTime, excludeAppointmentId = null) {
    const endTime = this.calculateEndTime(startTime);

    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        date,
        status: {
          [Op.notIn]: ['cancelled', 'rejected']
        },
        id: {
          [Op.ne]: excludeAppointmentId
        },
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
        ]
      }
    });

    return !conflictingAppointment;
  }

  /**
   * Clear availability cache
   * @private
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date
   */
  static clearAvailabilityCache(doctorId, date) {
    const cacheKey = `${this.CACHE_PREFIX}availability:${doctorId}:${date}`;
    CacheService.delete(cacheKey);
  }
}

module.exports = ScheduleService;