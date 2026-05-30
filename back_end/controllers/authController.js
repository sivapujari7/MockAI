const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../utils/email');

// ── Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    isVerified: user.isVerified,
    avatar: user.avatar,
    college: user.college,
    targetRole: user.targetRole,
    targetCompany: user.targetCompany,
    stats: user.stats,
    createdAt: user.createdAt,
  };
  res.status(statusCode).json({ success: true, message, token, user: userData });
};

// ────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, college, targetRole } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password, college, targetRole });

    // Generate + send verification email
    const token = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(email, name, token);

    res.status(201).json({
      success: true,
      message: `Account created! We've sent a verification email to ${email}. Please verify to continue.`,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired.',
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    sendTokenResponse(user, 200, res, 'Email verified successfully! Welcome to MockAI 🎉');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox.',
      });
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully!');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   POST /api/auth/resend-verification
// @access  Public
// ────────────────────────────────────────────
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    const token = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(email, user.name, token);

    res.json({ success: true, message: 'Verification email resent! Check your inbox.' });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @access  Public
// ────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Always return success to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, user.name, token);

    res.json({ success: true, message: 'Password reset email sent! Check your inbox.' });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successfully! You are now logged in.');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// ────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ────────────────────────────────────────────
// @route   PUT /api/auth/update-profile
// @access  Private
// ────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'college', 'targetRole', 'targetCompany', 'avatar'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @access  Private
// ────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully!');
  } catch (error) {
    next(error);
  }
};