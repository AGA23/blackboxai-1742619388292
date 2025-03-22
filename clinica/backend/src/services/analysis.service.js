const { LoggerService } = require('./logger.service');
const { MedicalHistory, Appointment, User } = require('../models');
const { Op } = require('sequelize');

class AnalysisService {
  /**
   * Calculate treatment effectiveness
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Treatment effectiveness analysis
   */
  static async analyzeTreatmentEffectiveness(patientId) {
    try {
      const medicalHistory = await MedicalHistory.findAll({
        where: { patientId },
        order: [['createdAt', 'ASC']]
      });

      if (!medicalHistory.length) {
        return {
          effectiveness: null,
          trend: null,
          recommendations: ['No hay suficientes datos para el análisis']
        };
      }

      // Analyze symptoms improvement
      const symptomsAnalysis = this.analyzeSymptoms(medicalHistory);

      // Analyze ozone treatment response
      const ozoneAnalysis = this.analyzeOzoneTreatment(medicalHistory);

      // Generate recommendations
      const recommendations = this.generateRecommendations(symptomsAnalysis, ozoneAnalysis);

      return {
        effectiveness: ozoneAnalysis.effectiveness,
        trend: ozoneAnalysis.trend,
        symptomsProgress: symptomsAnalysis,
        ozoneResponse: ozoneAnalysis,
        recommendations
      };
    } catch (error) {
      LoggerService.error('Error analyzing treatment effectiveness:', error);
      throw error;
    }
  }

  /**
   * Analyze patient attendance
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Attendance analysis
   */
  static async analyzeAttendance(patientId) {
    try {
      const appointments = await Appointment.findAll({
        where: { patientId }
      });

      const total = appointments.length;
      const attended = appointments.filter(app => app.status === 'completed').length;
      const cancelled = appointments.filter(app => app.status === 'cancelled').length;
      const missed = appointments.filter(app => app.status === 'missed').length;

      return {
        total,
        attended,
        cancelled,
        missed,
        attendanceRate: total ? (attended / total) * 100 : 0,
        cancellationRate: total ? (cancelled / total) * 100 : 0,
        missedRate: total ? (missed / total) * 100 : 0
      };
    } catch (error) {
      LoggerService.error('Error analyzing attendance:', error);
      throw error;
    }
  }

  /**
   * Generate clinic statistics
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Clinic statistics
   */
  static async generateClinicStatistics(options = {}) {
    try {
      const { startDate, endDate } = options;
      const whereClause = {};

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      // Appointments statistics
      const appointments = await Appointment.findAll({ where: whereClause });
      const appointmentStats = this.calculateAppointmentStatistics(appointments);

      // Patient demographics
      const patients = await User.findAll({
        where: { role: 'patient', ...whereClause }
      });
      const demographics = this.analyzeDemographics(patients);

      // Treatment statistics
      const treatments = await MedicalHistory.findAll({ where: whereClause });
      const treatmentStats = this.calculateTreatmentStatistics(treatments);

      return {
        appointmentStats,
        demographics,
        treatmentStats,
        periodSummary: {
          startDate,
          endDate,
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          totalTreatments: treatments.length
        }
      };
    } catch (error) {
      LoggerService.error('Error generating clinic statistics:', error);
      throw error;
    }
  }

