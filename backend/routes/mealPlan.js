const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const { protect } = require('../middleware/auth');
const { validateMealPlan } = require('../middleware/validation');

// Helper function to create UTC date from YYYY-MM-DD string
function createUTCDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// @route   GET /api/meal-plan
// @desc    Get weekly meal plan
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let startDate, endDate;

    if (start_date && end_date) {
      startDate = createUTCDate(start_date);
      endDate = createUTCDate(end_date);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // Default to current week
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const dayOfWeek = startDate.getUTCDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setUTCDate(startDate.getUTCDate() + diff);

      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    console.log('Fetching meals from', formatDate(startDate), 'to', formatDate(endDate));

    const meals = await MealPlan.getMealsForWeek(req.user._id, startDate, endDate);

    // Group meals by date
    const mealsByDate = {};
    meals.forEach(meal => {
      const dateKey = formatDate(meal.plan_date);
      console.log('Meal date from DB:', meal.plan_date, 'formatted as:', dateKey);
      
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = {
          date: dateKey,
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: []
        };
      }
      mealsByDate[dateKey][meal.meal_type].push({
        id: meal._id,
        recipe: meal.recipe_id,
        servings: meal.servings,
        notes: meal.notes,
        nutritionalInfo: meal.recipe_id ? meal.recipe_id.calculateNutritionalInfo() : null
      });
    });

    res.json({
      success: true,
      data: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        mealPlan: Object.values(mealsByDate)
      }
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/meal-plan/date/:date
// @desc    Get meals for specific date
// @access  Private
router.get('/date/:date', protect, async (req, res) => {
  try {
    const date = createUTCDate(req.params.date);
    const meals = await MealPlan.getMealsForDate(req.user._id, date);

    const groupedMeals = {
      date: req.params.date,
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    meals.forEach(meal => {
      groupedMeals[meal.meal_type].push({
        id: meal._id,
        recipe: meal.recipe_id,
        servings: meal.servings,
        notes: meal.notes,
        nutritionalInfo: meal.recipe_id ? meal.recipe_id.calculateNutritionalInfo() : null
      });
    });

    res.json({
      success: true,
      data: {
        meals: groupedMeals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/meal-plan
// @desc    Add meal to plan (drag-drop functionality)
// @access  Private
router.post('/', protect, validateMealPlan, async (req, res) => {
  try {
    const { recipe_id, plan_date, meal_type, servings, notes } = req.body;

    console.log('Received plan_date:', plan_date);
    
    // Convert date string to UTC date to avoid timezone issues
    const planDate = createUTCDate(plan_date);
    
    console.log('Converted to UTC date:', planDate);
    console.log('Formatted back:', formatDate(planDate));

    const meal = await MealPlan.addMeal(
      req.user._id,
      recipe_id,
      planDate,
      meal_type,
      servings
    );

    await meal.populate({
      path: 'recipe_id',
      populate: {
        path: 'ingredients.ingredient'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        meal: {
          id: meal._id,
          recipe: meal.recipe_id,
          plan_date: formatDate(meal.plan_date),
          meal_type: meal.meal_type,
          servings: meal.servings,
          notes: meal.notes,
          nutritionalInfo: meal.recipe_id.calculateNutritionalInfo()
        }
      }
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/meal-plan/:id
// @desc    Update meal in plan
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let meal = await MealPlan.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Check if meal belongs to user
    if (meal.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this meal plan'
      });
    }

    // If updating plan_date, convert it properly
    if (req.body.plan_date) {
      req.body.plan_date = createUTCDate(req.body.plan_date);
    }

    meal = await MealPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'recipe_id',
      populate: {
        path: 'ingredients.ingredient'
      }
    });

    res.json({
      success: true,
      data: {
        meal: {
          id: meal._id,
          recipe: meal.recipe_id,
          plan_date: formatDate(meal.plan_date),
          meal_type: meal.meal_type,
          servings: meal.servings,
          notes: meal.notes,
          nutritionalInfo: meal.recipe_id.calculateNutritionalInfo()
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

// @route   DELETE /api/meal-plan/:id
// @desc    Remove meal from plan
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const meal = await MealPlan.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Check if meal belongs to user
    if (meal.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this meal plan'
      });
    }

    await MealPlan.removeMeal(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;