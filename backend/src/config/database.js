const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Set reliable DNS servers to resolve MongoDB Atlas SRV records smoothly
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDB = async () => {
  try {
    // Priority: MONGODB_URI -> MONGODB_URI_PROD
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    logger.info(`[OK] MongoDB Connected: ${conn.connection.host}`);

    // Reconnection & Error Listeners
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Seed admin user
    // We use a try/catch here so if seeding fails, the DB connection stays alive
    try {
      await seedAdmin();
    } catch (seedError) {
      logger.error(`Admin seeding failed: ${seedError.message}`);
    }

    return conn;
  } catch (error) {
    logger.error(`[ERROR] MongoDB connection failed: ${error.message}`);
    // We exit here because the app cannot function without the DB
    process.exit(1);
  }
};

const seedAdmin = async () => {
  const User = require('../models/User');

  const adminExists = await User.findOne({ role: 'admin' });
  
  if (!adminExists) {
    logger.info('Seeding admin user...');
    
    await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@cybercrime.gov',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isVerified: true,
      phone: '9000000000',   // placeholder; real admin can update via profile
    });
    logger.info('[OK] Admin user seeded successfully');
  }
};

module.exports = connectDB;