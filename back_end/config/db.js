const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'mockai',
    });
  }

  try {
    const conn = await connectionPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    connectionPromise = undefined;
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (!process.env.VERCEL && require.main?.filename?.endsWith('server.js')) {
      process.exit(1);
    }

    throw error;
  }
};

module.exports = connectDB;
