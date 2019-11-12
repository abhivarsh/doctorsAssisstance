const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  age: {
    type: Number
  },
  gender: {
    type: String
  },
  height: {
    type: String
  },
  weight: {
    type: Number
  },
  address: {
    street: {
      type: String
    },
    city: {
      type: String
    },
    pin: {
      type: String
    },
    country: {
      type: String
    }
  },
  phone: {
    type: String
  },
  message: {
    type: String
  },
  medicalHistory: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'medicalHistory'
  },
  appointmentScheduled: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'appointmentsScheduled'
  },
  notifications: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'notifications'
  }
});

module.exports = Profile = mongoose.model('profile', PatientProfileSchema);
