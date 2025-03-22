const twilio = require('twilio');
const { LoggerService } = require('./logger.service');

class SMSService {
  static client = null;

  /**
   * Initialize Twilio client
   */
  static init() {
    try {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      LoggerService.info('SMS service initialized');
    } catch (error) {
      LoggerService.error('Error initializing SMS service:', error);
      throw error;
    }
  }

  /**
   * Send SMS
   * @param {string} to - Recipient phone number
   * @param {string} body - Message body
   * @returns {Promise<Object>} Send result
   */
  static async sendSMS(to, body) {
    try {
      if (!this.client) {
        this.init();
      }

      const message = await this.client.messages.create({
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body
      });

      LoggerService.info(`SMS sent: ${message.sid}`);
      return message;
    } catch (error) {
      LoggerService.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentConfirmation(appointment) {
    const { patient, doctor, branch } = appointment;
    const message = 
      `Cita confirmada:\n` +
      `Fecha: ${appointment.date}\n` +
      `Hora: ${appointment.startTime}\n` +
      `Doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n` +
      `Sucursal: ${branch.name}\n` +
      `Por favor llega 10 minutos antes.`;

    return this.sendSMS(patient.phone, message);
  }

  /**
   * Send appointment reminder
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentReminder(appointment) {
    const { patient, doctor } = appointment;
    const message = 
      `Recordatorio: Tienes cita mañana\n` +
      `Hora: ${appointment.startTime}\n` +
      `Doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n` +
      `Por favor llega 10 minutos antes.`;

    return this.sendSMS(patient.phone, message);
  }

  /**
   * Send appointment cancellation
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentCancellation(appointment) {
    const { patient, doctor } = appointment;
    const message = 
      `Cita cancelada:\n` +
      `Fecha: ${appointment.date}\n` +
      `Hora: ${appointment.startTime}\n` +
      `Doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n` +
      `Para reagendar, contáctanos o agenda desde tu cuenta.`;

    return this.sendSMS(patient.phone, message);
  }

  /**
   * Send prescription notification
   * @param {Object} prescription - Prescription object
   * @returns {Promise<Object>} Send result
   */
  static async sendPrescriptionNotification(prescription) {
    const { patient, doctor } = prescription;
    const message = 
      `Nueva prescripción médica del\n` +
      `Dr. ${doctor.firstName} ${doctor.lastName}\n` +
      `Revisa tu email o cuenta para más detalles.`;

    return this.sendSMS(patient.phone, message);
  }

  /**
   * Send verification code
   * @param {string} phone - Phone number
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Send result
   */
  static async sendVerificationCode(phone, code) {
    const message = 
      `Tu código de verificación es: ${code}\n` +
      `Expira en 5 minutos.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send emergency notification
   * @param {Object} emergency - Emergency object
   * @returns {Promise<Object>} Send result
   */
  static async sendEmergencyNotification(emergency) {
    const { patient, doctor } = emergency;
    const message = 
      `¡EMERGENCIA MÉDICA!\n` +
      `Paciente: ${patient.firstName} ${patient.lastName}\n` +
      `Doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n` +
      `Por favor, contacte inmediatamente.`;

    return this.sendSMS(doctor.phone, message);
  }

  /**
   * Send appointment request
   * @param {Object} request - Appointment request object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentRequest(request) {
    const { patient, doctor } = request;
    const message = 
      `Nueva solicitud de cita:\n` +
      `Paciente: ${patient.firstName} ${patient.lastName}\n` +
      `Fecha preferida: ${request.preferredDate}\n` +
      `Por favor, revise su portal para aprobar/rechazar.`;

    return this.sendSMS(doctor.phone, message);
  }

  /**
   * Send test results notification
   * @param {Object} testResult - Test result object
   * @returns {Promise<Object>} Send result
   */
  static async sendTestResultNotification(testResult) {
    const { patient } = testResult;
    const message = 
      `Resultados disponibles para ${testResult.testType}\n` +
      `Revisa tu email o cuenta para más detalles.`;

    return this.sendSMS(patient.phone, message);
  }

  /**
   * Send payment confirmation
   * @param {Object} payment - Payment object
   * @returns {Promise<Object>} Send result
   */
  static async sendPaymentConfirmation(payment) {
    const { patient } = payment;
    const message = 
      `Pago confirmado: $${payment.amount}\n` +
      `Referencia: ${payment.reference}\n` +
      `Gracias por tu pago.`;

    return this.sendSMS(patient.phone, message);
  }
}

module.exports = SMSService;