const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/shopping-list
// @desc    Generate shopping list for week
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let startDate, endDate;

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      // Default to current week
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const user = await User.findById(req.user._id);
    const shoppingList = await user.generateShoppingList(startDate, endDate);

    // Group by category for easier shopping
    const groupedList = shoppingList.reduce((acc, item) => {
      const category = item.ingredient.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        ingredient: item.ingredient,
        quantity_grams: item.quantity_grams
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shoppingList: groupedList,
        totalItems: shoppingList.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/shopping-list/generate
// @desc    Regenerate shopping list for specified date range
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const user = await User.findById(req.user._id);
    const shoppingList = await user.generateShoppingList(startDate, endDate);

    // Group by category
    const groupedList = shoppingList.reduce((acc, item) => {
      const category = item.ingredient.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        ingredient: item.ingredient,
        quantity_grams: item.quantity_grams
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shoppingList: groupedList,
        totalItems: shoppingList.length
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