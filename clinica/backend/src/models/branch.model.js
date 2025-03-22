const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  operatingHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: null, close: null }
    },
    validate: {
      isValidSchedule(value) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        for (const day of days) {
          if (!value[day]) {
            throw new Error(`Missing schedule for ${day}`);
          }

          const { open, close } = value[day];
          
          // Allow null values for closed days
          if (open === null && close === null) continue;

          if (!timeRegex.test(open) || !timeRegex.test(close)) {
            throw new Error(`Invalid time format for ${day}`);
          }

          if (open >= close) {
            throw new Error(`Closing time must be after opening time for ${day}`);
          }
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  services: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  coordinates: {
    type: DataTypes.JSONB,
    allowNull: true,
    validate: {
      isValidCoordinates(value) {
        if (value) {
          if (!value.latitude || !value.longitude) {
            throw new Error('Coordinates must include latitude and longitude');
          }
          if (typeof value.latitude !== 'number' || typeof value.longitude !== 'number') {
            throw new Error('Coordinates must be numbers');
          }
          if (value.latitude < -90 || value.latitude > 90) {
            throw new Error('Invalid latitude value');
          }
          if (value.longitude < -180 || value.longitude > 180) {
            throw new Error('Invalid longitude value');
          }
        }
      }
    }
  }
});

// Instance method to check if branch is open at a specific time
Branch.prototype.isOpenAt = function(date) {
  const dayOfWeek = date.toLocaleLowerCase();
  const time = date.toTimeString().slice(0, 5);
  const schedule = this.operatingHours[dayOfWeek];

  if (!schedule.open || !schedule.close) {
    return false;
  }

  return time >= schedule.open && time <= schedule.close;
};

// Instance method to get current capacity status
Branch.prototype.getCurrentCapacity = async function() {
  const currentAppointments = await this.getAppointments({
    where: {
      date: new Date(),
      status: 'scheduled'
    }
  });

  return {
    total: this.capacity,
    occupied: currentAppointments.length,
    available: this.capacity - currentAppointments.length
  };
};

module.exports = Branch;