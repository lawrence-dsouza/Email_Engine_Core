const mongoose = require('mongoose');

// MongoDB URI from environment variables
const mongoURI = process.env.MONGO_URI;

async function connectMongoDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit if connection fails
  }
}

module.exports = { connectMongoDB };