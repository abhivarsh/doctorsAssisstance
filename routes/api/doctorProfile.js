var express = require('express');
var router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const gravator = require('gravatar');
const { check, validationResult } = require('express-validator');

//Get doctor profile module
const Doctor = require('../../models/DoctorProfile');

//@Route api/profile/doctors
//@Desc Get all doctors profile
//@Access Public
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('user', ['name', 'avatar']);

    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@Route api/profile/doctors/:doc_id
//@Desc Get a single doctors profile
//@Access Public
router.get('/:doc_id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.params.doc_id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@Route api/profile/doctors
//@Desc Add or Update doctors profile
//@Access Private
router.post(
  '/',
  [
    auth,
    [
      check('category', 'Category must be mentioned')
        .not()
        .isEmpty(),
      check('street', 'Street is must')
        .not()
        .isEmpty(),
      check('city', 'City is must')
        .not()
        .isEmpty(),
      check('state', 'State is must')
        .not()
        .isEmpty(),
      check('pin', 'Pin is must')
        .not()
        .isEmpty(),
      check('country', 'Country is must')
        .not()
        .isEmpty(),
      check('phone', 'Phone number is must')
        .not()
        .isEmpty(),
      check('pin', 'Pin must be 5 characters long').isLength(5)
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      gender,
      category,
      street,
      city,
      pin,
      country,
      phone,
      message
    } = req.body;

    //build doctorProfile fields
    const doctorProfileFields = {};
    doctorProfileFields.user = req.user.id;
    if (gender) doctorProfileFields.gender = gender;
    if (category) doctorProfileFields.category = category;
    if (phone) doctorProfileFields.phone = phone;
    if (message) doctorProfileFields.message = message;

    //build address
    doctorProfileFields.hospitalAddress = {};
    doctorProfileFields.hospitalAddress.street = street;
    doctorProfileFields.hospitalAddress.city = city;
    doctorProfileFields.hospitalAddress.pin = pin;
    doctorProfileFields.hospitalAddress.country = country;

    try {
      let doctorProfile = await Doctor.findOne({ user: req.user.id });

      if (doctorProfile) {
        //update the profile
        doctorProfile = await Doctor.findOneAndUpdate(
          { user: req.user.id },
          { $set: doctorProfileFields },
          { new: true }
        );

        return res.json(doctorProfile);
      }

      //add new profile to the collection
      doctorProfile = new Doctor(doctorProfileFields);
      await doctorProfile.save();
      res.json(doctorProfile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error!!');
    }
  }
);

//@Route api/profile/doctors/category/:category
//@Desc Get all doctors profile for a category
//@Access Public
router.get('/category/:category', async (req, res) => {
  try {
    const doctors = await Doctor.find({ category: req.params.category });

    if (!doctors) {
      return res
        .status(404)
        .json({ msg: 'Doctors not found for the specified category' });
    }

    res.json(doctors);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res
        .status(404)
        .json({ msg: 'Doctors not found for the specified category' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile/doctors/comment/:doc_id
// @desc   Add a comment/feeback on a doctors profile
// access  PRIVATE
router.post(
  '/comment/:doc_id',
  [
    auth,
    [
      check('text', 'Text is Required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const doctor = await Doctor.findOne({ user: req.params.doc_id }).populate(
        'user',
        ['name', 'avatar']
      );

      const newComment = {
        text: req.body.text,
        name: doctor.name,
        avatar: doctor.avatar,
        user: req.user.id
      };

      doctor.comments.push(newComment);

      await doctor.save();
      res.json(doctor.comments);
    } catch (err) {
      console.error(err.message);
      if (err.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Post not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/doctors/comment/:doc_id/:comment_id
//@desc   Remove a comment/feedback from a doctors profile
//@access  PRIVATE
router.delete('/comment/:doc_id/:comment_id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.params.doc_id }).populate(
      'user',
      ['name', 'avatar']
    );

    //check if doctor exists
    if (!doctor) {
      return res.status(400).json({ msg: 'Doctor not found' });
    }

    //pull out comment
    const comment = doctor.comments.find(
      comment => comment.id === req.params.comment_id
    );

    //make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not authorized' });
    }

    //remove index
    const removeIndex = doctor.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);

    doctor.comments.splice(removeIndex, 1);

    await doctor.save();
    res.json(doctor.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile/doctors/education
// @desc   Add a education on a doctors profile
// access  PRIVATE
router.post(
  '/education',
  [
    auth,
    [
      check('school', 'School is Required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is Required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'FieldOfStudy is Required')
        .not()
        .isEmpty(),
      check('fromDate', 'From Date is Required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const doctor = await Doctor.findOne({ user: req.user.id }).populate(
        'user',
        ['name', 'avatar']
      );

      const {
        school,
        degree,
        fieldofstudy,
        fromDate,
        toDate,
        current,
        description
      } = req.body;

      const newEducation = {
        school,
        degree,
        fieldofstudy,
        fromDate,
        toDate,
        description,
        current
      };

      doctor.education.push(newEducation);

      await doctor.save();
      res.json(doctor.education);
    } catch (err) {
      console.error(err.message);
      if (err.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Doctor not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

//@route   DELETE api/profile/doctors/education/:education_id
//@desc    Remove a education from a doctors profile
//@access  PRIVATE
router.delete('/education/:education_id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    //check if doctor exists
    if (!doctor) {
      return res.status(400).json({ msg: 'Doctor not found' });
    }

    //pull out education
    const education = doctor.education.find(
      education => education.id === req.params.education_id
    );

    //make sure education exists
    if (!education) {
      return res.status(404).json({ msg: 'Education does not exist' });
    }

    //remove index
    const removeIndex = doctor.education
      .map(education => education.id)
      .indexOf(req.params.education_id);

    doctor.education.splice(removeIndex, 1);

    await doctor.save();
    res.json(doctor.education);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route   PUT api/profile/doctors/education/:education_id
//@desc    Update an education from a doctors profile
//@access  PRIVATE
router.put('/education/:education_id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    //check if doctor exists
    if (!doctor) {
      return res.status(400).json({ msg: 'Doctor not found' });
    }

    const {
      school,
      degree,
      fieldofstudy,
      fromDate,
      toDate,
      current,
      description
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      fromDate,
      toDate,
      description,
      current
    };

    //pull out education
    const education = doctor.education.find(
      education => education.id === req.params.education_id
    );

    //remove index
    const removeIndex = doctor.education
      .map(education => education.id)
      .indexOf(req.params.education_id);

    doctor.education.splice(removeIndex, 1);

    //make sure education exists
    if (!education) {
      return res.status(404).json({ msg: 'Education does not exist' });
    } else {
      //update the profile
      doctor.education.push(newEducation);
      await doctor.save();
      return res.json(doctor.education);
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile/doctors/experience
// @desc   Add a experience on a doctors profile
// access  PRIVATE
router.post(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is Required')
        .not()
        .isEmpty(),
      check('company', 'Company is Required')
        .not()
        .isEmpty(),
      check('location', 'Location is Required')
        .not()
        .isEmpty(),
      check('fromDate', 'From Date is Required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const doctor = await Doctor.findOne({ user: req.user.id }).populate(
        'user',
        ['name', 'avatar']
      );

      const {
        title,
        company,
        location,
        fromDate,
        toDate,
        current,
        description
      } = req.body;

      const newExperience = {
        title,
        company,
        location,
        fromDate,
        toDate,
        current,
        description
      };

      doctor.experience.push(newExperience);

      await doctor.save();
      res.json(doctor.experience);
    } catch (err) {
      console.error(err.message);
      if (err.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Doctor not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

//@route   DELETE api/profile/doctors/experience/:experience_id
//@desc    Remove an experience from a doctors profile
//@access  PRIVATE
router.delete('/experience/:experience_id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    //check if doctor exists
    if (!doctor) {
      return res.status(400).json({ msg: 'Doctor not found' });
    }

    //pull out experience
    const experience = doctor.experience.find(
      experience => experience.id === req.params.experience_id
    );

    //make sure experience exists
    if (!experience) {
      return res.status(404).json({ msg: 'Experience does not exist' });
    }

    //remove index
    const removeIndex = doctor.experience
      .map(experience => experience.id)
      .indexOf(req.params.experience_id);

    doctor.experience.splice(removeIndex, 1);

    await doctor.save();
    res.json(doctor.experience);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route   PUT api/profile/doctors/experience/:experience_id
//@desc    Update an experience from a doctors profile
//@access  PRIVATE
router.put('/experience/:experience_id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    //check if doctor exists
    if (!doctor) {
      return res.status(400).json({ msg: 'Doctor not found' });
    }

    const {
      title,
      company,
      location,
      fromDate,
      toDate,
      current,
      description
    } = req.body;

    const newExperience = {
      title,
      company,
      location,
      fromDate,
      toDate,
      current,
      description
    };

    //pull out experience
    const experience = doctor.experience.find(
      experience => experience.id === req.params.experience_id
    );

    //remove index
    const removeIndex = doctor.experience
      .map(experience => experience.id)
      .indexOf(req.params.experience_id);

    doctor.experience.splice(removeIndex, 1);

    //make sure experience exists
    if (!experience) {
      return res.status(404).json({ msg: 'Experience does not exist' });
    } else {
      //update the profile
      doctor.experience.push(newExperience);
      await doctor.save();
      return res.json(doctor.experience);
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
});
module.exports = router;
