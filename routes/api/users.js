const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const gravator = require('gravatar');
const { check, validationResult } = require('express-validator');
//Get user module
const User = require('../../models/User');

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

module.exports = router;
