const express = require('express');
const router = express.Router();
const Pantry = require('../models/Pantry');
const { protect } = require('../middleware/auth');

// @route   GET /api/pantry
// @desc    Get user's pantry
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let pantry = await Pantry.getOrCreatePantry(req.user._id);
    const ingredients = await pantry.getIngredients();

    res.json({
      success: true,
      data: {
        pantry: {
          id: pantry._id,
          items: ingredients
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

// @route   POST /api/pantry
// @desc    Add ingredient to pantry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { ingredient_id, quantity_grams, expiry_date } = req.body;

    if (!ingredient_id || !quantity_grams) {
      return res.status(400).json({
        success: false,
        message: 'Ingredient ID and quantity are required'
      });
    }

    let pantry = await Pantry.getOrCreatePantry(req.user._id);
    await pantry.addIngredient(ingredient_id, quantity_grams, expiry_date);
    
    const ingredients = await pantry.getIngredients();

    res.status(201).json({
      success: true,
      data: {
        pantry: {
          id: pantry._id,
          items: ingredients
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

// @route   DELETE /api/pantry/:id
// @desc    Remove ingredient from pantry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    let pantry = await Pantry.findOne({ user_id: req.user._id });

    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: 'Pantry not found'
      });
    }

    await pantry.removeIngredient(req.params.id);
    const ingredients = await pantry.getIngredients();

    res.json({
      success: true,
      data: {
        pantry: {
          id: pantry._id,
          items: ingredients
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

// @route   PUT /api/pantry/:id
// @desc    Update ingredient quantity in pantry
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { quantity_grams } = req.body;

    let pantry = await Pantry.findOne({ user_id: req.user._id });

    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: 'Pantry not found'
      });
    }

    const item = pantry.items.id(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in pantry'
      });
    }

    item.quantity_grams = quantity_grams;
    await pantry.save();
    
    const ingredients = await pantry.getIngredients();

    res.json({
      success: true,
      data: {
        pantry: {
          id: pantry._id,
          items: ingredients
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

module.exports = router;