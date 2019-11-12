const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  scheduled: {
    type: Boolean,
    default: false
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'notifications'
  },
  appointmentDate: {
    type: Date,
    require: true
  },
  feedback: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'medicalHistory'
  }
});

module.exports = AppointmentsScheduled = mongoose.model(
  'appointmentsScheduled',
  AppointmentSchema
);
