const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('========================================================');
    console.error(`MongoDB Connection Failed: ${error.message}`);
    console.error('Please make sure MongoDB is running on your machine.');
    console.error('Command to start on Windows (Admin CMD): net start MongoDB');
    console.error('========================================================');
  }
};

module.exports = connectDB;
