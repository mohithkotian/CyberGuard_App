const express = require('express');
const router = express.Router();
const { maskTextForModel } = require('../utils/modelPrivacy');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const mlService = require('../services/mlService');
const { protect, restrictTo } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

router.use(protect, restrictTo('admin'));

// User Directory Stats
router.get('/users/stats', async (req, res, next) => {
  try {
    const [
      total,
      citizens,
      officers,
      admins,
      education,
      active,
      suspended,
      verified,
      twoFactor
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'officer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'education' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isTwoFactorEnabled: true }),
    ]);

    res.json({
      status: 'success',
      data: {
        total,
        citizens,
        officers,
        admins,
        education,
        active,
        suspended,
        verified,
        twoFactor
      }
    });
  } catch (error) { next(error); }
});

// Get all users with multi-field search and filters
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, status, search } = req.query;
    const query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive' || status === 'suspended') query.isActive = false;
    else if (status === 'verified') query.isVerified = true;
    else if (status === '2fa') query.isTwoFactorEnabled = true;

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { 'address.city': { $regex: s, $options: 'i' } },
        { 'address.state': { $regex: s, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({ status: 'success', data: { users, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
});

// Get single user detailed dossier with complaint history
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    const complaints = await Complaint.find({ userId: user._id })
      .select('complaintId title category status severity createdAt estimatedLoss')
      .sort({ createdAt: -1 })
      .limit(10);

    const complaintsCount = await Complaint.countDocuments({ userId: user._id });

    res.json({
      status: 'success',
      data: {
        user,
        complaints,
        complaintsCount
      }
    });
  } catch (error) { next(error); }
});

const usersCtrl = require('../controllers/usersController');

// Create / Enroll new user or officer by Admin
router.post('/users', usersCtrl.uploadAvatar, async (req, res, next) => {
  try {
    const { name, email, password, phone, role, isVerified, isActive, address, avatar } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 400));
    }

    let avatarPath = avatar || undefined;
    if (req.file) {
      avatarPath = `/uploads/avatars/${req.file.filename}`;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Pre-save hook will hash this
      phone: phone ? phone.trim() : undefined,
      role: role || 'user',
      avatar: avatarPath,
      isVerified: isVerified !== undefined ? isVerified : true,
      isActive: isActive !== undefined ? isActive : true,
      address: address || {}
    });

    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'User successfully created',
      data: { user }
    });
  } catch (error) { next(error); }
});

// Full update of user information by Admin
const updateUserHandler = async (req, res, next) => {
  try {
    const { name, email, phone, role, isActive, isVerified, isTwoFactorEnabled, address, password, avatar } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    // Protect Owner email
    if (user.email === 'pruthvishetty04@gmail.com' && email && email.toLowerCase().trim() !== user.email) {
      return next(new AppError('System Owner email cannot be modified', 403));
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (emailExists) {
        return next(new AppError('Email is already taken by another account', 400));
      }
      user.email = email.toLowerCase().trim();
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) {
      user.phone = phone && phone.trim() ? phone.trim() : undefined;
    }
    if (role && ['user', 'officer', 'admin', 'education'].includes(role)) {
      user.role = role;
    }
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (isTwoFactorEnabled !== undefined) user.isTwoFactorEnabled = Boolean(isTwoFactorEnabled);
    if (address !== undefined) {
      user.address = {
        street: address.street !== undefined ? address.street : (user.address?.street || ''),
        city: address.city !== undefined ? address.city : (user.address?.city || ''),
        state: address.state !== undefined ? address.state : (user.address?.state || ''),
        pincode: address.pincode !== undefined ? address.pincode : (user.address?.pincode || ''),
      };
    }

    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    } else if (avatar !== undefined) {
      user.avatar = avatar;
    }

    if (password && password.trim().length >= 6) {
      user.password = password.trim(); // Handled cleanly by userSchema.pre('save')
    }

    await user.save();

    res.json({
      status: 'success',
      message: 'User profile updated successfully',
      data: { user }
    });
  } catch (error) { next(error); }
};

router.put('/users/:id', usersCtrl.uploadAvatar, updateUserHandler);
router.patch('/users/:id', usersCtrl.uploadAvatar, updateUserHandler);

// Direct Password Reset by Admin
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    user.password = password.trim(); // Handled cleanly by userSchema.pre('save')
    user.lockUntil = undefined;
    user.loginAttempts = 0;
    await user.save();

    res.json({
      status: 'success',
      message: `Password for ${user.name} has been reset successfully`,
    });
  } catch (error) { next(error); }
});

// Delete user account
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (user.email === 'pruthvishetty04@gmail.com') {
      return next(new AppError('The Master System Owner account cannot be deleted', 403));
    }

    if (req.user && req.user._id.toString() === user._id.toString()) {
      return next(new AppError('You cannot delete your own active administrator account', 400));
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: `Account for ${user.name} (${user.email}) has been permanently purged from registry`,
    });
  } catch (error) { next(error); }
});

// Update user role (legacy support)
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'officer', 'admin', 'education'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return next(new AppError('User not found', 404));
    res.json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
});

// Toggle user status (legacy support)
router.patch('/users/:id/toggle-status', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    user.isActive = !user.isActive;
    await user.save();
    res.json({ status: 'success', data: { user } });
  } catch (error) { next(error); }
});

