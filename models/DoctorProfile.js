const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  gender: {
    type: String
  },
  category: {
    type: String,
    require: true
  },
  hospitalAddress: {
    street: {
      type: String,
      require: true
    },
    city: {
      type: String,
      require: true
    },
    state: {
      type: String,
      require: true
    },
    pin: {
      type: Number,
      require: true
    },
    country: {
      type: String,
      require: true
    }
  },
  phone: {
    type: String,
    require: true
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
      fromDate: {
        type: Date,
        required: true
      },
      toDate: {
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
      fromDate: {
        type: Date,
        required: true
      },
      toDate: {
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
        type: mongoose.Schema.Types.ObjectId,
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

module.exports = DoctorProfile = mongoose.model(
  'doctorProfile',
  DoctorProfileSchema
);
