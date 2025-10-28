const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/nutrition
// @desc    Get daily nutritional summary
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();

    const user = await User.findById(req.user._id);
    const nutritionData = await user.trackNutrition(targetDate);

    res.json({
      success: true,
      data: nutritionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/nutrition/week
// @desc    Get weekly nutritional summary
// @access  Private
router.get('/week', protect, async (req, res) => {
  try {
    const { start_date } = req.query;

    let startDate;
    if (start_date) {
      startDate = new Date(start_date);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
    }
    startDate.setHours(0, 0, 0, 0);

    const user = await User.findById(req.user._id);
    const weeklyData = [];

    // Get nutrition data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayData = await user.trackNutrition(currentDate);
      weeklyData.push(dayData);
    }

    // Calculate weekly averages
    const weeklyAverages = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    weeklyData.forEach(day => {
      weeklyAverages.calories += day.nutrition.calories;
      weeklyAverages.protein += day.nutrition.protein;
      weeklyAverages.carbs += day.nutrition.carbs;
      weeklyAverages.fat += day.nutrition.fat;
    });

    weeklyAverages.calories = Math.round(weeklyAverages.calories / 7);
    weeklyAverages.protein = Math.round(weeklyAverages.protein / 7);
    weeklyAverages.carbs = Math.round(weeklyAverages.carbs / 7);
    weeklyAverages.fat = Math.round(weeklyAverages.fat / 7);

    res.json({
      success: true,
      data: {
        weeklyData,
        weeklyAverages,
        targets: {
          calories: user.preferences.daily_calorie_target,
          protein: user.preferences.daily_protein_target,
          carbs: user.preferences.daily_carbs_target,
          fat: user.preferences.daily_fat_target
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

module.exports = router;