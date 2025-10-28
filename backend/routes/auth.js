const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Auth rate limiter - only in production
const authLimiter = process.env.NODE_ENV === 'production' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many authentication attempts, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req, res, next) => next();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    console.log('Registration request received:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      preferences: req.body.preferences
    });

    const { email, password, preferences } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate preferences structure
    const userPreferences = {
      dietary_restrictions: Array.isArray(preferences?.dietary_restrictions) 
        ? preferences.dietary_restrictions 
        : [],
      allergies: Array.isArray(preferences?.allergies) 
        ? preferences.allergies 
        : [],
      disliked_ingredients: Array.isArray(preferences?.disliked_ingredients) 
        ? preferences.disliked_ingredients 
        : [],
      daily_calorie_target: parseInt(preferences?.daily_calorie_target) || 2000,
      daily_protein_target: parseInt(preferences?.daily_protein_target) || 50,
      daily_carbs_target: parseInt(preferences?.daily_carbs_target) || 250,
      daily_fat_target: parseInt(preferences?.daily_fat_target) || 70,
    };

    console.log('Creating user with preferences:', userPreferences);

    const { user, token } = await User.register(email, password, userPreferences);

    console.log('User registered successfully:', user.email);

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
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });

    const { email, password } = req.body;

    const { user, token } = await User.login(email, password);

    console.log('User logged in successfully:', user.email);

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
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
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
    console.log('Profile update request:', req.body);

    const { preferences } = req.body;

    const user = await User.findById(req.user._id);
    await user.updatePreferences(preferences);

    console.log('Profile updated successfully:', user.email);

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
    console.error('Profile update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;