const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalHistory = sequelize.define('MedicalHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  // Información general de salud
  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  // Antecedentes y condiciones
  allergies: {
    type: DataTypes.JSONB,
    defaultValue: [],
    get() {
      const value = this.getDataValue('allergies');
      return value ? JSON.parse(JSON.stringify(value)) : [];
    }
  },
  chronicConditions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    get() {
      const value = this.getDataValue('chronicConditions');
      return value ? JSON.parse(JSON.stringify(value)) : [];
    }
  },
  currentMedications: {
    type: DataTypes.JSONB,
    defaultValue: [],
    get() {
      const value = this.getDataValue('currentMedications');
      return value ? JSON.parse(JSON.stringify(value)) : [];
    }
  },
  // Detalles de la consulta
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tratamiento de ozonoterapia
  oxygenSaturation: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  ozoneConcentration: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  treatmentDuration: {
    type: DataTypes.INTEGER, // en minutos
    allowNull: true,
    validate: {
      min: 0
    }
  },
  treatmentRoute: {
    type: DataTypes.ENUM('intravenosa', 'intramuscular', 'subcutánea', 'tópica', 'rectal', 'otro'),
    allowNull: true
  },
  // Seguimiento
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  followUpNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextAppointmentRecommended: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    {
      fields: ['patientId'],
      name: 'medical_history_patient'
    },
    {
      fields: ['appointmentId'],
      name: 'medical_history_appointment'
    }
  ]
});

// Método para calcular IMC
MedicalHistory.prototype.calculateBMI = function() {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
};

// Método para obtener resumen del historial
MedicalHistory.prototype.getSummary = function() {
  return {
    id: this.id,
    date: this.created_at,
    diagnosis: this.diagnosis,
    treatment: this.treatment,
    followUpRequired: this.followUpRequired,
    nextAppointmentRecommended: this.nextAppointmentRecommended
  };
};

module.exports = MedicalHistory;