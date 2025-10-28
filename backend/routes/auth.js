const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// ✅ FIXED: Auth rate limiter - only in production
const authLimiter = process.env.NODE_ENV === 'production' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: 'Too many authentication attempts, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req, res, next) => next(); // No rate limiting in development

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { email, password, preferences } = req.body;

    const { user, token } = await User.register(email, password, preferences);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          preferences: user.preferences
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await User.login(email, password);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          preferences: user.preferences
        },
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          preferences: req.user.preferences
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user preferences
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findById(req.user._id);
    await user.updatePreferences(preferences);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;