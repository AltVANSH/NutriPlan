const mongoose = require('mongoose');

const pantryItemSchema = new mongoose.Schema({
  ingredient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity_grams: {
    type: Number,
    required: true,
    min: 0
  },
  added_date: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date,
    default: null
  }
}, { _id: true });

const pantrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [pantryItemSchema]
}, {
  timestamps: true
});

// addIngredient() - Instance method from class diagram
pantrySchema.methods.addIngredient = async function(ingredientId, quantityGrams, expiryDate = null) {
  // Check if ingredient already exists in pantry
  const existingItemIndex = this.items.findIndex(
    item => item.ingredient_id.toString() === ingredientId.toString()
  );

  if (existingItemIndex !== -1) {
    // Update quantity if ingredient exists
    this.items[existingItemIndex].quantity_grams += quantityGrams;
    if (expiryDate) {
      this.items[existingItemIndex].expiry_date = expiryDate;
    }
  } else {
    // Add new ingredient
    this.items.push({
      ingredient_id: ingredientId,
      quantity_grams: quantityGrams,
      expiry_date: expiryDate
    });
  }

  await this.save();
  return this;
};

// removeIngredient() - Instance method from class diagram
pantrySchema.methods.removeIngredient = async function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  await this.save();
  return this;
};

// getIngredients() - Instance method from class diagram
pantrySchema.methods.getIngredients = async function() {
  await this.populate('items.ingredient_id');
  return this.items;
};

// hasIngredient() - Instance method from class diagram
pantrySchema.methods.hasIngredient = function(ingredientId, requiredQuantity = 0) {
  const item = this.items.find(
    item => item.ingredient_id.toString() === ingredientId.toString()
  );

  if (!item) {
    return false;
  }

  if (requiredQuantity > 0) {
    return item.quantity_grams >= requiredQuantity;
  }

  return true;
};

// Static method to get or create pantry for user
pantrySchema.statics.getOrCreatePantry = async function(userId) {
  let pantry = await this.findOne({ user_id: userId });
  
  if (!pantry) {
    pantry = await this.create({ user_id: userId, items: [] });
  }
  
  return pantry;
};

module.exports = mongoose.model('Pantry', pantrySchema);