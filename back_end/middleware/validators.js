const { body, validationResult } = require('express-validator');

// ── Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// ── Register rules
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ── Login rules
const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Forgot password rules
const forgotPasswordRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
];

// ── Reset password rules
const resetPasswordRules = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ── Interview start rules
const interviewRules = [
  body('jobRole').trim().notEmpty().withMessage('Job role is required'),
  body('interviewType')
    .optional()
    .isIn(['hr', 'technical', 'system-design', 'behavioral', 'mixed'])
    .withMessage('Invalid interview type'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  interviewRules,
};