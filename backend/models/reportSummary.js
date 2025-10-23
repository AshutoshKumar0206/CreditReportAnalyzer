const mongoose = require('mongoose');

const reportSummarySchema = new mongoose.Schema({
  totalAccounts: {
    type: Number,
    required: true,
    min: 0
  },
  activeAccounts: {
    type: Number,
    required: true,
    min: 0
  },
  closedAccounts: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  securedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  unsecuredAmount: {
    type: Number,
    required: true,
    min: 0
  },
  last7DaysEnquiries: {
    type: Number,
    required: true,
    min: 0
  }
});

module.exports = reportSummarySchema;