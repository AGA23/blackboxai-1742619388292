const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
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
  branchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  type: {
    type: DataTypes.ENUM('first_visit', 'follow_up'),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  indexes: [
    {
      fields: ['date', 'doctorId'],
      name: 'appointment_date_doctor'
    },
    {
      fields: ['patientId'],
      name: 'appointment_patient'
    }
  ],
  validate: {
    timeOrder() {
      if (this.startTime >= this.endTime) {
        throw new Error('End time must be after start time');
      }
    },
    futureDate() {
      if (this.date < new Date().toISOString().split('T')[0]) {
        throw new Error('Appointment date must be in the future');
      }
    }
  }
});

// Instance method to check if appointment can be cancelled
Appointment.prototype.canBeCancelled = function() {
  const appointmentDate = new Date(this.date + ' ' + this.startTime);
  const now = new Date();
  const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
  
  return hoursDifference >= 24 && this.status === 'scheduled';
};

// Instance method to format appointment details
Appointment.prototype.getFormattedDetails = function() {
  return {
    id: this.id,
    date: this.date,
    startTime: this.startTime,
    endTime: this.endTime,
    status: this.status,
    type: this.type,
    notes: this.notes
  };
};

module.exports = Appointment;