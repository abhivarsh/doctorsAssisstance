const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const gravator = require('gravatar');
const { check, validationResult } = require('express-validator');

//Get user module
const User = require('../../models/User');

//Get doctor profile module
const Doctor = require('../../models/DoctorProfile');

//Get patient profile module
const Patient = require('../../models/PatientProfile');

//Get Appointment Scheduled Model
const AppointmentScheduled = require('../../models/AppointmentsScheduled');

//@route POST api/users
//@desc Register a user to the application
//@access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('role', 'Role is required')
      .not()
      .isEmpty(),
    check('role', 'Role should either be User or Doctor').isIn([
      'patient',
      'doctor'
    ])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role } = req.body;
    try {
      //see is the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists!!' }] });
      }

      //Get the gravitor of the user
      const avatar = gravator.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      user = new User({
        name,
        email,
        password,
        avatar,
        role
      });

      //Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      //return the JWT toekn to the user
      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 180000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .send('Server Error. Contact the administrator at (xxx) xxx-xxxx');
    }
  }
);

//@Route api/users
//@Desc Get all users
//@Access Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find();

    if (!users) {
      return res
        .status(404)
        .json({ msg: 'No users exists for the application' });
    }
    res.json(users);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: 'No users exists for the application' });
    }
    res.status(500).send('Server Error');
  }
});

//@Route api/users/:role
//@Desc Get all users for a given role
//@Access Public
router.get('/:role', async (req, res) => {
  const roles = ['doctor', 'patient'];
  if (!roles.includes(req.params.role)) {
    return res.status(400).json({ msg: 'Role mentioned is not correct' });
  }
  try {
    const users = await User.find({ role: req.params.role });

    if (!users) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(users);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@Route   DELETE api/users/appointment/:appointment_id
//@Desc    Delete an appointment
//@Access  Private
router.delete('/appointment/:appointment_id', auth, async (req, res) => {
  try {
    const appointment = await AppointmentScheduled.findById(
      req.params.appointment_id
    ).populate('notification', ['patientId', 'doctorId']);

    if (!appointment) {
      return res.status(400).json({ msg: 'Appointment not found' });
    }

    if (
      req.user.id !== appointment.notification.patientId.toString() &&
      req.user.id !== appointment.notification.doctorId.toString()
    ) {
      return res.status(401).json({ msg: 'User not authorized!!' });
    }

    const patient = await Patient.findOne({
      user: appointment.notification.patientId
    });

    if (!patient) {
      return res.status(400).json('Patient not found');
    }

    //remove Index
    let removeIndex = patient.appointmentScheduled.indexOf(
      req.user.appointment_id
    );
    patient.appointmentScheduled.splice(removeIndex, 1);
    await patient.save();

    const doctor = await Doctor.findOne({
      user: appointment.notification.doctorId
    });

    if (!doctor) {
      return res.status(400).json('Doctor not found');
    }
    //remove Index
    removeIndex = doctor.appointmentScheduled.indexOf(req.user.appointment_id);
    doctor.appointmentScheduled.splice(removeIndex, 1);
    await doctor.save();

    const apt = await AppointmentScheduled.findOneAndRemove({
      _id: req.params.appointment_id
    });

    res.json(apt);
  } catch (err) {
    console.error(err);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'User not found' });
    }
    return res.status(500).json('Server Error!!');
  }
});

module.exports = router;
