const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');
const { protect } = require('../middleware/auth');

// @route   GET /api/ingredients
// @desc    Get all ingredients (with search)
// @access  Private
// @route   GET /api/ingredients
// @desc    Get all ingredients (with search)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = {};

    // Text search using regex (works without text index)
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive partial match
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    const ingredients = await Ingredient.find(query);

    res.json({
      success: true,
      data: {
        ingredients
      }
    });
  } catch (error) {
    console.error('Ingredient search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/ingredients/:id
// @desc    Get single ingredient
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }

    res.json({
      success: true,
      data: {
        ingredient
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/ingredients
// @desc    Create new ingredient (admin/user)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      calories_per_gram,
      protein_per_gram,
      fat_per_gram,
      carbs_per_gram,
      category
    } = req.body;

    const ingredient = await Ingredient.create({
      name,
      calories_per_gram,
      protein_per_gram,
      fat_per_gram,
      carbs_per_gram,
      category
    });

    res.status(201).json({
      success: true,
      data: {
        ingredient
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