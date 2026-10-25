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

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────
// ✅ FIXED CORS & SOCKET CONFIGURATION
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
  res.status(200).json({ status: 'ok', service: 'cyberguard-backend' });
});
// Evidence is served through the authorized complaint route below. Chat
// attachments retain their existing path until chat attachment authorization
// is handled in the dedicated chat security work.
app.use('/uploads/chats', express.static(path.join(__dirname, '..', 'uploads', 'chats')));
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
    const complaint = await Complaint.findOne(complaintLookup(complaintId)).select('userId assignedTo');
    if (!complaint || !canAccessComplaint(complaint, socket.user)) {
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Not authorized' });
      return;
    }
    socket.join(`chat-${complaintId}`);
    if (typeof acknowledge === 'function') acknowledge({ ok: true });
    logger.debug(`Socket ${socket.id} joined authorized chat room: chat-${complaintId}`);
  });

  // Relay real-time messages to the room
  socket.on('chat-message', async (data = {}) => {
    const complaint = await Complaint.findOne(complaintLookup(data.complaintId)).select('userId assignedTo');
    if (!complaint || !canAccessComplaint(complaint, socket.user)) return;
    const safeData = {
      ...data,
      sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
    };
    io.to(`chat-${data.complaintId}`).emit('new-chat-message', safeData);
  });

  // Global Network Chat
  socket.on('join-global', () => {
    socket.join('global-network');
    logger.debug(`Socket ${socket.id} joined global network chat`);
  });

  socket.on('global-message', (data = {}) => {
    io.to('global-network').emit('new-global-message', {
      ...data,
      sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
    });
  });

  // Admin Notification Room
  socket.on('join-admin', () => {
    if (socket.user.role !== 'admin') return;
    socket.join('admin-room');
    logger.debug(`Socket ${socket.id} joined admin-room`);
  });

  // User Notification Room
  socket.on('join-room', (userId) => {
    if (userId?.toString() !== socket.user._id.toString()) return;
    socket.join(`user-${userId}`);
    logger.debug(`Socket ${socket.id} joined user room: user-${userId}`);
  });

  // Private Messaging
  socket.on('join-user', (userId) => {
    if (userId?.toString() !== socket.user._id.toString()) return;
    socket.join(`user-${userId}`);
    logger.debug(`User ${userId} joined their private room: user-${userId}`);
  });

  socket.on('private-message', (data = {}) => {
    if (!data.recipientId) return;
    io.to(`user-${data.recipientId}`).to(`user-${socket.user._id}`).emit('new-private-message', {
      ...data,
      sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role }
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n⚠️  PORT ${PORT} IS ALREADY IN USE!`);
    console.error(`👉 Another instance of the backend is already running on port ${PORT}.`);
    console.error(`👉 To free the port on macOS, run: kill -9 $(lsof -ti:${PORT})\n`);
  } else {
    console.error(`❌ Server Error: ${error.message}`);
  }
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Main Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Startup Error: ${error.message}`);
  }
};

startServer();