// Assign complaint to officer
router.patch('/complaints/:id/assign', async (req, res, next) => {
  try {
    const { officerId } = req.body;
    const officer = await User.findOne({ _id: officerId, role: 'officer' });
    if (!officer) return next(new AppError('Officer not found', 404));

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: officerId, status: 'under_review' },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!complaint) return next(new AppError('Complaint not found', 404));
    res.json({ status: 'success', data: { complaint } });
  } catch (error) { next(error); }
});

// ML Service status
router.get('/ml-status', async (req, res, next) => {
  try {
    const [status, modelInfo] = await Promise.all([
      mlService.healthCheck(),
      mlService.getModelInfo(),
    ]);
    res.json({ status: 'success', data: { mlService: status, modelInfo } });
  } catch (error) { next(error); }
});

// Test ML prediction (Playground)
router.post('/predict', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return next(new AppError('Please provide text to analyze', 400));
    
    const prediction = await mlService.predict(maskTextForModel(text));
    res.json({ status: 'success', data: prediction });
  } catch (error) { next(error); }
});

// System stats
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

router.get('/system-stats', async (req, res, next) => {
  try {
    const [totalUsers, totalComplaints, pendingComplaints] = await Promise.all([
      User.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
    ]);

    // Calculate CPU Load (approximate)
    const cpus = os.cpus();
    const load = os.loadavg();
    const cpuLoad = Math.min(100, Math.round((load[0] / cpus.length) * 100));

    // Memory calculation
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // Storage calculation
    let storageUsage = 45; // Fallback
    try {
      const { stdout } = await execPromise(os.platform() === 'win32' ? 'wmic logicaldisk get size,freespace' : "df -h / | tail -1 | awk '{print $5}'");
      if (os.platform() !== 'win32') {
        storageUsage = parseInt(stdout.replace('%', ''));
      }
    } catch (e) {
      console.error('Storage check failed', e);
    }

    res.json({
      status: 'success',
      data: {
        counts: {
          totalUsers,
          totalComplaints,
          pendingComplaints,
        },
        health: {
          cpu: cpuLoad,
          memory: memUsage,
          storage: storageUsage,
          uptime: os.uptime(),
        }
      },
    });
  } catch (error) { next(error); }
});

// Source Code Viewer
const fs = require('fs');
const path = require('path');

router.get('/codebase', async (req, res, next) => {
  try {
    const rootPath = path.resolve(__dirname, '../../../');
    const ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'uploads', '.DS_Store', 'scratch', '.env'];

    const getFiles = (dir) => {
      const results = [];
      try {
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
          if (ignoreDirs.includes(file)) return;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat && stat.isDirectory()) {
            results.push({
              name: file,
              type: 'directory',
              children: getFiles(fullPath)
            });
          } else {
            const ext = path.extname(file);
            const validExts = ['.js', '.jsx', '.json', '.md', '.html', '.css'];
            if (validExts.includes(ext) || file === '.env.example') {
              let content = '';
              try {
                content = fs.readFileSync(fullPath, 'utf8');
              } catch (e) {
                content = 'Error reading file content.';
              }
              results.push({
                name: file,
                type: 'file',
                content
              });
            }
          }
        });
      } catch (err) {
        console.error('Error reading directory:', dir, err);
      }
      return results;
    };

    const codebase = [
      {
        name: 'web-app/src',
        type: 'directory',
        children: getFiles(path.join(rootPath, 'web-app/src'))
      },
      {
        name: 'backend/src',
        type: 'directory',
        children: getFiles(path.join(rootPath, 'backend/src'))
      }
    ];

    res.json({ status: 'success', data: { codebase } });
  } catch (error) { next(error); }
});

const MailLog = require('../models/MailLog');

// Get sent emails and SMS dispatches
router.get('/emails', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const [rawEmails, total] = await Promise.all([
      MailLog.find().sort({ sentAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)).lean(),
      MailLog.countDocuments()
    ]);

    const emails = rawEmails.map(mail => {
      if (!mail.textMessage || !mail.textMessage.trim()) {
        if (mail.complaintId) {
          if (mail.subject && mail.subject.includes('Status:')) {
            const statusMatch = mail.subject.match(/Status:\s*([A-Z_ ]+)/i);
            const st = statusMatch ? statusMatch[1].trim() : 'UPDATED';
            mail.textMessage = `Cybercrime Dept: Your complaint (ID: ${mail.complaintId}) status has been updated to "${st}". Review at cyberguard.gov.in`;
          } else if (mail.subject && mail.subject.includes('reviewed')) {
            mail.textMessage = `Cybercrime Dept: Your complaint #${mail.complaintId} is now under active review by an assigned officer.`;
          } else if (mail.subject && mail.subject.includes('URGENT')) {
            mail.textMessage = `[URGENT] High-priority cybercrime complaint #${mail.complaintId} requires officer response.`;
          } else {
            mail.textMessage = `Cybercrime Dept: Notification dispatched for complaint #${mail.complaintId}.`;
          }
        } else if (mail.subject && mail.subject.includes('OTP')) {
          mail.textMessage = `CyberGuard Security: Login verification OTP code dispatched. Valid for 10 mins.`;
        } else {
          mail.textMessage = `CyberGuard Alert: Automated dispatch sent to ${mail.recipient}`;
        }
      }
      return mail;
    });
    
    res.json({ status: 'success', data: { emails, total } });
  } catch (error) { next(error); }
});

module.exports = router;
