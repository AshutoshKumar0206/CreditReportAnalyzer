const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Permanent', 'Current', 'Office'],
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = addressSchema;