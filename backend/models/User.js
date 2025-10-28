const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  preferences: {
    dietary_restrictions: [{
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
        'no-cook'  // ✅ ADDED THIS
      ]
    }],
    allergies: [String],
    disliked_ingredients: [String],
    daily_calorie_target: {
      type: Number,
      default: 2000
    },
    daily_protein_target: {
      type: Number,
      default: 50
    },
    daily_carbs_target: {
      type: Number,
      default: 250
    },
    daily_fat_target: {
      type: Number,
      default: 70
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Instance Methods as per Class Diagram

// register() - Static method for user registration
userSchema.statics.register = async function(email, password, preferences = {}) {
  // Check if user exists
  const existingUser = await this.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create new user
  const user = await this.create({
    email,
    password_hash: password,
    preferences
  });

  // Generate token
  const token = user.generateAuthToken();
  
  return { user, token };
};

// login() - Static method for user login
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email }).select('+password_hash');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = user.generateAuthToken();
  
  // Remove password from response
  user.password_hash = undefined;
  
  return { user, token };
};

// updatePreferences() - Instance method
userSchema.methods.updatePreferences = async function(newPreferences) {
  this.preferences = {
    ...this.preferences,
    ...newPreferences
  };
  await this.save();
  return this;
};

// findRecipes() - Instance method to find recipes based on user's pantry
userSchema.methods.findRecipes = async function(pantryIngredients, filters = {}) {
  const Recipe = mongoose.model('Recipe');
  
  // Get all recipes
  let query = Recipe.find();
  
  // Apply dietary restrictions
  if (this.preferences.dietary_restrictions.length > 0) {
    query = query.where('dietary_category').in(this.preferences.dietary_restrictions);
  }
  
  // Apply additional filters
  if (filters.maxCookingTime) {
    query = query.where('cooking_time_minutes').lte(filters.maxCookingTime);
  }
  
  const recipes = await query.populate('ingredients.ingredient');
  
  // Rank recipes by pantry match
  const rankedRecipes = recipes.map(recipe => {
    const recipeIngredients = recipe.ingredients.map(ri => ri.ingredient._id.toString());
    const pantryIngredientIds = pantryIngredients.map(pi => pi.toString());
    
    const matchingIngredients = recipeIngredients.filter(ri => 
      pantryIngredientIds.includes(ri)
    );
    
    const matchPercentage = (matchingIngredients.length / recipeIngredients.length) * 100;
    const missingCount = recipeIngredients.length - matchingIngredients.length;
    
    return {
      recipe,
      matchPercentage,
      missingCount
    };
  });
  
  // Sort by match percentage (descending) and missing count (ascending)
  rankedRecipes.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.missingCount - b.missingCount;
  });
  
  return rankedRecipes;
};

// generateShoppingList() - Instance method
userSchema.methods.generateShoppingList = async function(startDate, endDate) {
  const MealPlan = mongoose.model('MealPlan');
  const Pantry = mongoose.model('Pantry');
  
  // Get meals for date range
  const mealPlans = await MealPlan.find({
    user_id: this._id,
    plan_date: { $gte: startDate, $lte: endDate }
  }).populate({
    path: 'recipe_id',
    populate: {
      path: 'ingredients.ingredient'
    }
  });
  
  // Get user's pantry
  const pantry = await Pantry.findOne({ user_id: this._id }).populate('items.ingredient_id');
  const pantryIngredients = pantry ? pantry.items : [];
  
  // Aggregate ingredients needed
  const ingredientsNeeded = {};
  
  mealPlans.forEach(plan => {
    if (plan.recipe_id && plan.recipe_id.ingredients) {
      plan.recipe_id.ingredients.forEach(ri => {
        const ingredientId = ri.ingredient._id.toString();
        
        if (!ingredientsNeeded[ingredientId]) {
          ingredientsNeeded[ingredientId] = {
            ingredient: ri.ingredient,
            totalQuantity: 0
          };
        }
        
        ingredientsNeeded[ingredientId].totalQuantity += ri.quantity_grams * plan.servings;
      });
    }
  });
  
  // Subtract pantry items
  const shoppingList = [];
  
  Object.values(ingredientsNeeded).forEach(item => {
    const pantryItem = pantryIngredients.find(
      pi => pi.ingredient_id._id.toString() === item.ingredient._id.toString()
    );
    
    const quantityNeeded = pantryItem 
      ? Math.max(0, item.totalQuantity - pantryItem.quantity_grams)
      : item.totalQuantity;
    
    if (quantityNeeded > 0) {
      shoppingList.push({
        ingredient: item.ingredient,
        quantity_grams: Math.round(quantityNeeded)
      });
    }
  });
  
  return shoppingList;
};

// trackNutrition() - Instance method for daily nutrition tracking
userSchema.methods.trackNutrition = async function(date) {
  const MealPlan = mongoose.model('MealPlan');
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const mealPlans = await MealPlan.find({
    user_id: this._id,
    plan_date: { $gte: startOfDay, $lte: endOfDay }
  }).populate({
    path: 'recipe_id',
    populate: {
      path: 'ingredients.ingredient'
    }
  });
  
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  mealPlans.forEach(plan => {
    if (plan.recipe_id) {
      const recipeNutrition = plan.recipe_id.calculateNutritionalInfo();
      const servingMultiplier = plan.servings;
      
      nutrition.calories += recipeNutrition.per_serving.calories * servingMultiplier;
      nutrition.protein += recipeNutrition.per_serving.protein * servingMultiplier;
      nutrition.carbs += recipeNutrition.per_serving.carbs * servingMultiplier;
      nutrition.fat += recipeNutrition.per_serving.fat * servingMultiplier;
    }
  });
  
  // Round values
  nutrition.calories = Math.round(nutrition.calories);
  nutrition.protein = Math.round(nutrition.protein);
  nutrition.carbs = Math.round(nutrition.carbs);
  nutrition.fat = Math.round(nutrition.fat);
  
  return {
    date,
    nutrition,
    targets: {
      calories: this.preferences.daily_calorie_target,
      protein: this.preferences.daily_protein_target,
      carbs: this.preferences.daily_carbs_target,
      fat: this.preferences.daily_fat_target
    },
    percentages: {
      calories: Math.round((nutrition.calories / this.preferences.daily_calorie_target) * 100),
      protein: Math.round((nutrition.protein / this.preferences.daily_protein_target) * 100),
      carbs: Math.round((nutrition.carbs / this.preferences.daily_carbs_target) * 100),
      fat: Math.round((nutrition.fat / this.preferences.daily_fat_target) * 100)
    }
  };
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);