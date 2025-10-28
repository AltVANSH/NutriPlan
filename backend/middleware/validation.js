const validator = require('validator');

// Validate registration input
const validateRegister = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Please provide a password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

// Validate recipe creation
const validateRecipe = (req, res, next) => {
  const { name, instructions, cooking_time_minutes, ingredients } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Recipe name is required');
  }

  if (!instructions || instructions.trim().length === 0) {
    errors.push('Instructions are required');
  }

  if (!cooking_time_minutes || cooking_time_minutes < 0) {
    errors.push('Valid cooking time is required');
  }

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

// Validate meal plan creation
const validateMealPlan = (req, res, next) => {
  const { recipe_id, plan_date, meal_type } = req.body;
  const errors = [];

  if (!recipe_id) {
    errors.push('Recipe ID is required');
  }

  if (!plan_date) {
    errors.push('Plan date is required');
  }

  if (!meal_type || !['breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type)) {
    errors.push('Valid meal type is required (breakfast, lunch, dinner, snack)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRecipe,
  validateMealPlan
};