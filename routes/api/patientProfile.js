var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const gravator = require('gravatar');
const { check, validationResult } = require('express-validator');

//Get doctor profile module
const Patient = require('../../models/PatientProfile');

//@Route api/profile/patients
//@Desc Get all patients profile
//@Access Public
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();

    if (!patients) {
      return res.status(404).json({ msg: 'No Patients found' });
    }
    let patientsList = {};
    patients.forEach(function(patient) {
      patientsList[patient.id] = patient;
    });

    res.json(patientsList);
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
router.get('/:patient_id', (req, res) => {});

//@Route api/profile/patients/
//@Desc Add or Update patients profile
//@Access private
router.post('/', (req, res) => {});

module.exports = router;
