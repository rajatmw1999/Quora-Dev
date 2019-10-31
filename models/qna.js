//jshint esversion:6
const mongoose = require('mongoose');

const qnaSchema = new mongoose.Schema({
  que: String,
  ans: []
});

module.exports = mongoose.model("Question", qnaSchema);
