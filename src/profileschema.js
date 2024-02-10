const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  //salt: { type: String, required: true },
  hash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  zipcode: { type: String, required: true },
  phone: { type: String, required: true },
  avatar: { type: String, required: false },// Optional field
  headline: { type: String, required: false } // Optional field
});

module.exports = mongoose.model('Profile', userSchema);

