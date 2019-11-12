const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  gender: {
    type: String
  },
  hospitalAddress: {
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
  experience: [
    {
      title: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],
  education: [
    {
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      fieldofstudy: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],
  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      },
      text: {
        type: String,
        require: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
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
