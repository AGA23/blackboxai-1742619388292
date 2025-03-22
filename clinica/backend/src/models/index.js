const sequelize = require('../config/database');
const User = require('./user.model');
const Appointment = require('./appointment.model');
const MedicalHistory = require('./medicalHistory.model');
const Branch = require('./branch.model');

// User - Appointment Associations
User.hasMany(Appointment, {
  foreignKey: 'patientId',
  as: 'patientAppointments'
});
User.hasMany(Appointment, {
  foreignKey: 'doctorId',
  as: 'doctorAppointments'
});
Appointment.belongsTo(User, {
  foreignKey: 'patientId',
  as: 'patient'
});
Appointment.belongsTo(User, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// Branch - Appointment Associations
Branch.hasMany(Appointment, {
  foreignKey: 'branchId',
  as: 'appointments'
});
Appointment.belongsTo(Branch, {
  foreignKey: 'branchId',
  as: 'branch'
});

// User - MedicalHistory Associations
User.hasMany(MedicalHistory, {
  foreignKey: 'patientId',
  as: 'patientHistories'
});
User.hasMany(MedicalHistory, {
  foreignKey: 'doctorId',
  as: 'doctorHistories'
});
MedicalHistory.belongsTo(User, {
  foreignKey: 'patientId',
  as: 'patient'
});
MedicalHistory.belongsTo(User, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// Appointment - MedicalHistory Associations
Appointment.hasOne(MedicalHistory, {
  foreignKey: 'appointmentId',
  as: 'medicalHistory'
});
MedicalHistory.belongsTo(Appointment, {
  foreignKey: 'appointmentId',
  as: 'appointment'
});

// Branch - Doctor Association (Many-to-Many)
const DoctorBranch = sequelize.define('DoctorBranch', {}, { timestamps: true });
User.belongsToMany(Branch, {
  through: DoctorBranch,
  foreignKey: 'doctorId',
  constraints: false,
  scope: {
    role: 'doctor'
  }
});
Branch.belongsToMany(User, {
  through: DoctorBranch,
  foreignKey: 'branchId',
  constraints: false
});

module.exports = {
  sequelize,
  User,
  Appointment,
  MedicalHistory,
  Branch,
  DoctorBranch
};