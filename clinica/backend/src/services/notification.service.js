const { LoggerService } = require('./logger.service');
const { EmailService } = require('./email.service');
const { SMSService } = require('./sms.service');
const { QueueService } = require('./queue.service');
const { User } = require('../models');

class NotificationService {
  /**
   * Send notification
   * @param {Object} notification - Notification data
   * @returns {Promise<void>}
   */
  static async sendNotification(notification) {
    try {
      const { type, userId, data } = notification;

      // Get user preferences
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Determine notification channels based on user preferences
      const channels = user.notificationPreferences || ['email'];

      // Send notifications through each channel
      await Promise.all(
        channels.map(channel => this.sendThroughChannel(channel, user, type, data))
      );

      // Log notification
      LoggerService.info(`Notification sent to user ${userId}: ${type}`);
    } catch (error) {
      LoggerService.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send through specific channel
   * @private
   * @param {string} channel - Notification channel
   * @param {Object} user - User object
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendThroughChannel(channel, user, type, data) {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(user, type, data);
          break;
        case 'sms':
          await this.sendSMSNotification(user, type, data);
          break;
        case 'push':
          await this.sendPushNotification(user, type, data);
          break;
        default:
          LoggerService.warn(`Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      LoggerService.error(`Error sending ${channel} notification:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   * @private
   * @param {Object} user - User object
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendEmailNotification(user, type, data) {
    try {
      switch (type) {
        case 'appointment_reminder':
          await EmailService.sendAppointmentReminder(data.appointment);
          break;
        case 'appointment_confirmation':
          await EmailService.sendAppointmentConfirmation(data.appointment);
          break;
        case 'medical_record_update':
          await EmailService.sendMedicalRecordUpdate(data.medicalHistory);
          break;
        case 'prescription':
          await EmailService.sendPrescriptionNotification(data.prescription);
          break;
        default:
          LoggerService.warn(`Unknown email notification type: ${type}`);
      }
    } catch (error) {
      LoggerService.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   * @private
   * @param {Object} user - User object
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendSMSNotification(user, type, data) {
    try {
      switch (type) {
        case 'appointment_reminder':
          await SMSService.sendAppointmentReminder(data.appointment);
          break;
        case 'appointment_confirmation':
          await SMSService.sendAppointmentConfirmation(data.appointment);
          break;
        case 'prescription':
          await SMSService.sendPrescriptionNotification(data.prescription);
          break;
        default:
          LoggerService.warn(`Unknown SMS notification type: ${type}`);
      }
    } catch (error) {
      LoggerService.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   * @private
   * @param {Object} user - User object
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendPushNotification(user, type, data) {
    try {
      if (!user.pushToken) {
        LoggerService.warn(`No push token for user ${user.id}`);
        return;
      }

      // Add to push notification queue
      await QueueService.addJob('notification', 'push_notification', {
        token: user.pushToken,
        type,
        data
      });
    } catch (error) {
      LoggerService.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send appointment notification
   * @param {string} type - Notification type
   * @param {Object} appointment - Appointment object
   * @returns {Promise<void>}
   */
  static async sendAppointmentNotification(type, appointment) {
    try {
      await this.sendNotification({
        type: `appointment_${type}`,
        userId: appointment.patientId,
        data: { appointment }
      });

      // Also notify doctor if needed
      if (['created', 'cancelled'].includes(type)) {
        await this.sendNotification({
          type: `appointment_${type}_doctor`,
          userId: appointment.doctorId,
          data: { appointment }
        });
      }
    } catch (error) {
      LoggerService.error('Error sending appointment notification:', error);
      throw error;
    }
  }

  /**
   * Send medical record notification
   * @param {Object} medicalHistory - Medical history object
   * @returns {Promise<void>}
   */
  static async sendMedicalRecordNotification(medicalHistory) {
    try {
      await this.sendNotification({
        type: 'medical_record_update',
        userId: medicalHistory.patientId,
        data: { medicalHistory }
      });
    } catch (error) {
      LoggerService.error('Error sending medical record notification:', error);
      throw error;
    }
  }

  /**
   * Send prescription notification
   * @param {Object} prescription - Prescription object
   * @returns {Promise<void>}
   */
  static async sendPrescriptionNotification(prescription) {
    try {
      await this.sendNotification({
        type: 'prescription',
        userId: prescription.patientId,
        data: { prescription }
      });
    } catch (error) {
      LoggerService.error('Error sending prescription notification:', error);
      throw error;
    }
  }

  /**
   * Send payment notification
   * @param {Object} notification - Payment notification data
   * @returns {Promise<void>}
   */
  static async sendPaymentNotification(notification) {
    try {
      await this.sendNotification({
        type: notification.type,
        userId: notification.userId,
        data: notification.data
      });
    } catch (error) {
      LoggerService.error('Error sending payment notification:', error);
      throw error;
    }
  }

  /**
   * Send emergency notification
   * @param {Object} emergency - Emergency data
   * @returns {Promise<void>}
   */
  static async sendEmergencyNotification(emergency) {
    try {
      // Notify doctor immediately via all channels
      await this.sendNotification({
        type: 'emergency',
        userId: emergency.doctorId,
        data: { emergency }
      });

      // Also notify admin staff
      const admins = await User.findAll({ where: { role: 'admin' } });
      await Promise.all(
        admins.map(admin =>
          this.sendNotification({
            type: 'emergency_admin',
            userId: admin.id,
            data: { emergency }
          })
        )
      );
    } catch (error) {
      LoggerService.error('Error sending emergency notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;