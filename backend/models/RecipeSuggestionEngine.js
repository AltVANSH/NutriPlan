const mongoose = require('mongoose');

class RecipeSuggestionEngine {
  constructor() {
    this.Recipe = mongoose.model('Recipe');
    this.Ingredient = mongoose.model('Ingredient');
    this.Pantry = mongoose.model('Pantry');
  }

  // suggest() - Main suggestion method from class diagram
  async suggest(userId, options = {}) {
    const {
      maxCookingTime = null,
      mealType = null,
      limit = 10
    } = options;

    // Get user's pantry
    const pantry = await this.Pantry.findOne({ user_id: userId });
    const pantryIngredientIds = pantry 
      ? pantry.items.map(item => item.ingredient_id.toString())
      : [];

    // Get user preferences
    const User = mongoose.model('User');
    const user = await User.findById(userId);

    // Build query
    let query = this.Recipe.find();

    // Apply cooking time filter
    if (maxCookingTime) {
      query = query.where('cooking_time_minutes').lte(maxCookingTime);
    }

    // Get all recipes and populate ingredients
    const recipes = await query.populate('ingredients.ingredient').exec();

    // Filter and rank recipes
    const suggestedRecipes = this.filterByPreferences(recipes, user, pantryIngredientIds);

    // Limit results
    return suggestedRecipes.slice(0, limit);
  }

  // filterByPreferences() - Filter method from class diagram
  filterByPreferences(recipes, user, pantryIngredientIds) {
    const filteredRecipes = recipes
      .map(recipe => {
        // Calculate pantry match
        const recipeIngredientIds = recipe.ingredients.map(
          ri => ri.ingredient._id.toString()
        );

        const matchingIngredients = recipeIngredientIds.filter(
          riId => pantryIngredientIds.includes(riId)
        );

        const matchPercentage = recipeIngredientIds.length > 0
          ? (matchingIngredients.length / recipeIngredientIds.length) * 100
          : 0;

        const missingCount = recipeIngredientIds.length - matchingIngredients.length;

        // Check dietary restrictions
        let dietaryMatch = true;
        if (user.preferences.dietary_restrictions.length > 0) {
          dietaryMatch = user.preferences.dietary_restrictions.some(
            restriction => recipe.dietary_category.includes(restriction)
          ) || recipe.dietary_category.includes('none');
        }

        // Check for disliked ingredients
        const hasDislikedIngredients = recipe.ingredients.some(ri => 
          user.preferences.disliked_ingredients.includes(ri.ingredient.name.toLowerCase())
        );

        // Check for allergies
        const hasAllergens = recipe.ingredients.some(ri =>
          user.preferences.allergies.includes(ri.ingredient.name.toLowerCase())
        );

        // Calculate score
        let score = matchPercentage;

        // Penalize for dietary mismatches
        if (!dietaryMatch) score -= 50;

        // Heavily penalize for allergens or disliked ingredients
        if (hasAllergens) score = -1000; // Effectively filter out
        if (hasDislikedIngredients) score -= 30;

        // Bonus for complete pantry match
        if (missingCount === 0) score += 20;

        return {
          recipe,
          matchPercentage: Math.round(matchPercentage),
          missingCount,
          score,
          dietaryMatch,
          hasAllergens,
          hasDislikedIngredients
        };
      })
      .filter(item => item.score > -100) // Filter out recipes with allergens
      .sort((a, b) => {
        // Sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If scores are equal, sort by missing count (ascending)
        return a.missingCount - b.missingCount;
      });

    return filteredRecipes;
  }

  // Find recipes that can be made with current pantry
  async findRecipesWithPantry(userId) {
    const pantry = await this.Pantry.findOne({ user_id: userId });
    const pantryIngredientIds = pantry 
      ? pantry.items.map(item => item.ingredient_id.toString())
      : [];

    const recipes = await this.Recipe.find().populate('ingredients.ingredient');

    // Filter recipes where all ingredients are in pantry
    const availableRecipes = recipes.filter(recipe => {
      const recipeIngredientIds = recipe.ingredients.map(
        ri => ri.ingredient._id.toString()
      );

      return recipeIngredientIds.every(riId => pantryIngredientIds.includes(riId));
    });

    return availableRecipes;
  }

  // Get trending or popular recipes (database query based)
  async getTrendingRecipes(limit = 10) {
    // For now, return recently created recipes
    // In production, this could be based on user ratings, usage frequency, etc.
    const recipes = await this.Recipe.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('ingredients.ingredient');

    return recipes;
  }
}

module.exports = RecipeSuggestionEngine;