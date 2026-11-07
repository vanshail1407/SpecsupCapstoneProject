const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/specsup';
    const conn = await mongoose.connect(mongoUri);

    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.error('Tip: Make sure MongoDB is running locally (mongodb://127.0.0.1:27017) or provide a valid MONGO_URI (e.g., MongoDB Atlas) in backend/.env');
    // If not in production, do not crash immediately so helpful errors can be served
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
