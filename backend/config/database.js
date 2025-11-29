const mongoose = require("mongoose");

let isMongoConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    isMongoConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("⚠️  Falling back to in-memory storage");
    isMongoConnected = false;
  }
};

const isConnected = () => isMongoConnected;

module.exports = { connectDB, isConnected };
