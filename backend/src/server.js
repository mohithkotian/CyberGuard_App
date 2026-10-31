const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { getConnectionStatus } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const TokenBlacklist = require('./models/TokenBlacklist');

// Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const jarvisRoutes = require('./routes/jarvis');

// ─────────────────────────────────────────────────────────
// PROCESS ERROR RESILIENCE (PREVENT UNHANDLED CRASHES)
// ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error(`[UNCAUGHT EXCEPTION] ${err.message}`, { stack: err.stack });
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error(`[UNHANDLED REJECTION] ${message}`, { stack });
  console.error('[UNHANDLED REJECTION]', reason);
});

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────
// [OK] FIXED CORS & SOCKET CONFIGURATION
// ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:19006'
].join(',')).split(',').map(origin => origin.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Native mobile requests generally have no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Required for Preflight requests

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// ─────────────────────────────────────────────────────────
// SECURITY & PERFORMANCE
// ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('dev'));

// ─────────────────────────────────────────────────────────
// ROUTES & ERROR HANDLING
// ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  const isHealthy = dbStatus.isConnected;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'cyberguard-backend',
    database: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});
// Evidence is served through the authorized complaint route below. Chat
// attachments retain their existing path until chat attachment authorization
// is handled in the dedicated chat security work.
app.use('/uploads/chats', express.static(path.join(__dirname, '..', 'uploads', 'chats')));
app.use('/uploads/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars')));

// Global rate limiting for auth to prevent brute force
const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? req.body.email.toLowerCase().trim() : '';
    return `${req.ip}:${email}`;
  },
  skipSuccessfulRequests: true, // Only count failed logins
  message: { status: 'fail', message: 'Too many login attempts, please try again later' },
  skip: (req, res) => {
    const whitelistedEmails = ['pruthvishetty04@gmail.com', 'admin@cybercrime.gov'];
    if (req.body && req.body.email && whitelistedEmails.includes(req.body.email.toLowerCase())) {
      return true;
    }
    return false;
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/jarvis', jarvisRoutes);

app.use(notFound);
app.use(errorHandler);

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;
  return authToken || (header?.startsWith('Bearer ') ? header.slice(7) : null);
};

const canAccessComplaint = (complaint, user) => {
  const viewerId = user._id.toString();
  if (user.role === 'admin') return true;
  if (complaint.userId?.toString() === viewerId) return true;
  if (user.role === 'officer') {
    return !complaint.assignedTo || complaint.assignedTo.toString() === viewerId;
  }
  return false;
};

const complaintLookup = (complaintId) => /^[0-9a-fA-F]{24}$/.test(complaintId)
  ? { $or: [{ _id: complaintId }, { complaintId }] }
  : { complaintId };

io.use(async (socket, next) => {
  try {
    const token = getSocketToken(socket);
    if (!token) return next(new Error('Authentication required'));
    if (await TokenBlacklist.findOne({ token })) return next(new Error('Token revoked'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive || user.isLocked()) return next(new Error('Invalid user session'));

    socket.user = user;
    next();
  } catch (_) {
    next(new Error('Invalid or expired authentication token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join a specific complaint chat room
  socket.on('join-chat', async (complaintId, acknowledge) => {
    try {
      const complaint = await Complaint.findOne(complaintLookup(complaintId)).select('userId assignedTo');
      if (!complaint || !canAccessComplaint(complaint, socket.user)) {
        if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Not authorized' });
        return;
      }
      socket.join(`chat-${complaintId}`);
      if (typeof acknowledge === 'function') acknowledge({ ok: true });
      logger.debug(`Socket ${socket.id} joined authorized chat room: chat-${complaintId}`);
    } catch (err) {
      logger.error(`Error in join-chat: ${err.message}`);
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Internal server error' });
    }
  });

  // Relay real-time messages to the room
  socket.on('chat-message', async (data = {}) => {
    try {
      const complaint = await Complaint.findOne(complaintLookup(data.complaintId)).select('userId assignedTo');
      if (!complaint || !canAccessComplaint(complaint, socket.user)) return;
      const safeData = {
        ...data,
        sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
      };
      io.to(`chat-${data.complaintId}`).emit('new-chat-message', safeData);
    } catch (err) {
      logger.error(`Error in chat-message: ${err.message}`);
    }
  });

  // Global Network Chat
  socket.on('join-global', () => {
    try {
      socket.join('global-network');
      logger.debug(`Socket ${socket.id} joined global network chat`);
    } catch (err) {
      logger.error(`Error in join-global: ${err.message}`);
    }
  });

  socket.on('global-message', (data = {}) => {
    try {
      io.to('global-network').emit('new-global-message', {
        ...data,
        sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
      });
    } catch (err) {
      logger.error(`Error in global-message: ${err.message}`);
    }
  });

  // Admin Notification Room
  socket.on('join-admin', () => {
    try {
      if (socket.user.role !== 'admin') return;
      socket.join('admin-room');
      logger.debug(`Socket ${socket.id} joined admin-room`);
    } catch (err) {
      logger.error(`Error in join-admin: ${err.message}`);
    }
  });

  // User Notification Room
  socket.on('join-room', (userId) => {
    try {
      if (userId?.toString() !== socket.user._id.toString()) return;
      socket.join(`user-${userId}`);
      logger.debug(`Socket ${socket.id} joined user room: user-${userId}`);
    } catch (err) {
      logger.error(`Error in join-room: ${err.message}`);
    }
  });

  // Private Messaging
  socket.on('join-user', (userId) => {
    try {
      if (userId?.toString() !== socket.user._id.toString()) return;
      socket.join(`user-${userId}`);
      logger.debug(`User ${userId} joined their private room: user-${userId}`);
    } catch (err) {
      logger.error(`Error in join-user: ${err.message}`);
    }
  });

  socket.on('private-message', (data = {}) => {
    try {
      if (!data.recipientId) return;
      io.to(`user-${data.recipientId}`).to(`user-${socket.user._id}`).emit('new-private-message', {
        ...data,
        sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
      });
    } catch (err) {
      logger.error(`Error in private-message: ${err.message}`);
    }
  });

  socket.on('error', (err) => {
    logger.error(`Socket client error (${socket.id}): ${err.message}`);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─────────────────────────────────────────────────────────
// START SERVER & LIFECYCLE MANAGEMENT
// ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[WARN]️  PORT ${PORT} IS ALREADY IN USE!`);
    console.error(`[>>] Another instance of the backend is already running on port ${PORT}.`);
    console.error(`[>>] To free the port on macOS, run: kill -9 $(lsof -ti:${PORT})\n`);
  } else {
    console.error(`[ERROR] Server Error: ${error.message}`);
  }
  process.exit(1);
});

const startServer = () => {
  // Start HTTP server immediately to allow health checks and incoming connections
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[START] Main Server running on http://localhost:${PORT}`);
    logger.info(`Main Server running on port ${PORT}`);
  });

  // Asynchronously connect to MongoDB with automatic retry and fallback
  connectDB().catch((error) => {
    logger.error(`Initial MongoDB connection failed: ${error.message}. Server continues running in degraded mode.`);
  });
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error(`Error closing MongoDB: ${err.message}`);
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forceful shutdown timeout reached');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
