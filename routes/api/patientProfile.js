var express = require('express');
var router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const gravator = require('gravatar');
const { check, validationResult } = require('express-validator');

//Get doctor profile module
const Patient = require('../../models/PatientProfile');

//Get Medical History model
const MedicalHistory = require('../../models/MedicalHistory');

//@Route api/profile/patients/medicalHistory
//@Desc Get all medical History of Patients
//@Access Private
router.get('/medicalHistory', auth, async (req, res) => {
  try {
    const medicalHistorys = await MedicalHistory.find({
      patientId: req.user.id
    }).populate('patientId', ['name', 'avatar']);

    res.json(medicalHistorys);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Patient not found' });
    }
    res.status(500).json('Server Error!!');
  }
});

//@Route api/profile/patients
//@Desc Get all patients profile
//@Access Public
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();

    if (!patients) {
      return res.status(404).json({ msg: 'No Patients found' });
    }

    res.json(patients);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: 'No Patients found' });
    }
    res.status(500).send('Server Error');
  }
});

//@Route api/profile/patients/:patient_id
//@Desc Get a single patient profile
//@Access Public
router.get('/:patient_id', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      user: req.params.patient_id
    }).populate('user', ['name', 'avatar']);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@Route api/profile/patients
//@Desc Add or Update patients profile
//@Access private
router.post('/', auth, async (req, res) => {
  const {
    age,
    gender,
    height,
    weight,
    street,
    city,
    state,
    pin,
    country,
    phone,
    message
  } = req.body;

  //build Patient Profile Fields
  const patientProfileFields = {};
  patientProfileFields.user = req.user.id;
  if (age) patientProfileFields.age = age;
  if (gender) patientProfileFields.gender = gender;
  if (height) patientProfileFields.height = height;
  if (weight) patientProfileFields.weight = weight;
  if (phone) patientProfileFields.phone = phone;
  if (message) patientProfileFields.message = message;

  //build patient address
  patientProfileFields.address = {};
  if (street) patientProfileFields.address.street = street;
  if (city) patientProfileFields.address.city = city;
  if (state) patientProfileFields.address.state = state;
  if (pin) patientProfileFields.address.pin = pin;
  if (country) patientProfileFields.address.country = country;

  try {
    let patientProfile = await Patient.findOne({ user: req.user.id });

    if (patientProfile) {
      //update the profile
      patientProfile = await Patient.findOneAndUpdate(
        { user: req.user.id },
        { $set: patientProfileFields },
        { $new: true }
      );

      return res.json(patientProfile);
    }

    //add a new profile
    patientProfile = new Patient(patientProfileFields);
    patientProfile.save();
    res.json(patientProfile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error!!');
  }
});

//@Route api/profile/patients/medicalHistory/:medical_id
//@Desc Get a single medical History of a Patient
//@Access Private
router.get('/medicalHistory/:medical_id', auth, async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.findById(
      req.params.medical_id
    ).populate('patientId', ['name', 'avatar']);
    res.json(medicalHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error!!');
  }
});

//@Route api/profile/patients/medicalHistory
//@Desc Add a medical History to a Patient profile
//@Access Private
router.post(
  '/medicalHistory',
  [
    auth,
    [
      check('disease', 'Disease must be mentioned')
        .not()
        .isEmpty(),
      check('symptoms', 'Symptoms must be mentioned')
        .not()
        .isEmpty(),
      check('treatment', 'Treatment must be mentioned')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { disease, consultedBy, symptoms, treatment, date } = req.body;

    //build medicalHistory Fields
    const medicalHistoryFields = {};
    medicalHistoryFields.patientId = req.user.id;
    if (disease) medicalHistoryFields.disease = disease;
    if (consultedBy) medicalHistoryFields.consultedBy = consultedBy;
    if (treatment) medicalHistoryFields.treatment = treatment;
    if (date) medicalHistoryFields.date = date;

    //transform symptoms string into an array
    if (symptoms) {
      medicalHistoryFields.symptoms = symptoms
        .split(',')
        .map(symptoms => symptoms.trim());
    }

    try {
      const medicalHistory = new MedicalHistory(medicalHistoryFields);
      const medicalHistoryObj = await medicalHistory.save();
      const patientProfile = await Patient.findOne({ user: req.user.id });
      console.log(patientProfile);
      patientProfile.medicalHistory.push(medicalHistoryObj.id);
      await patientProfile.save();
      res.json(patientProfile.medicalHistory);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server Error!!');
    }
  }
);

//@Route api/profile/patients/medicalHistory/:medical_id
//@Desc Delete a medical History from a Patient profile
//@Access Private
router.delete('/medicalHistory/:medical_id', auth, async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.findById(req.params.medical_id);

    //check if medicalHistory exists
    if (!medicalHistory) {
      return res.status(400).json({ msg: 'Medical History not found' });
    }

    const patientProfile = await Patient.findOne({ user: req.user.id });

    //remove index
    const removeIndex = patientProfile.medicalHistory.indexOf(
      req.params.medical_id
    );

    patientProfile.medicalHistory.splice(removeIndex, 1);
    await MedicalHistory.findOneAndRemove({ _id: req.params.medical_id });
    await patientProfile.save();
    res.json(patientProfile.medicalHistory);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Medical History not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@Route api/profile/patients/medicalHistory/:medical_id
//@Desc Update a medical History of a Patient Profile
//@Access Private
router.put('/medicalHistory/:medical_id', auth, async (req, res) => {
  try {
    let medicalHistory = await MedicalHistory.findById(req.params.medical_id);

    //check if Medical History exists
    if (!medicalHistory) {
      return res.status(400).json({ msg: 'Medical History not found' });
    }

    const { disease, consultedBy, symptoms, treatment, date } = req.body;

    //build medicalHistory Fields
    const medicalHistoryFields = {};
    medicalHistoryFields.patientId = req.user.id;
    if (disease) medicalHistoryFields.disease = disease;
    if (consultedBy) medicalHistoryFields.consultedBy = consultedBy;
    if (treatment) medicalHistoryFields.treatment = treatment;
    if (date) medicalHistoryFields.date = date;

    //transform symptoms string into an array
    if (symptoms) {
      medicalHistoryFields.symptoms = symptoms
        .split(',')
        .map(symptoms => symptoms.trim());
    }

    medicalHistory = await MedicalHistory.findOneAndUpdate(
      { _id: req.params.medical_id },
      { $set: medicalHistoryFields },
      { $new: true }
    );

    await medicalHistory.save();
    res.json(medicalHistory);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
