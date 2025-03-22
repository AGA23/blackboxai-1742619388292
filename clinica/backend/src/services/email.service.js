const nodemailer = require('nodemailer');
const { LoggerService } = require('./logger.service');

class EmailService {
  static transporter = null;

  /**
   * Initialize email transporter
   */
  static init() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      LoggerService.info('Email service initialized');
    } catch (error) {
      LoggerService.error('Error initializing email service:', error);
      throw error;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  static async sendEmail(options) {
    try {
      if (!this.transporter) {
        this.init();
      }

      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        ...options
      });

      LoggerService.info(`Email sent: ${result.messageId}`);
      return result;
    } catch (error) {
      LoggerService.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   * @param {Object} user - User object
   * @returns {Promise<Object>} Send result
   */
  static async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: '¡Bienvenido a Clínica de Ozonoterapia!',
      html: `
        <h1>¡Bienvenido ${user.firstName}!</h1>
        <p>Gracias por registrarte en nuestra clínica. Estamos emocionados de tenerte como paciente.</p>
        <p>Con tu cuenta podrás:</p>
        <ul>
          <li>Agendar citas</li>
          <li>Ver tu historial médico</li>
          <li>Recibir notificaciones importantes</li>
          <li>Comunicarte con tu doctor</li>
        </ul>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>¡Esperamos verte pronto!</p>
      `
    });
  }

  /**
   * Send appointment confirmation
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentConfirmation(appointment) {
    const { patient, doctor, branch } = appointment;
    return this.sendEmail({
      to: patient.email,
      subject: 'Confirmación de Cita',
      html: `
        <h1>Cita Confirmada</h1>
        <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
        <ul>
          <li>Fecha: ${appointment.date}</li>
          <li>Hora: ${appointment.startTime}</li>
          <li>Doctor: Dr. ${doctor.firstName} ${doctor.lastName}</li>
          <li>Sucursal: ${branch.name}</li>
          <li>Dirección: ${branch.address}</li>
        </ul>
        <p>Por favor llega 10 minutos antes de tu cita.</p>
        <p>Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.</p>
      `
    });
  }

  /**
   * Send appointment reminder
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentReminder(appointment) {
    const { patient, doctor, branch } = appointment;
    return this.sendEmail({
      to: patient.email,
      subject: 'Recordatorio de Cita',
      html: `
        <h1>Recordatorio de Cita</h1>
        <p>Te recordamos que tienes una cita programada para mañana:</p>
        <ul>
          <li>Fecha: ${appointment.date}</li>
          <li>Hora: ${appointment.startTime}</li>
          <li>Doctor: Dr. ${doctor.firstName} ${doctor.lastName}</li>
          <li>Sucursal: ${branch.name}</li>
          <li>Dirección: ${branch.address}</li>
        </ul>
        <p>Por favor llega 10 minutos antes de tu cita.</p>
        <p>Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.</p>
      `
    });
  }

  /**
   * Send appointment cancellation
   * @param {Object} appointment - Appointment object
   * @returns {Promise<Object>} Send result
   */
  static async sendAppointmentCancellation(appointment) {
    const { patient, doctor } = appointment;
    return this.sendEmail({
      to: patient.email,
      subject: 'Cita Cancelada',
      html: `
        <h1>Cita Cancelada</h1>
        <p>Tu cita ha sido cancelada:</p>
        <ul>
          <li>Fecha: ${appointment.date}</li>
          <li>Hora: ${appointment.startTime}</li>
          <li>Doctor: Dr. ${doctor.firstName} ${doctor.lastName}</li>
        </ul>
        <p>Si deseas reagendar tu cita, por favor contáctanos o agenda una nueva cita desde tu cuenta.</p>
      `
    });
  }

  /**
   * Send medical record update
   * @param {Object} medicalHistory - Medical history object
   * @returns {Promise<Object>} Send result
   */
  static async sendMedicalRecordUpdate(medicalHistory) {
    const { patient, doctor } = medicalHistory;
    return this.sendEmail({
      to: patient.email,
      subject: 'Actualización de Historial Médico',
      html: `
        <h1>Actualización de Historial Médico</h1>
        <p>El Dr. ${doctor.firstName} ${doctor.lastName} ha actualizado tu historial médico.</p>
        <p>Puedes ver los detalles iniciando sesión en tu cuenta.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `
    });
  }

  /**
   * Send password reset
   * @param {Object} user - User object
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Send result
   */
  static async sendPasswordReset(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Restablecer Contraseña',
      html: `
        <h1>Restablecer Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
      `
    });
  }

  /**
   * Send email verification
   * @param {Object} user - User object
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Send result
   */
  static async sendEmailVerification(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Verificar Email',
      html: `
        <h1>Verificar Email</h1>
        <p>Gracias por registrarte. Por favor verifica tu email:</p>
        <a href="${verifyUrl}">Verificar Email</a>
        <p>Este enlace expirará en 24 horas.</p>
      `
    });
  }
}

module.exports = EmailService;