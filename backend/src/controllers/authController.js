const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 1. LOGIN LOGIC
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', errors: errors.array() });
    }

    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';
    const { password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +isActive');

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(new AppError(`Account locked. Try again in ${lockTime} minutes.`, 423));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account deactivated. Contact support.', 401));
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in directly via email/password: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
// 1.5 VERIFY EMAIL OTP
const verifyEmailOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return next(new AppError('Please provide userId and otp', 400));
    }

    const user = await User.findById(userId).select('+emailOtp +emailOtpExpires +otpAttempts +isActive');

    if (!user || !user.isActive) {
      return next(new AppError('Invalid user or inactive', 401));
    }

    if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < Date.now()) {
      return next(new AppError('OTP has expired or is invalid. Please login again.', 400));
    }

    const isMatch = await bcrypt.compare(otp, user.emailOtp);
    if (!isMatch) {
      // Track failed OTP attempts — invalidate after 5 wrong guesses
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        user.otpAttempts = 0;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('Too many failed OTP attempts. Please login again to get a new code.', 429));
      }
      await user.save({ validateBeforeSave: false });
      return next(new AppError(`Invalid OTP. ${5 - user.otpAttempts} attempts remaining.`, 401));
    }

    // OTP Valid - Clear it and generate tokens
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`User verified email OTP and logged in: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};


// 2. GET ME (Fixes the Postman Loading issue)
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by the 'protect' middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. REGISTER LOGIC
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'user'
    });

    const { accessToken, refreshToken } = generateTokens(newUser._id);
    
    // Send welcome email asynchronously
    const emailAgentService = require('../services/emailAgentService');
    emailAgentService.sendWelcomeEmail(newUser);
    
    res.status(201).json({
      status: 'success',
      data: {
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. LOGOUT LOGIC
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }

    // Blacklist the access token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          const TokenBlacklist = require('../models/TokenBlacklist');
          await TokenBlacklist.create({
            token,
            expiresAt: new Date(decoded.exp * 1000)
          });
        }
      } catch (err) {
        logger.warn('Failed to decode token for blacklisting: ' + err.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 5. REFRESH TOKEN & UPDATE PASSWORD
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: submittedToken } = req.body || {};
    if (!submittedToken) {
      return next(new AppError('Refresh token is required.', 401));
    }

    const decoded = jwt.verify(
      submittedToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id)
      .select('+refreshToken +isActive');

    if (!user || !user.isActive || !user.refreshToken || user.refreshToken !== submittedToken) {
      return next(new AppError('Invalid refresh token. Please log in again.', 401));
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }
    next(error);
  }
};
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401));
    }
    user.password = newPassword;
    await user.save();
    
    // Issue a new token to invalidate old sessions (optional, but good practice)
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ 
      status: 'success', 
      message: 'Password updated successfully',
      data: { accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

// 5.5 TWO FACTOR AUTHENTICATION
const generate2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = speakeasy.generateSecret({
      name: `CyberGuard (${user.email})`
    });
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: { secret: secret.base32, otpauth: secret.otpauth_url }
    });
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save({ validateBeforeSave: false });
      res.status(200).json({ status: 'success', message: '2FA enabled successfully' });
    } else {
      return next(new AppError('Invalid token', 400));
    }
  } catch (error) {
    next(error);
  }
};

const login2FA = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret +isActive');

    if (!user || !user.isActive) {
      return next(new AppError('Invalid user or inactive', 401));
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      user.refreshToken = refreshToken;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      logger.info(`User logged in via 2FA: ${user.email}`);

      res.status(200).json({
        status: 'success',
        data: {
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
          accessToken,
          refreshToken
        }
      });
    } else {
      return next(new AppError('Invalid 2FA code', 401));
    }
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ status: 'success', message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. FACE ID BIOMETRICS
const enrollFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return next(new AppError('Invalid face descriptor. Must be a 128-dimensional array.', 400));
    }
    
    // Only Pruthvi Shetty can enroll
    const user = await User.findById(req.user.id);
    if (user.email !== 'pruthvishetty04@gmail.com') {
      return next(new AppError('UNAUTHORIZED: Face ID enrollment restricted to System Admin.', 403));
    }

    user.faceDescriptor = descriptor;
    await user.save({ validateBeforeSave: false });

    logger.info(`Face ID enrolled for user: ${user.email}`);
    res.status(200).json({ status: 'success', message: 'Face ID successfully enrolled.' });
  } catch (error) {
    next(error);
  }
};

const verifyFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return next(new AppError('Invalid face descriptor for verification.', 400));
    }

    // Must fetch user with select('+faceDescriptor') because it's hidden by default
    const user = await User.findById(req.user.id).select('+faceDescriptor');
    
    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      return next(new AppError('No Face ID enrolled for this user.', 404));
    }

    // Compute Euclidean Distance
    let sum = 0;
    for (let i = 0; i < 128; i++) {
      sum += Math.pow(user.faceDescriptor[i] - descriptor[i], 2);
    }
    const distance = Math.sqrt(sum);

    // Standard face-api.js threshold is ~0.5 to 0.6
    if (distance < 0.5) {
      res.status(200).json({ status: 'success', message: 'Biometric verification passed.', distance });
    } else {
      res.status(401).json({ status: 'fail', message: 'Rejected: Biometric Mismatch.', distance });
    }
  } catch (error) {
    next(error);
  }
};

// EXPORT EVERYTHING
module.exports = { 
  login, 
  verifyEmailOtp,
  register, 
  refreshToken, 
  getMe, 
  logout, 
  updatePassword,
  enrollFace,
  verifyFace,
  generate2FA,
  verify2FA,
  login2FA,
  disable2FA
};
