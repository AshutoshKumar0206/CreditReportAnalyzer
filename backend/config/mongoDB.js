const mongoose = require('mongoose');

const connectDB = async (req, res) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'MongoDB Connection Error',
    });
  }
};

module.exports = connectDB;