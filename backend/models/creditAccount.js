const mongoose = require('mongoose');

const creditAccountSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  bank: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  amountOverdue: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Closed', 'Pending', 'Defaulted'],
  }
});

module.exports = creditAccountSchema;