const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  disease: {
    type: String,
    required: true
  },
  consultedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  symptoms: {
    type: [String]
  },
  treatment: {
    type: String
  },
  date: {
    type: Date
  }
});

module.exports = MedicalHistory = mongoose.model(
  'medicalHistory',
  MedicalHistorySchema
);
