const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
  appointmentScheduled: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    require: true
  },
  title: {
    type: String,
    require: true
  },
  category: {
    type: String,
    require: true
  },
  symptoms: {
    type: [String],
    require: true
  },
  fullDescription: {
    type: String,
    require: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Notifications = mongoose.model(
  'notifications',
  notificationsSchema
);
