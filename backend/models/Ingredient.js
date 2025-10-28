const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    unique: true,
    trim: true
  },
  calories_per_gram: {
    type: Number,
    required: [true, 'Calories per gram is required'],
    min: 0
  },
  protein_per_gram: {
    type: Number,
    required: [true, 'Protein per gram is required'],
    min: 0
  },
  fat_per_gram: {
    type: Number,
    required: [true, 'Fat per gram is required'],
    min: 0
  },
  carbs_per_gram: {
    type: Number,
    required: [true, 'Carbs per gram is required'],
    min: 0
  },
  category: {
    type: String,
    enum: ['vegetable', 'fruit', 'protein', 'grain', 'dairy', 'spice', 'oil', 'nut', 'other'], // Added 'nut' here
    default: 'other'
  }
}, {
  timestamps: true
});

// Index for faster searching
ingredientSchema.index({ name: 'text' });

module.exports = mongoose.model('Ingredient', ingredientSchema);