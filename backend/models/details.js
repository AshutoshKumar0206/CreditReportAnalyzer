const mongoose = require('mongoose');

const detailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  pan: {
    type: String,
    required: [true, 'PAN is required'],
    uppercase: true,
    trim: true
  },
  creditScore: {
    type: Number,
    required: [true, 'Credit score is required'],
  }
});

module.exports = detailsSchema;