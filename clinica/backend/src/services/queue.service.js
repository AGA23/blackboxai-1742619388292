const Queue = require('bull');
const { LoggerService } = require('./logger.service');
const EmailService = require('./email.service');
const SMSService = require('./sms.service');
const NotificationService = require('./notification.service');

class QueueService {
  static queues = {
    email: new Queue('email', process.env.REDIS_URL),
    sms: new Queue('sms', process.env.REDIS_URL),
    notification: new Queue('notification', process.env.REDIS_URL),
    analysis: new Queue('analysis', process.env.REDIS_URL),
    report: new Queue('report', process.env.REDIS_URL)
  };

  /**
   * Initialize queues and processors
   */
  static init() {
    try {
      // Email queue processor
      this.queues.email.process(async (job) => {
        const { type, data } = job.data;
        LoggerService.info(`Processing email job: ${type}`);

        switch (type) {
          case 'welcome':
            await EmailService.sendWelcomeEmail(data.user);
            break;
          case 'appointment_confirmation':
            await EmailService.sendAppointmentConfirmation(data.appointment);
            break;
          case 'appointment_reminder':
            await EmailService.sendAppointmentReminder(data.appointment);
            break;
          case 'medical_record':
            await EmailService.sendMedicalRecordUpdate(data.medicalHistory);
            break;
          default:
            throw new Error(`Unknown email type: ${type}`);
        }
      });

      // SMS queue processor
      this.queues.sms.process(async (job) => {
        const { type, data } = job.data;
        LoggerService.info(`Processing SMS job: ${type}`);

        switch (type) {
          case 'appointment_confirmation':
            await SMSService.sendAppointmentConfirmation(data.appointment);
            break;
          case 'appointment_reminder':
            await SMSService.sendAppointmentReminder(data.appointment);
            break;
          case 'verification_code':
            await SMSService.sendVerificationCode(data.phone, data.code);
            break;
          default:
            throw new Error(`Unknown SMS type: ${type}`);
        }
      });

      // Notification queue processor
      this.queues.notification.process(async (job) => {
        const { type, data } = job.data;
        LoggerService.info(`Processing notification job: ${type}`);

        switch (type) {
          case 'appointment':
            await NotificationService.sendAppointmentNotification(data.notificationType, data.appointment);
            break;
          case 'medical_record':
            await NotificationService.sendMedicalRecordNotification(data.medicalHistory);
            break;
          case 'prescription':
            await NotificationService.sendPrescriptionNotification(data.prescription);
            break;
          default:
            throw new Error(`Unknown notification type: ${type}`);
        }
      });

      // Analysis queue processor
      this.queues.analysis.process(async (job) => {
        const { type, data } = job.data;
        LoggerService.info(`Processing analysis job: ${type}`);

        switch (type) {
          case 'treatment_effectiveness':
            await this.processTreatmentAnalysis(data);
            break;
          case 'clinic_statistics':
            await this.processClinicStatistics(data);
            break;
          default:
            throw new Error(`Unknown analysis type: ${type}`);
        }
      });

      // Report queue processor
      this.queues.report.process(async (job) => {
        const { type, data } = job.data;
        LoggerService.info(`Processing report job: ${type}`);

        switch (type) {
          case 'patient_report':
            await this.generatePatientReport(data);
            break;
          case 'clinic_report':
            await this.generateClinicReport(data);
            break;
          default:
            throw new Error(`Unknown report type: ${type}`);
        }
      });

      // Set up error handlers
      Object.values(this.queues).forEach(queue => {
        queue.on('error', error => {
          LoggerService.error(`Queue error: ${error.message}`, error);
        });

        queue.on('failed', (job, error) => {
          LoggerService.error(`Job ${job.id} failed: ${error.message}`, error);
        });
      });

      LoggerService.info('Queue service initialized');
    } catch (error) {
      LoggerService.error('Error initializing queue service:', error);
      throw error;
    }
  }

  /**
   * Add job to queue
   * @param {string} queueName - Queue name
   * @param {string} type - Job type
   * @param {Object} data - Job data
   * @param {Object} [options] - Job options
   * @returns {Promise<Object>} Created job
   */
  static async addJob(queueName, type, data, options = {}) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }

      const job = await queue.add({ type, data }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: true,
        ...options
      });

      LoggerService.info(`Added job ${job.id} to ${queueName} queue`);
      return job;
    } catch (error) {
      LoggerService.error(`Error adding job to ${queueName} queue:`, error);
      throw error;
    }
  }

  /**
   * Get queue status
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>} Queue status
   */
  static async getQueueStatus(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }

      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed
      };
    } catch (error) {
      LoggerService.error(`Error getting ${queueName} queue status:`, error);
      throw error;
    }
  }

  /**
   * Clean queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  static async cleanQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }

      await queue.clean(0, 'completed');
      await queue.clean(0, 'failed');

      LoggerService.info(`Cleaned ${queueName} queue`);
    } catch (error) {
      LoggerService.error(`Error cleaning ${queueName} queue:`, error);
      throw error;
    }
  }

  /**
   * Pause queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  static async pauseQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }

      await queue.pause();
      LoggerService.info(`Paused ${queueName} queue`);
    } catch (error) {
      LoggerService.error(`Error pausing ${queueName} queue:`, error);
      throw error;
    }
  }

  /**
   * Resume queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  static async resumeQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }

      await queue.resume();
      LoggerService.info(`Resumed ${queueName} queue`);
    } catch (error) {
      LoggerService.error(`Error resuming ${queueName} queue:`, error);
      throw error;
    }
  }

  /**
   * Close all queues
   * @returns {Promise<void>}
   */
  static async closeQueues() {
    try {
      await Promise.all(
        Object.values(this.queues).map(queue => queue.close())
      );
      LoggerService.info('All queues closed');
    } catch (error) {
      LoggerService.error('Error closing queues:', error);
      throw error;
    }
  }
}

module.exports = QueueService;