//jshint esversion:6
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  username: String,
  desc: String
});

module.exports = mongoose.model("Feedback", feedbackSchema);
