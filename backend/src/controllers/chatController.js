const Message = require('../models/Message');
const Complaint = require('../models/Complaint');
const { AppError } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'chats');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `chat-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'text/plain'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed.`, 400), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
}).array('attachments', 5);

// @desc    Get message history for a complaint
// @route   GET /api/chats/:complaintId
exports.getMessages = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    if (!complaintId || complaintId === 'undefined' || complaintId === 'null') {
      return res.json({ status: 'success', data: { messages: [] } });
    }

    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(complaintId);
    const complaint = await Complaint.findOne(
      isObjectId
        ? { $or: [{ _id: complaintId }, { complaintId }] }
        : { complaintId }
    );

    if (!complaint) {
      return res.json({ status: 'success', data: { messages: [] } });
    }

    // Access Control
    const isOwner = complaint.userId?.toString() === req.user._id.toString();
    const isOfficer = req.user.role === 'admin' || (req.user.role === 'officer' && (!complaint.assignedTo || complaint.assignedTo.toString() === req.user._id.toString()));
    
    if (!isOwner && !isOfficer) {
      return next(new AppError('Not authorized to access this chat', 403));
    }

    const messages = await Message.find({ complaintId: complaint._id })
      .populate('sender', 'name role avatar')
      .sort('createdAt');

    res.json({
      status: 'success',
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a new message (usually via socket, but available as fallback)
// @route   POST /api/chats/:complaintId
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, iv } = req.body;
    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        url: `/uploads/chats/${file.filename}`,
        mimetype: file.mimetype
      }));
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: req.params.complaintId }, { complaintId: req.params.complaintId }]
    });

    if (!complaint) return next(new AppError('Complaint not found', 404));

    // Access Control: sender must be case owner or assigned officer / admin
    const isOwner = complaint.userId?.toString() === req.user._id.toString();
    const isOfficer = req.user.role === 'admin' || (req.user.role === 'officer' && (!complaint.assignedTo || complaint.assignedTo.toString() === req.user._id.toString()));

    if (!isOwner && !isOfficer) {
      return next(new AppError('Not authorized to send messages in this chat', 403));
    }

    const message = await Message.create({
      complaintId: complaint._id,
      sender: req.user._id,
      content,
      iv,
      attachments
    });

    await message.populate('sender', 'name role avatar');

    res.status(201).json({
      status: 'success',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get private messages between users
// @route   GET /api/chats/private/:userId
exports.getPrivateMessages = async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: otherId },
        { sender: otherId, recipient: myId }
      ],
      complaintId: { $exists: false }
    })
      .populate('sender', 'name role avatar')
      .sort('createdAt');

    res.json({ status: 'success', data: { messages } });
  } catch (error) { next(error); }
};

// @desc    Send private message
// @route   POST /api/chats/private/:userId
exports.sendPrivateMessage = async (req, res, next) => {
  try {
    const { content, iv } = req.body;
    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        url: `/uploads/chats/${file.filename}`,
        mimetype: file.mimetype
      }));
    }
    
    const message = await Message.create({
      sender: req.user._id,
      recipient: req.params.userId,
      content: content || ' ', // In case there's only an attachment
      iv: iv || ' ',
      attachments
    });
    await message.populate('sender', 'name role avatar');
    res.status(201).json({ status: 'success', data: { message } });
  } catch (error) { next(error); }
};
