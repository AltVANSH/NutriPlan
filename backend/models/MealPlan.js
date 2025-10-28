const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipe_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  plan_date: {
    type: Date,
    required: true
  },
  meal_type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  servings: {
    type: Number,
    default: 1,
    min: 1
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
mealPlanSchema.index({ user_id: 1, plan_date: 1 });

// addMeal() - Static method from class diagram
mealPlanSchema.statics.addMeal = async function(userId, recipeId, planDate, mealType, servings = 1) {
  const mealPlan = await this.create({
    user_id: userId,
    recipe_id: recipeId,
    plan_date: planDate,
    meal_type: mealType,
    servings: servings
  });

  return mealPlan;
};

// removeMeal() - Static method from class diagram
mealPlanSchema.statics.removeMeal = async function(mealPlanId) {
  const result = await this.findByIdAndDelete(mealPlanId);
  return result;
};

// getMealsForDate() - Static method from class diagram
mealPlanSchema.statics.getMealsForDate = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const meals = await this.find({
    user_id: userId,
    plan_date: { $gte: startOfDay, $lte: endOfDay }
  }).populate({
    path: 'recipe_id',
    populate: {
      path: 'ingredients.ingredient'
    }
  }).sort({ meal_type: 1 });

  return meals;
};

// Get meals for a date range (week view)
mealPlanSchema.statics.getMealsForWeek = async function(userId, startDate, endDate) {
  const meals = await this.find({
    user_id: userId,
    plan_date: { $gte: startDate, $lte: endDate }
  }).populate({
    path: 'recipe_id',
    populate: {
      path: 'ingredients.ingredient'
    }
  }).sort({ plan_date: 1, meal_type: 1 });

  return meals;
};

module.exports = mongoose.model('MealPlan', mealPlanSchema);