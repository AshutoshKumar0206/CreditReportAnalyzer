const CreditReport = require('../models/creditReport');
const { parseXMLFile, extractCreditData } = require('../utils/xmlParser');
const fs = require('fs');
const path = require('path');

module.exports.uploadCreditReport = async (req, res) => {
  try {
    // To Check that file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload an XML file.'
      });
    }

    console.log('File received:', req.file.originalname);

    // Parse XML file
    const parsedXML = await parseXMLFile(req.file.path);
    console.log('XML parsed successfully', parsedXML);

    // Extract credit data from parsed XML
    const creditData = extractCreditData(parsedXML);
    console.log('Data extracted successfully', creditData);

    // Validate extracted data
    if (!creditData.basicDetails.name) {
      throw new Error('Invalid XML structure: Missing required fields');
    }

    // Create new credit report
    const creditReport = new CreditReport({
      ...creditData,
      fileName: req.file.originalname
    });
    // Save to database
    await creditReport.save();
    console.log('Data saved to MongoDB');

    // Delete uploaded file after processing
    fs.unlinkSync(req.file.path);
    console.log('Temporary file deleted');

    // Send response
    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: creditReport
    });

  } catch (error) {
    console.error('Error in uploadCreditReport:', error.message);

    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error processing file'
    });
  }
};

module.exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'uploadDate', order = 'desc' } = req.query;

    const reports = await CreditReport.find()
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await CreditReport.countDocuments();

    res.status(200).json({
      success: true,
      count: reports.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: reports
    });

  } catch (error) {
    console.error('Error in getAllReports:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

module.exports.getReportById = async (req, res) => {
  try {
    const report = await CreditReport.findById(req.params.id).select('-__v');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in getReportById:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching report'
    });
  }
};

module.exports.deleteReport = async (req, res) => {
  try {
    const report = await CreditReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
      data: report
    });

  } catch (error) {
    console.error('Error in deleteReport:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting report'
    });
  }
};

module.exports.getStatistics = async (req, res) => {
  try {
    const totalReports = await CreditReport.countDocuments();
    const reports = await CreditReport.find().select('basicDetails.creditScore reportSummary.currentBalance');
    console.log('report', reports);
    const avgCreditScore = reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.basicDetails.creditScore, 0) / reports.length)
      : 0;

    const totalBalance = reports.reduce((sum, r) => sum + r.reportSummary.currentBalance, 0);

    const highScoreReports = reports.filter(r => r.basicDetails.creditScore >= 750).length;
    const mediumScoreReports = reports.filter(r => r.basicDetails.creditScore >= 650 && r.basicDetails.creditScore < 750).length;
    const lowScoreReports = reports.filter(r => r.basicDetails.creditScore < 650).length;

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        avgCreditScore,
        totalBalance,
        creditScoreDistribution: {
          excellent: highScoreReports,
          good: mediumScoreReports,
          needsImprovement: lowScoreReports
        }
      }
    });

  } catch (error) {
    console.error('Error in getStatistics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

module.exports.searchReports = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const reports = await CreditReport.find({
      $or: [
        { 'basicDetails.name': { $regex: query, $options: 'i' } },
        { 'basicDetails.pan': { $regex: query, $options: 'i' } },
        { 'basicDetails.mobile': { $regex: query, $options: 'i' } }
      ]
    }).select('-__v');

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('Error in searchReports:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error searching reports'
    });
  }
};
