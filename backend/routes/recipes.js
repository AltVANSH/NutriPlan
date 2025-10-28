const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Pantry = require('../models/Pantry');
const User = require('../models/User');
const RecipeSuggestionEngine = require('../models/RecipeSuggestionEngine');
const { protect } = require('../middleware/auth');
const { validateRecipe } = require('../middleware/validation');

// @route   GET /api/recipes
// @desc    Find recipes with pantry-based suggestions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, dietary_category, max_cooking_time } = req.query;

    // Get user's pantry
    const pantry = await Pantry.findOne({ user_id: req.user._id });
    const pantryIngredientIds = pantry 
      ? pantry.items.map(item => item.ingredient_id)
      : [];

    // Find recipes using User method
    const user = await User.findById(req.user._id);
    const filters = {
      maxCookingTime: max_cooking_time ? parseInt(max_cooking_time) : null
    };

    const rankedRecipes = await user.findRecipes(pantryIngredientIds, filters);

    // Apply search filter if provided
    let filteredRecipes = rankedRecipes;
    if (search) {
      filteredRecipes = rankedRecipes.filter(item =>
        item.recipe.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        recipes: filteredRecipes.map(item => ({
          ...item.recipe.toObject(),
          matchPercentage: item.matchPercentage,
          missingCount: item.missingCount,
          nutritionalInfo: item.recipe.calculateNutritionalInfo()
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/recipes/suggest
// @desc    Recipe suggestion engine
// @access  Private
router.get('/suggest', protect, async (req, res) => {
  try {
    const { max_cooking_time, limit } = req.query;

    const suggestionEngine = new RecipeSuggestionEngine();
    const suggestions = await suggestionEngine.suggest(req.user._id, {
      maxCookingTime: max_cooking_time ? parseInt(max_cooking_time) : null,
      limit: limit ? parseInt(limit) : 10
    });

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(item => ({
          ...item.recipe.toObject(),
          matchPercentage: item.matchPercentage,
          missingCount: item.missingCount,
          score: item.score,
          dietaryMatch: item.dietaryMatch,
          nutritionalInfo: item.recipe.calculateNutritionalInfo()
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe with nutritional info
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('ingredients.ingredient');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: {
        recipe: {
          ...recipe.toObject(),
          nutritionalInfo: recipe.calculateNutritionalInfo()
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

// @route   POST /api/recipes
// @desc    Create new recipe
// @access  Private
router.post('/', protect, validateRecipe, async (req, res) => {
  try {
    const {
      name,
      instructions,
      cooking_time_minutes,
      dietary_category,
      servings,
      ingredients,
      image_url
    } = req.body;

    const recipe = await Recipe.create({
      name,
      instructions,
      cooking_time_minutes,
      dietary_category: dietary_category || ['none'],
      servings: servings || 1,
      ingredients,
      image_url,
      created_by: req.user._id
    });

    await recipe.populate('ingredients.ingredient');

    res.status(201).json({
      success: true,
      data: {
        recipe: {
          ...recipe.toObject(),
          nutritionalInfo: recipe.calculateNutritionalInfo()
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

// @route   PUT /api/recipes/:id
// @desc    Update recipe
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Check if user created the recipe or is updating their own recipe
    if (recipe.created_by && recipe.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recipe'
      });
    }

    recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ingredients.ingredient');

    res.json({
      success: true,
      data: {
        recipe: {
          ...recipe.toObject(),
          nutritionalInfo: recipe.calculateNutritionalInfo()
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

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Check if user created the recipe
    if (recipe.created_by && recipe.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this recipe'
      });
    }

    await recipe.deleteOne();

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