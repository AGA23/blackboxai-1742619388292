const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { LoggerService } = require('./logger.service');
const { User, Appointment, MedicalHistory, Branch } = require('../models');
const { UtilService } = require('./util.service');
const { FileService } = require('./file.service');

class ReportService {
  /**
   * Generate patient report
   * @param {string} patientId - Patient ID
   * @param {string} format - Report format (pdf/excel)
   * @returns {Promise<Buffer>} Report buffer
   */
  static async generatePatientReport(patientId, format = 'pdf') {
    try {
      // Fetch patient data
      const patient = await User.findByPk(patientId, {
        include: [
          {
            model: MedicalHistory,
            as: 'medicalHistories',
            include: [
              {
                model: User,
                as: 'doctor',
                attributes: ['firstName', 'lastName']
              }
            ]
          },
          {
            model: Appointment,
            as: 'appointments',
            include: [
              {
                model: User,
                as: 'doctor',
                attributes: ['firstName', 'lastName']
              },
              {
                model: Branch,
                as: 'branch',
                attributes: ['name']
              }
            ]
          }
        ]
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      return format === 'pdf'
        ? this.generatePatientPDFReport(patient)
        : this.generatePatientExcelReport(patient);
    } catch (error) {
      LoggerService.error('Error generating patient report:', error);
      throw error;
    }
  }

  /**
   * Generate clinic report
   * @param {Object} options - Report options
   * @param {string} format - Report format (pdf/excel)
   * @returns {Promise<Buffer>} Report buffer
   */
  static async generateClinicReport(options = {}, format = 'pdf') {
    try {
      const { startDate, endDate } = options;
      const where = {};

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      // Fetch clinic data
      const [appointments, patients, doctors, branches] = await Promise.all([
        Appointment.findAll({ where }),
        User.count({ where: { ...where, role: 'patient' } }),
        User.count({ where: { ...where, role: 'doctor' } }),
        Branch.count({ where })
      ]);

      const data = {
        appointments,
        statistics: {
          totalPatients: patients,
          totalDoctors: doctors,
          totalBranches: branches,
          totalAppointments: appointments.length
        },
        period: {
          startDate,
          endDate
        }
      };

      return format === 'pdf'
        ? this.generateClinicPDFReport(data)
        : this.generateClinicExcelReport(data);
    } catch (error) {
      LoggerService.error('Error generating clinic report:', error);
      throw error;
    }
  }

  /**
   * Generate patient PDF report
   * @private
   * @param {Object} patient - Patient data
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generatePatientPDFReport(patient) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('Historial del Paciente', { align: 'center' });
        doc.moveDown();

        // Patient Info
        doc.fontSize(16).text('Información Personal');
        doc.fontSize(12)
          .text(`Nombre: ${patient.firstName} ${patient.lastName}`)
          .text(`Email: ${patient.email}`)
          .text(`Teléfono: ${patient.phone}`)
          .text(`Fecha de Nacimiento: ${UtilService.formatDate(patient.birthDate)}`)
          .moveDown();

        // Medical History
        doc.fontSize(16).text('Historial Médico');
        patient.medicalHistories.forEach(history => {
          doc.fontSize(12)
            .text(`Fecha: ${UtilService.formatDate(history.createdAt)}`)
            .text(`Doctor: Dr. ${history.doctor.firstName} ${history.doctor.lastName}`)
            .text(`Diagnóstico: ${history.diagnosis}`)
            .text(`Tratamiento: ${history.treatment}`)
            .text(`Síntomas: ${history.symptoms.join(', ')}`)
            .moveDown();
        });

        // Appointments
        doc.fontSize(16).text('Citas');
        patient.appointments.forEach(appointment => {
          doc.fontSize(12)
            .text(`Fecha: ${UtilService.formatDate(appointment.date)}`)
            .text(`Hora: ${appointment.startTime}`)
            .text(`Doctor: Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`)
            .text(`Sucursal: ${appointment.branch.name}`)
            .text(`Estado: ${appointment.status}`)
            .moveDown();
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate patient Excel report
   * @private
   * @param {Object} patient - Patient data
   * @returns {Promise<Buffer>} Excel buffer
   */
  static async generatePatientExcelReport(patient) {
    try {
      const workbook = new ExcelJS.Workbook();

      // Patient Info Sheet
      const infoSheet = workbook.addWorksheet('Información Personal');
      infoSheet.addRows([
        ['Nombre', `${patient.firstName} ${patient.lastName}`],
        ['Email', patient.email],
        ['Teléfono', patient.phone],
        ['Fecha de Nacimiento', UtilService.formatDate(patient.birthDate)]
      ]);

      // Medical History Sheet
      const historySheet = workbook.addWorksheet('Historial Médico');
      historySheet.addRow([
        'Fecha',
        'Doctor',
        'Diagnóstico',
        'Tratamiento',
        'Síntomas'
      ]);
      patient.medicalHistories.forEach(history => {
        historySheet.addRow([
          UtilService.formatDate(history.createdAt),
          `Dr. ${history.doctor.firstName} ${history.doctor.lastName}`,
          history.diagnosis,
          history.treatment,
          history.symptoms.join(', ')
        ]);
      });

      // Appointments Sheet
      const appointmentSheet = workbook.addWorksheet('Citas');
      appointmentSheet.addRow([
        'Fecha',
        'Hora',
        'Doctor',
        'Sucursal',
        'Estado'
      ]);
      patient.appointments.forEach(appointment => {
        appointmentSheet.addRow([
          UtilService.formatDate(appointment.date),
          appointment.startTime,
          `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          appointment.branch.name,
          appointment.status
        ]);
      });

      return workbook.xlsx.writeBuffer();
    } catch (error) {
      LoggerService.error('Error generating Excel report:', error);
      throw error;
    }
  }

  /**
   * Generate clinic PDF report
   * @private
   * @param {Object} data - Clinic data
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateClinicPDFReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('Reporte de la Clínica', { align: 'center' });
        doc.moveDown();

        // Period
        if (data.period.startDate && data.period.endDate) {
          doc.fontSize(12).text(
            `Periodo: ${UtilService.formatDate(data.period.startDate)} - ${UtilService.formatDate(data.period.endDate)}`
          );
          doc.moveDown();
        }

        // Statistics
        doc.fontSize(16).text('Estadísticas Generales');
        doc.fontSize(12)
          .text(`Total de Pacientes: ${data.statistics.totalPatients}`)
          .text(`Total de Doctores: ${data.statistics.totalDoctors}`)
          .text(`Total de Sucursales: ${data.statistics.totalBranches}`)
          .text(`Total de Citas: ${data.statistics.totalAppointments}`)
          .moveDown();

        // Appointment Statistics
        doc.fontSize(16).text('Estadísticas de Citas');
        const appointmentStats = this.calculateAppointmentStats(data.appointments);
        doc.fontSize(12)
          .text(`Completadas: ${appointmentStats.completed}`)
          .text(`Canceladas: ${appointmentStats.cancelled}`)
          .text(`Pendientes: ${appointmentStats.pending}`)
          .text(`Tasa de Asistencia: ${appointmentStats.attendanceRate}%`)
          .moveDown();

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate clinic Excel report
   * @private
   * @param {Object} data - Clinic data
   * @returns {Promise<Buffer>} Excel buffer
   */
  static async generateClinicExcelReport(data) {
    try {
      const workbook = new ExcelJS.Workbook();

      // Statistics Sheet
      const statsSheet = workbook.addWorksheet('Estadísticas Generales');
      statsSheet.addRows([
        ['Periodo', `${UtilService.formatDate(data.period.startDate)} - ${UtilService.formatDate(data.period.endDate)}`],
        ['Total de Pacientes', data.statistics.totalPatients],
        ['Total de Doctores', data.statistics.totalDoctors],
        ['Total de Sucursales', data.statistics.totalBranches],
        ['Total de Citas', data.statistics.totalAppointments]
      ]);

      // Appointments Sheet
      const appointmentSheet = workbook.addWorksheet('Citas');
      appointmentSheet.addRow([
        'Fecha',
        'Paciente',
        'Doctor',
        'Sucursal',
        'Estado'
      ]);
      data.appointments.forEach(appointment => {
        appointmentSheet.addRow([
          UtilService.formatDate(appointment.date),
          `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          appointment.branch.name,
          appointment.status
        ]);
      });

      return workbook.xlsx.writeBuffer();
    } catch (error) {
      LoggerService.error('Error generating Excel report:', error);
      throw error;
    }
  }

  /**
   * Calculate appointment statistics
   * @private
   * @param {Array} appointments - Appointments data
   * @returns {Object} Appointment statistics
   */
  static calculateAppointmentStats(appointments) {
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const pending = appointments.filter(a => a.status === 'scheduled').length;
    const total = appointments.length;

    return {
      completed,
      cancelled,
      pending,
      attendanceRate: total ? Math.round((completed / total) * 100) : 0
    };
  }
}

module.exports = ReportService;