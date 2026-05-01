/* ============================================================
   MongoDB Connection Configuration
   ============================================================ */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qimora');
    console.log(`✦  MongoDB connected → ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Don't exit — landing page works without DB
    console.warn('⚠  Running without database. Contact form will be unavailable.');
  }
};

module.exports = connectDB;
