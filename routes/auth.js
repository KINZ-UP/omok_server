const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validation');
const verify = require('./verifyToken');

router.post('/register', async (req, res) => {
  //VALIDATION
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if the user is already in the database
  const usernameExist = await User.findOne({ username: req.body.username });
  if (usernameExist) return res.status(409).send('Username already exists');

  //Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //Create a new user
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
  });

  try {
    const savedUser = await user.save();
    // res.send({ user: savedUser._id });
    const token = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET);
    res.header('Authorization', token).send({ accessToken: token });
  } catch (err) {
    res.status(400).send(err);
  }
});

//LOGIN
router.post('/login', async (req, res) => {
  //VALIDATION
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if the username exists
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(409).send('Username does not exist');

  //Password is correct
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid password');

  //Update login date;
  user.lastLoggedIn = Date.now();
  await user.save();

  //Create and assign a token
  const token = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET);
  res.header('Authorization', token).send({ accessToken: token });
});

//CHECK
router.get('/check', verify, async (req, res) => {
  // console.log(req);
  const user = await User.findOne({ _id: req.user._id });
  if (!user) return res.status(400).send('UserId does not exist');
  res.send({ username: user.username });
});

module.exports = router;
