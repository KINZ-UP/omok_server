const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 1024,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  lastLoggedIn: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
