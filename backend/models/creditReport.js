const mongoose = require('mongoose');
const detailsSchema = require('./details');
const reportSummarySchema = require('./reportSummary');
const creditAccountSchema = require('./creditAccount');
const addressSchema = require('./address');

const creditReportSchema = new mongoose.Schema({
  basicDetails: {
    type: detailsSchema,
    required: true
  },
  reportSummary: {
    type: reportSummarySchema,
    required: true
  },
  creditAccounts: {
    type: [creditAccountSchema],
    default: []
  },
  addresses: {
    type: [addressSchema],
    default: []
  },
  fileName: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

creditReportSchema.index({ 'basicDetails.pan': 1 });
creditReportSchema.index({ uploadDate: -1 });
creditReportSchema.index({ 'basicDetails.creditScore': 1 });

module.exports = mongoose.model('CreditReport', creditReportSchema);