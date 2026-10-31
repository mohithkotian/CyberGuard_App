const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Set reliable DNS servers to resolve MongoDB Atlas SRV records smoothly
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // Ignore in environments where setting DNS servers is restricted
}

let isConnecting = false;
let retryTimeout = null;
let adminSeeded = false;

const seedAdmin = async () => {
  if (adminSeeded) return;
  try {
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
        phone: '9000000000',
      });
      logger.info('[OK] Admin user seeded successfully');
    }
    adminSeeded = true;
  } catch (seedError) {
    logger.error(`Admin seeding failed: ${seedError.message}`);
  }
};

// Setup connection listeners once
let listenersInitialized = false;
const initListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('connected', async () => {
    logger.info(`[OK] MongoDB Connected: ${mongoose.connection.host}`);
    await seedAdmin();
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message || err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Reconnecting in background...');
    scheduleRetry();
  });
};

const scheduleRetry = (delayMs = 5000) => {
  if (retryTimeout) clearTimeout(retryTimeout);
  retryTimeout = setTimeout(() => {
    connectDB().catch((err) => {
      logger.error(`MongoDB reconnection attempt failed: ${err.message}`);
    });
  }, delayMs);
};

const connectDB = async () => {
  initListeners();

  // If already connected or currently connecting, do nothing
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return;
  }

  isConnecting = true;

  const primaryUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  const connectionOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const tryConnect = async (uri, label = 'primary') => {
    logger.info(`Attempting MongoDB connection (${label})...`);
    return await mongoose.connect(uri, connectionOptions);
  };

  try {
    if (!primaryUri && !fallbackUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    let conn;
    try {
      if (primaryUri) {
        conn = await tryConnect(primaryUri, 'primary');
      }
    } catch (primaryErr) {
      logger.warn(`Primary MongoDB connection failed: ${primaryErr.message}`);

      if (fallbackUri && fallbackUri !== primaryUri) {
        logger.info('Attempting fallback MongoDB connection...');
        try {
          conn = await tryConnect(fallbackUri, 'fallback');
          logger.info('[OK] Connected via fallback MongoDB URI');
        } catch (fallbackErr) {
          logger.warn(`Fallback MongoDB connection failed: ${fallbackErr.message}`);
          throw fallbackErr;
        }
      } else {
        throw primaryErr;
      }
    }

    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    logger.error(`[ERROR] MongoDB connection failed: ${error.message}`);
    logger.warn('Backend server will continue running in degraded mode. Retrying connection in 5 seconds...');
    
    // Instead of crashing the entire backend with process.exit(1), schedule automatic retry
    scheduleRetry(5000);
  }
};

const getConnectionStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    stateCode: readyState,
    state: states[readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    isConnected: readyState === 1,
  };
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getConnectionStatus = getConnectionStatus;
