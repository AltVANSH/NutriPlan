const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity_grams: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required']
  },
  cooking_time_minutes: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: 0
  },
  dietary_category: [{
    type: String,
    enum: [
      'vegetarian', 
      'vegan', 
      'gluten-free', 
      'dairy-free', 
      'nut-free', 
      'low-carb', 
      'keto', 
      'paleo', 
      'no-cook',  // ✅ ADDED THIS
      'none'
    ]
  }],
  servings: {
    type: Number,
    default: 1,
    min: 1
  },
  ingredients: [recipeIngredientSchema],
  image_url: {
    type: String,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// calculateNutritionalInfo() - Instance method from class diagram
recipeSchema.methods.calculateNutritionalInfo = function() {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  this.ingredients.forEach(recipeIngredient => {
    if (recipeIngredient.ingredient) {
      const ingredient = recipeIngredient.ingredient;
      const quantity = recipeIngredient.quantity_grams;

      totalCalories += ingredient.calories_per_gram * quantity;
      totalProtein += ingredient.protein_per_gram * quantity;
      totalFat += ingredient.fat_per_gram * quantity;
      totalCarbs += ingredient.carbs_per_gram * quantity;
    }
  });

  return {
    calories: Math.round(totalCalories * 10) / 10,
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    per_serving: {
      calories: Math.round((totalCalories / this.servings) * 10) / 10,
      protein: Math.round((totalProtein / this.servings) * 10) / 10,
      fat: Math.round((totalFat / this.servings) * 10) / 10,
      carbs: Math.round((totalCarbs / this.servings) * 10) / 10
    }
  };
};

// Add virtual for populated ingredients
recipeSchema.virtual('nutritionalInfo').get(function() {
  return this.calculateNutritionalInfo();
});

// Ensure virtuals are included when converting to JSON
recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

// Index for text search
recipeSchema.index({ name: 'text', instructions: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);