  /**
   * Analyze treatment patterns
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Treatment patterns analysis
   */
  static async analyzeTreatmentPatterns(doctorId) {
    try {
      const treatments = await MedicalHistory.findAll({
        where: { doctorId },
        include: [
          { model: User, as: 'patient' }
        ]
      });

      const patternsByCondition = this.groupTreatmentsByCondition(treatments);
      const effectivenessByRoute = this.analyzeEffectivenessByRoute(treatments);
      const concentrationPatterns = this.analyzeConcentrationPatterns(treatments);

      return {
        patternsByCondition,
        effectivenessByRoute,
        concentrationPatterns,
        summary: {
          totalTreatments: treatments.length,
          averageEffectiveness: this.calculateAverageEffectiveness(treatments),
          mostCommonConditions: this.getMostCommonConditions(treatments)
        }
      };
    } catch (error) {
      LoggerService.error('Error analyzing treatment patterns:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  static analyzeSymptoms(medicalHistory) {
    const initialSymptoms = medicalHistory[0].symptoms;
    const latestSymptoms = medicalHistory[medicalHistory.length - 1].symptoms;
    
    const improvedSymptoms = initialSymptoms.filter(s => !latestSymptoms.includes(s));
    const persistentSymptoms = initialSymptoms.filter(s => latestSymptoms.includes(s));
    const newSymptoms = latestSymptoms.filter(s => !initialSymptoms.includes(s));

    return {
      improved: improvedSymptoms,
      persistent: persistentSymptoms,
      new: newSymptoms,
      improvementRate: (improvedSymptoms.length / initialSymptoms.length) * 100
    };
  }

  static analyzeOzoneTreatment(medicalHistory) {
    const concentrations = medicalHistory.map(h => h.ozoneConcentration);
    const initialConcentration = concentrations[0];
    const latestConcentration = concentrations[concentrations.length - 1];
    
    const trend = latestConcentration < initialConcentration ? 'decreasing' :
                 latestConcentration > initialConcentration ? 'increasing' : 'stable';

    return {
      effectiveness: this.calculateEffectiveness(medicalHistory),
      concentrationTrend: trend,
      averageConcentration: concentrations.reduce((a, b) => a + b) / concentrations.length,
      totalSessions: medicalHistory.length
    };
  }

  static calculateEffectiveness(medicalHistory) {
    // Complex effectiveness calculation based on multiple factors
    const symptomsImprovement = this.analyzeSymptoms(medicalHistory).improvementRate;
    const concentrationOptimization = this.calculateConcentrationOptimization(medicalHistory);
    const treatmentAdherence = this.calculateTreatmentAdherence(medicalHistory);

    return (symptomsImprovement * 0.5) + (concentrationOptimization * 0.3) + (treatmentAdherence * 0.2);
  }

  static calculateConcentrationOptimization(medicalHistory) {
    const concentrations = medicalHistory.map(h => h.ozoneConcentration);
    const optimal = 40; // Example optimal concentration
    const deviations = concentrations.map(c => Math.abs(c - optimal) / optimal);
    return (1 - (deviations.reduce((a, b) => a + b) / deviations.length)) * 100;
  }

  static calculateTreatmentAdherence(medicalHistory) {
    const scheduledDates = medicalHistory.map(h => new Date(h.createdAt));
    const intervals = [];
    
    for (let i = 1; i < scheduledDates.length; i++) {
      intervals.push(scheduledDates[i] - scheduledDates[i-1]);
    }

    const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const expectedInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    return (1 - Math.abs(averageInterval - expectedInterval) / expectedInterval) * 100;
  }

  static generateRecommendations(symptomsAnalysis, ozoneAnalysis) {
    const recommendations = [];

    if (symptomsAnalysis.improvementRate < 50) {
      recommendations.push('Considerar ajuste en el protocolo de tratamiento');
    }

    if (ozoneAnalysis.effectiveness < 70) {
      recommendations.push('Evaluar incremento en la concentración de ozono');
    }

    if (ozoneAnalysis.totalSessions < 10) {
      recommendations.push('Continuar con el ciclo completo de tratamiento');
    }

    return recommendations;
  }

  static calculateAppointmentStatistics(appointments) {
    return {
      total: appointments.length,
      byStatus: {
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        missed: appointments.filter(a => a.status === 'missed').length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length
      },
      byType: {
        firstTime: appointments.filter(a => a.type === 'primera_vez').length,
        followUp: appointments.filter(a => a.type === 'seguimiento').length,
        control: appointments.filter(a => a.type === 'control').length
      }
    };
  }

  static analyzeDemographics(patients) {
    return {
      gender: {
        male: patients.filter(p => p.gender === 'male').length,
        female: patients.filter(p => p.gender === 'female').length,
        other: patients.filter(p => p.gender === 'other').length
      },
      ageGroups: {
        under18: patients.filter(p => this.calculateAge(p.birthDate) < 18).length,
        '18-30': patients.filter(p => {
          const age = this.calculateAge(p.birthDate);
          return age >= 18 && age <= 30;
        }).length,
        '31-50': patients.filter(p => {
          const age = this.calculateAge(p.birthDate);
          return age >= 31 && age <= 50;
        }).length,
        over50: patients.filter(p => this.calculateAge(p.birthDate) > 50).length
      }
    };
  }

  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

module.exports = AnalysisService;