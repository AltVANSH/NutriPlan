require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');

// --- UPDATED & EXPANDED INGREDIENTS ---
const seedIngredients = [
  // Proteins
  { name: 'Chicken Breast', calories_per_gram: 1.65, protein_per_gram: 0.31, fat_per_gram: 0.036, carbs_per_gram: 0, category: 'protein' },
  { name: 'Eggs', calories_per_gram: 1.55, protein_per_gram: 0.13, fat_per_gram: 0.11, carbs_per_gram: 0.011, category: 'protein' },
  { name: 'Paneer', calories_per_gram: 2.96, protein_per_gram: 0.18, fat_per_gram: 0.23, carbs_per_gram: 0.06, category: 'protein' },
  { name: 'Tofu', calories_per_gram: 0.76, protein_per_gram: 0.08, fat_per_gram: 0.048, carbs_per_gram: 0.019, category: 'protein' },
  { name: 'Chickpeas', calories_per_gram: 1.64, protein_per_gram: 0.09, fat_per_gram: 0.026, carbs_per_gram: 0.27, category: 'protein' },
  { name: 'Red Lentils', calories_per_gram: 1.16, protein_per_gram: 0.09, fat_per_gram: 0.004, carbs_per_gram: 0.20, category: 'protein' },
  { name: 'Moong Dal', calories_per_gram: 3.47, protein_per_gram: 0.24, fat_per_gram: 0.01, carbs_per_gram: 0.63, category: 'protein' },
  { name: 'Rajma (Kidney Beans)', calories_per_gram: 1.27, protein_per_gram: 0.09, fat_per_gram: 0.005, carbs_per_gram: 0.23, category: 'protein' },
  { name: 'Fish', calories_per_gram: 1.05, protein_per_gram: 0.20, fat_per_gram: 0.025, carbs_per_gram: 0, category: 'protein' },
  { name: 'Prawns', calories_per_gram: 0.99, protein_per_gram: 0.24, fat_per_gram: 0.003, carbs_per_gram: 0.002, category: 'protein' },

  // Vegetables
  { name: 'Spinach', calories_per_gram: 0.23, protein_per_gram: 0.029, fat_per_gram: 0.004, carbs_per_gram: 0.036, category: 'vegetable' },
  { name: 'Tomatoes', calories_per_gram: 0.18, protein_per_gram: 0.009, fat_per_gram: 0.002, carbs_per_gram: 0.039, category: 'vegetable' },
  { name: 'Onion', calories_per_gram: 0.40, protein_per_gram: 0.011, fat_per_gram: 0.001, carbs_per_gram: 0.093, category: 'vegetable' },
  { name: 'Garlic', calories_per_gram: 1.49, protein_per_gram: 0.064, fat_per_gram: 0.005, carbs_per_gram: 0.33, category: 'vegetable' },
  { name: 'Ginger', calories_per_gram: 0.80, protein_per_gram: 0.018, fat_per_gram: 0.008, carbs_per_gram: 0.18, category: 'vegetable' },
  { name: 'Carrots', calories_per_gram: 0.41, protein_per_gram: 0.009, fat_per_gram: 0.002, carbs_per_gram: 0.096, category: 'vegetable' },
  { name: 'Potato', calories_per_gram: 0.77, protein_per_gram: 0.02, fat_per_gram: 0.001, carbs_per_gram: 0.17, category: 'vegetable' },
  { name: 'Cauliflower', calories_per_gram: 0.25, protein_per_gram: 0.019, fat_per_gram: 0.003, carbs_per_gram: 0.05, category: 'vegetable' },
  { name: 'Green Peas', calories_per_gram: 0.81, protein_per_gram: 0.05, fat_per_gram: 0.004, carbs_per_gram: 0.14, category: 'vegetable' },
  { name: 'Sweet Corn', calories_per_gram: 0.86, protein_per_gram: 0.032, fat_per_gram: 0.012, carbs_per_gram: 0.19, category: 'vegetable' },
  { name: 'Capsicum', calories_per_gram: 0.31, protein_per_gram: 0.01, fat_per_gram: 0.003, carbs_per_gram: 0.06, category: 'vegetable' },
  { name: 'Green Chilies', calories_per_gram: 0.40, protein_per_gram: 0.019, fat_per_gram: 0.002, carbs_per_gram: 0.09, category: 'vegetable' },
  { name: 'Cucumber', calories_per_gram: 0.15, protein_per_gram: 0.007, fat_per_gram: 0.001, carbs_per_gram: 0.036, category: 'vegetable' },
  { name: 'Zucchini', calories_per_gram: 0.17, protein_per_gram: 0.012, fat_per_gram: 0.003, carbs_per_gram: 0.03, category: 'vegetable' },

  // Grains
  { name: 'Rice', calories_per_gram: 1.30, protein_per_gram: 0.027, fat_per_gram: 0.003, carbs_per_gram: 0.28, category: 'grain' },
  { name: 'Wheat Flour', calories_per_gram: 3.64, protein_per_gram: 0.10, fat_per_gram: 0.01, carbs_per_gram: 0.76, category: 'grain' },
  { name: 'Wheat Bread', calories_per_gram: 2.65, protein_per_gram: 0.09, fat_per_gram: 0.03, carbs_per_gram: 0.49, category: 'grain' },
  { name: 'Brown Rice', calories_per_gram: 1.11, protein_per_gram: 0.026, fat_per_gram: 0.009, carbs_per_gram: 0.23, category: 'grain' },
  { name: 'Basmati Rice', calories_per_gram: 1.30, protein_per_gram: 0.035, fat_per_gram: 0.004, carbs_per_gram: 0.28, category: 'grain' },
  { name: 'Ragi Flour', calories_per_gram: 3.28, protein_per_gram: 0.07, fat_per_gram: 0.01, carbs_per_gram: 0.72, category: 'grain' },
  { name: 'Oats', calories_per_gram: 3.89, protein_per_gram: 0.169, fat_per_gram: 0.069, carbs_per_gram: 0.661, category: 'grain' },

  // Dairy
  { name: 'Milk', calories_per_gram: 0.42, protein_per_gram: 0.033, fat_per_gram: 0.01, carbs_per_gram: 0.05, category: 'dairy' },
  { name: 'Yogurt', calories_per_gram: 0.61, protein_per_gram: 0.035, fat_per_gram: 0.033, carbs_per_gram: 0.047, category: 'dairy' },
  { name: 'Greek Yogurt', calories_per_gram: 0.59, protein_per_gram: 0.10, fat_per_gram: 0.004, carbs_per_gram: 0.036, category: 'dairy' },
  { name: 'Coconut Milk', calories_per_gram: 2.30, protein_per_gram: 0.023, fat_per_gram: 0.24, carbs_per_gram: 0.05, category: 'dairy' },

  // Oils & Fats
  { name: 'Ghee', calories_per_gram: 8.99, protein_per_gram: 0, fat_per_gram: 0.99, carbs_per_gram: 0, category: 'oil' },
  { name: 'Vegetable Oil', calories_per_gram: 8.84, protein_per_gram: 0, fat_per_gram: 1.0, carbs_per_gram: 0, category: 'oil' },
  { name: 'Butter', calories_per_gram: 7.17, protein_per_gram: 0.009, fat_per_gram: 0.81, carbs_per_gram: 0.006, category: 'dairy' },

  // Fruits
  { name: 'Lemon Juice', calories_per_gram: 0.29, protein_per_gram: 0.004, fat_per_gram: 0.002, carbs_per_gram: 0.09, category: 'fruit' },
  { name: 'Tamarind', calories_per_gram: 2.39, protein_per_gram: 0.028, fat_per_gram: 0.006, carbs_per_gram: 0.62, category: 'fruit' },

  // Nuts
  { name: 'Cashews', calories_per_gram: 5.53, protein_per_gram: 0.18, fat_per_gram: 0.44, carbs_per_gram: 0.30, category: 'nut' },
  { name: 'Almonds', calories_per_gram: 5.79, protein_per_gram: 0.21, fat_per_gram: 0.50, carbs_per_gram: 0.22, category: 'nut' },

  // Spices & Seasonings
  { name: 'Salt', calories_per_gram: 0, protein_per_gram: 0, fat_per_gram: 0, carbs_per_gram: 0, category: 'spice' },
  { name: 'Black Pepper', calories_per_gram: 2.51, protein_per_gram: 0.104, fat_per_gram: 0.033, carbs_per_gram: 0.641, category: 'spice' },
  { name: 'Turmeric Powder', calories_per_gram: 3.54, protein_per_gram: 0.08, fat_per_gram: 0.10, carbs_per_gram: 0.65, category: 'spice' },
  { name: 'Cumin Seeds', calories_per_gram: 3.75, protein_per_gram: 0.18, fat_per_gram: 0.22, carbs_per_gram: 0.44, category: 'spice' },
  { name: 'Coriander Powder', calories_per_gram: 2.98, protein_per_gram: 0.12, fat_per_gram: 0.17, carbs_per_gram: 0.55, category: 'spice' },
  { name: 'Coriander Seeds', calories_per_gram: 2.98, protein_per_gram: 0.12, fat_per_gram: 0.17, carbs_per_gram: 0.55, category: 'spice' },
  { name: 'Coriander (fresh)', calories_per_gram: 0.23, protein_per_gram: 0.021, fat_per_gram: 0.005, carbs_per_gram: 0.037, category: 'spice' },
  { name: 'Garam Masala', calories_per_gram: 3.61, protein_per_gram: 0.11, fat_per_gram: 0.15, carbs_per_gram: 0.60, category: 'spice' },
  { name: 'Red Chili Powder', calories_per_gram: 3.18, protein_per_gram: 0.12, fat_per_gram: 0.17, carbs_per_gram: 0.57, category: 'spice' },
  { name: 'Dried Red Chilies', calories_per_gram: 3.18, protein_per_gram: 0.12, fat_per_gram: 0.17, carbs_per_gram: 0.57, category: 'spice' },
  { name: 'Mustard Seeds', calories_per_gram: 5.08, protein_per_gram: 0.26, fat_per_gram: 0.36, carbs_per_gram: 0.28, category: 'spice' },
  { name: 'Chaat Masala', calories_per_gram: 3.0, protein_per_gram: 0.1, fat_per_gram: 0.1, carbs_per_gram: 0.6, category: 'spice' },
  { name: 'Black Salt', calories_per_gram: 0, protein_per_gram: 0, fat_per_gram: 0, carbs_per_gram: 0, category: 'spice' },
];

// --- UPDATED & EXPANDED RECIPES ---
const seedRecipes = async () => {
  // Get all ingredient IDs
  const chicken = await Ingredient.findOne({ name: 'Chicken Breast' });
  const paneer = await Ingredient.findOne({ name: 'Paneer' });
  const chickpeas = await Ingredient.findOne({ name: 'Chickpeas' });
  const redLentils = await Ingredient.findOne({ name: 'Red Lentils' });
  const spinach = await Ingredient.findOne({ name: 'Spinach' });
  const tomatoes = await Ingredient.findOne({ name: 'Tomatoes' });
  const onion = await Ingredient.findOne({ name: 'Onion' });
  const garlic = await Ingredient.findOne({ name: 'Garlic' });
  const ginger = await Ingredient.findOne({ name: 'Ginger' });
  const potato = await Ingredient.findOne({ name: 'Potato' });
  const cauliflower = await Ingredient.findOne({ name: 'Cauliflower' });
  const rice = await Ingredient.findOne({ name: 'Rice' });
  const yogurt = await Ingredient.findOne({ name: 'Yogurt' });
  const ghee = await Ingredient.findOne({ name: 'Ghee' });
  const vegetableOil = await Ingredient.findOne({ name: 'Vegetable Oil' });
  const salt = await Ingredient.findOne({ name: 'Salt' });
  const pepper = await Ingredient.findOne({ name: 'Black Pepper' });
  const turmeric = await Ingredient.findOne({ name: 'Turmeric Powder' });
  const cuminSeeds = await Ingredient.findOne({ name: 'Cumin Seeds' });
  const corianderPowder = await Ingredient.findOne({ name: 'Coriander Powder' });
  const garamMasala = await Ingredient.findOne({ name: 'Garam Masala' });
  const redChiliPowder = await Ingredient.findOne({ name: 'Red Chili Powder' });
  const mustardSeeds = await Ingredient.findOne({ name: 'Mustard Seeds' });
  const greenPeas = await Ingredient.findOne({ name: 'Green Peas' });

  // New ingredient IDs
  const sweetCorn = await Ingredient.findOne({ name: 'Sweet Corn' });
  const capsicum = await Ingredient.findOne({ name: 'Capsicum' });
  const greekYogurt = await Ingredient.findOne({ name: 'Greek Yogurt' });
  const corianderFresh = await Ingredient.findOne({ name: 'Coriander (fresh)' });
  const greenChilies = await Ingredient.findOne({ name: 'Green Chilies' });
  const cucumber = await Ingredient.findOne({ name: 'Cucumber' });
  const lemonJuice = await Ingredient.findOne({ name: 'Lemon Juice' });
  const chaatMasala = await Ingredient.findOne({ name: 'Chaat Masala' });
  const blackSalt = await Ingredient.findOne({ name: 'Black Salt' });
  const cashews = await Ingredient.findOne({ name: 'Cashews' });
  const corianderSeeds = await Ingredient.findOne({ name: 'Coriander Seeds' });
  const moongDal = await Ingredient.findOne({ name: 'Moong Dal' });
  const rajma = await Ingredient.findOne({ name: 'Rajma (Kidney Beans)' });
  const brownRice = await Ingredient.findOne({ name: 'Brown Rice' });
  const oats = await Ingredient.findOne({ name: 'Oats' });
  const fish = await Ingredient.findOne({ name: 'Fish' });
  const coconutMilk = await Ingredient.findOne({ name: 'Coconut Milk' });
  const tamarind = await Ingredient.findOne({ name: 'Tamarind' });
  const prawns = await Ingredient.findOne({ name: 'Prawns' });
  const zucchini = await Ingredient.findOne({ name: 'Zucchini' });
  const wheatBread = await Ingredient.findOne({ name: 'Wheat Bread' });


  const recipes = [
    // --- Original 5 Recipes ---
    {
      name: 'Chicken Tikka Masala',
      instructions: '1. Marinate chicken in yogurt, ginger, garlic, and spices.\n2. Grill or pan-sear chicken.\n3. Create a gravy with onion, tomatoes, and spices.\n4. Add chicken to gravy and simmer.\n5. Serve with rice.',
      cooking_time_minutes: 45,
      dietary_category: ['gluten-free'],
      servings: 4,
      ingredients: [
        { ingredient: chicken._id, quantity_grams: 500 },
        { ingredient: yogurt._id, quantity_grams: 150 },
        { ingredient: tomatoes._id, quantity_grams: 400 },
        { ingredient: onion._id, quantity_grams: 150 },
        { ingredient: garlic._id, quantity_grams: 15 },
        { ingredient: ginger._id, quantity_grams: 15 },
        { ingredient: garamMasala._id, quantity_grams: 10 },
        { ingredient: turmeric._id, quantity_grams: 5 },
        { ingredient: corianderPowder._id, quantity_grams: 5 },
        { ingredient: redChiliPowder._id, quantity_grams: 3 },
        { ingredient: vegetableOil._id, quantity_grams: 30 },
        { ingredient: salt._id, quantity_grams: 5 }
      ]
    },
    {
      name: 'Palak Paneer',
      instructions: '1. Blanch spinach and blend to a paste.\n2. Sauté onion, garlic, ginger.\n3. Add tomato puree and spices, cook until oil separates.\n4. Add spinach paste and paneer cubes.\n5. Simmer for 10 minutes.',
      cooking_time_minutes: 35,
      dietary_category: ['vegetarian', 'gluten-free', 'low-carb', 'keto'],
      servings: 3,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 250 },
        { ingredient: spinach._id, quantity_grams: 400 },
        { ingredient: onion._id, quantity_grams: 100 },
        { ingredient: tomatoes._id, quantity_grams: 150 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: ghee._id, quantity_grams: 20 },
        { ingredient: turmeric._id, quantity_grams: 3 },
        { ingredient: garamMasala._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Chana Masala',
      instructions: '1. Sauté onions, garlic, and ginger.\n2. Add tomatoes and spices, cook into a paste.\n3. Add boiled chickpeas and water.\n4. Simmer for 15-20 minutes.\n5. Garnish with coriander.',
      cooking_time_minutes: 30,
      dietary_category: ['vegetarian', 'vegan', 'gluten-free'],
      servings: 4,
      ingredients: [
        { ingredient: chickpeas._id, quantity_grams: 400 },
        { ingredient: tomatoes._id, quantity_grams: 300 },
        { ingredient: onion._id, quantity_grams: 150 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: vegetableOil._id, quantity_grams: 25 },
        { ingredient: cuminSeeds._id, quantity_grams: 5 },
        { ingredient: corianderPowder._id, quantity_grams: 7 },
        { ingredient: turmeric._id, quantity_grams: 4 },
        { ingredient: garamMasala._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 5 }
      ]
    },
    {
      name: 'Aloo Gobi',
      instructions: '1. Sauté cumin seeds in oil.\n2. Add onion, garlic, ginger and cook until golden.\n3. Add tomatoes and spices (turmeric, coriander).\n4. Add potato and cauliflower florets.\n5. Cover and cook until vegetables are tender.',
      cooking_time_minutes: 30,
      dietary_category: ['vegetarian', 'vegan', 'gluten-free'],
      servings: 3,
      ingredients: [
        { ingredient: potato._id, quantity_grams: 300 },
        { ingredient: cauliflower._id, quantity_grams: 400 },
        { ingredient: onion._id, quantity_grams: 100 },
        { ingredient: tomatoes._id, quantity_grams: 150 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: vegetableOil._id, quantity_grams: 20 },
        { ingredient: cuminSeeds._id, quantity_grams: 5 },
        { ingredient: turmeric._id, quantity_grams: 5 },
        { ingredient: corianderPowder._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Dal Tadka',
      instructions: '1. Boil red lentils with turmeric and salt until soft.\n2. Prepare tadka (tempering) in a separate pan: heat ghee, add mustard seeds, cumin seeds, garlic, and red chili powder.\n3. Pour tadka over the cooked dal.',
      cooking_time_minutes: 25,
      dietary_category: ['vegetarian', 'gluten-free'],
      servings: 2,
      ingredients: [
        { ingredient: redLentils._id, quantity_grams: 150 },
        { ingredient: tomatoes._id, quantity_grams: 100 },
        { ingredient: onion._id, quantity_grams: 50 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ghee._id, quantity_grams: 15 },
        { ingredient: mustardSeeds._id, quantity_grams: 3 },
        { ingredient: cuminSeeds._id, quantity_grams: 3 },
        { ingredient: turmeric._id, quantity_grams: 4 },
        { ingredient: redChiliPowder._id, quantity_grams: 2 },
        { ingredient: salt._id, quantity_grams: 3 }
      ]
    },

    // --- NEW RECIPES FROM YOUR LIST ---
    {
      name: 'Healthy Paneer Corn Sandwich',
      instructions: '1. Use whole-wheat bread.\n2. Create filling with crumbled paneer, boiled sweet corn, and finely chopped capsicum.\n3. Bind with hung curd (Greek yogurt), black pepper, and coriander.\n4. Grill in a toaster with minimal oil.',
      cooking_time_minutes: 15,
      dietary_category: ['vegetarian'],
      servings: 2,
      ingredients: [
        { ingredient: wheatBread._id, quantity_grams: 100 },
        { ingredient: paneer._id, quantity_grams: 100 },
        { ingredient: sweetCorn._id, quantity_grams: 50 },
        { ingredient: capsicum._id, quantity_grams: 30 },
        { ingredient: greekYogurt._id, quantity_grams: 30 },
        { ingredient: pepper._id, quantity_grams: 1 },
        { ingredient: corianderFresh._id, quantity_grams: 5 }
      ]
    },
    {
      name: 'Paneer Bhurji',
      instructions: '1. Sauté onions, tomatoes, and green chilies in 1 tsp oil.\n2. Add spices (turmeric, chili powder).\n3. Toss in crumbled paneer.\n4. Cook for 3-5 minutes and garnish with coriander.',
      cooking_time_minutes: 15,
      dietary_category: ['vegetarian', 'gluten-free', 'low-carb'],
      servings: 2,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 200 },
        { ingredient: onion._id, quantity_grams: 100 },
        { ingredient: tomatoes._id, quantity_grams: 100 },
        { ingredient: greenChilies._id, quantity_grams: 10 },
        { ingredient: vegetableOil._id, quantity_grams: 10 },
        { ingredient: turmeric._id, quantity_grams: 3 },
        { ingredient: redChiliPowder._id, quantity_grams: 2 },
        { ingredient: corianderFresh._id, quantity_grams: 10 },
        { ingredient: salt._id, quantity_grams: 2 }
      ]
    },
    {
      name: 'Paneer Corn Chaat',
      instructions: '1. Combine small cubes of fresh paneer, boiled sweet corn, chopped cucumber, tomatoes, and onions in a bowl.\n2. Squeeze fresh lemon juice.\n3. Add a sprinkle of chaat masala and black salt. Toss well.',
      cooking_time_minutes: 10,
      dietary_category: ['vegetarian', 'gluten-free', 'no-cook'],
      servings: 2,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 150 },
        { ingredient: sweetCorn._id, quantity_grams: 100 },
        { ingredient: cucumber._id, quantity_grams: 100 },
        { ingredient: tomatoes._id, quantity_grams: 100 },
        { ingredient: onion._id, quantity_grams: 50 },
        { ingredient: lemonJuice._id, quantity_grams: 15 },
        { ingredient: chaatMasala._id, quantity_grams: 5 },
        { ingredient: blackSalt._id, quantity_grams: 2 }
      ]
    },
    {
      name: 'Healthy Paneer Butter Masala',
      instructions: '1. Blend soaked cashews into a paste.\n2. Sauté onions, ginger, garlic.\n3. Add tomatoes and cook down.\n4. Add spices and cashew paste.\n5. Add paneer cubes and simmer.',
      cooking_time_minutes: 35,
      dietary_category: ['vegetarian', 'gluten-free'],
      servings: 3,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 250 },
        { ingredient: tomatoes._id, quantity_grams: 400 },
        { ingredient: onion._id, quantity_grams: 150 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: cashews._id, quantity_grams: 30 },
        { ingredient: vegetableOil._id, quantity_grams: 15 },
        { ingredient: garamMasala._id, quantity_grams: 5 },
        { ingredient: turmeric._id, quantity_grams: 3 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Kadai Paneer',
      instructions: '1. Sauté coriander seeds and dried red chilies, then grind them.\n2. Sauté paneer, capsicum, and onions until lightly charred.\n3. In same kadai, cook onion-tomato-ginger-garlic paste.\n4. Add ground spices.\n5. Add back paneer and vegetables. Stir-fry.',
      cooking_time_minutes: 30,
      dietary_category: ['vegetarian', 'gluten-free'],
      servings: 3,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 250 },
        { ingredient: capsicum._id, quantity_grams: 150 },
        { ingredient: onion._id, quantity_grams: 200 },
        { ingredient: tomatoes._id, quantity_grams: 300 },
        { ingredient: corianderSeeds._id, quantity_grams: 10 },
        { ingredient: redChiliPowder._id, quantity_grams: 5 },
        { ingredient: vegetableOil._id, quantity_grams: 20 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Matar Paneer',
      instructions: '1. Sauté onion, tomato, ginger, and garlic paste in minimal oil.\n2. Add spices (turmeric, coriander powder, red chili powder).\n3. Add green peas and cook.\n4. Add paneer cubes and a little water. Simmer.',
      cooking_time_minutes: 30,
      dietary_category: ['vegetarian', 'gluten-free'],
      servings: 3,
      ingredients: [
        { ingredient: paneer._id, quantity_grams: 200 },
        { ingredient: greenPeas._id, quantity_grams: 150 },
        { ingredient: tomatoes._id, quantity_grams: 250 },
        { ingredient: onion._id, quantity_grams: 100 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: vegetableOil._id, quantity_grams: 15 },
        { ingredient: turmeric._id, quantity_grams: 3 },
        { ingredient: corianderPowder._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Moong Dal Chilla',
      instructions: '1. Soak moong dal for 3-4 hours and grind to a smooth batter with ginger and green chilies.\n2. Add salt and turmeric.\n3. Pour a ladle of batter on a non-stick pan with minimal oil.\n4. Cook on both sides until golden. Can be stuffed with paneer.',
      cooking_time_minutes: 20,
      dietary_category: ['vegetarian', 'vegan', 'gluten-free'],
      servings: 4,
      ingredients: [
        { ingredient: moongDal._id, quantity_grams: 200 },
        { ingredient: vegetableOil._id, quantity_grams: 10 },
        { ingredient: greenChilies._id, quantity_grams: 5 },
        { ingredient: ginger._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 3 },
        { ingredient: turmeric._id, quantity_grams: 2 }
      ]
    },
    {
      name: 'Rajma Masala',
      instructions: '1. Sauté onion, ginger, garlic paste.\n2. Add tomato puree and cook down.\n3. Add spices (coriander powder, turmeric, garam masala).\n4. Add boiled kidney beans (rajma) and water.\n5. Simmer for 20-30 minutes.',
      cooking_time_minutes: 40,
      dietary_category: ['vegetarian', 'vegan', 'gluten-free'],
      servings: 4,
      ingredients: [
        { ingredient: rajma._id, quantity_grams: 300 },
        { ingredient: onion._id, quantity_grams: 150 },
        { ingredient: tomatoes._id, quantity_grams: 300 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: ginger._id, quantity_grams: 10 },
        { ingredient: vegetableOil._id, quantity_grams: 20 },
        { ingredient: corianderPowder._id, quantity_grams: 7 },
        { ingredient: turmeric._id, quantity_grams: 4 },
        { ingredient: garamMasala._id, quantity_grams: 5 },
        { ingredient: salt._id, quantity_grams: 5 }
      ]
    },
    {
      name: 'Oats Uthappam',
      instructions: '1. Grind oats to a flour. Mix with yogurt, salt, and water to make a batter.\n2. Let it rest for 15 minutes.\n3. Heat a pan, pour a ladle of batter.\n4. Top with chopped onions, tomatoes, and capsicum.\n5. Cook on both sides with minimal oil.',
      cooking_time_minutes: 20,
      dietary_category: ['vegetarian', 'gluten-free'],
      servings: 2,
      ingredients: [
        { ingredient: oats._id, quantity_grams: 150 },
        { ingredient: yogurt._id, quantity_grams: 100 },
        { ingredient: onion._id, quantity_grams: 50 },
        { ingredient: tomatoes._id, quantity_grams: 50 },
        { ingredient: capsicum._id, quantity_grams: 30 },
        { ingredient: vegetableOil._id, quantity_grams: 10 },
        { ingredient: salt._id, quantity_grams: 3 }
      ]
    },
    {
      name: 'Tandoori Chicken Tikka',
      instructions: '1. Marinate chicken chunks in yogurt, ginger-garlic paste, and spices (red chili, turmeric, garam masala).\n2. Let it marinate for at least 1 hour.\n3. Skewer the chicken.\n4. Grill or bake in a hot oven (220°C) for 15-20 minutes.',
      cooking_time_minutes: 30,
      dietary_category: ['gluten-free', 'low-carb', 'keto'],
      servings: 3,
      ingredients: [
        { ingredient: chicken._id, quantity_grams: 500 },
        { ingredient: yogurt._id, quantity_grams: 150 },
        { ingredient: ginger._id, quantity_grams: 15 },
        { ingredient: garlic._id, quantity_grams: 15 },
        { ingredient: redChiliPowder._id, quantity_grams: 10 },
        { ingredient: turmeric._id, quantity_grams: 5 },
        { ingredient: garamMasala._id, quantity_grams: 7 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Malabar Fish Curry',
      instructions: '1. Sauté mustard seeds, fenugreek seeds, and curry leaves.\n2. Add onion, ginger, garlic paste and cook.\n3. Add tomato and spices (turmeric, red chili, coriander powder).\n4. Add tamarind water and light coconut milk. Bring to a simmer.\n5. Add fish pieces and cook for 10-12 minutes.',
      cooking_time_minutes: 30,
      dietary_category: ['gluten-free'],
      servings: 3,
      ingredients: [
        { ingredient: fish._id, quantity_grams: 400 },
        { ingredient: coconutMilk._id, quantity_grams: 200 },
        { ingredient: tomatoes._id, quantity_grams: 150 },
        { ingredient: onion._id, quantity_grams: 100 },
        { ingredient: tamarind._id, quantity_grams: 20 },
        { ingredient: mustardSeeds._id, quantity_grams: 5 },
        { ingredient: turmeric._id, quantity_grams: 4 },
        { ingredient: redChiliPowder._id, quantity_grams: 5 },
        { ingredient: vegetableOil._id, quantity_grams: 15 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Chicken Jalfrezi',
      instructions: '1. Stir-fry chicken breast strips until cooked. Set aside.\n2. In the same pan, stir-fry bell peppers (capsicum) and onions until crisp-tender.\n3. Add ginger-garlic paste and tomatoes.\n4. Add spices (turmeric, coriander powder) and the cooked chicken.\n5. Toss to combine and heat through.',
      cooking_time_minutes: 25,
      dietary_category: ['gluten-free', 'low-carb'],
      servings: 3,
      ingredients: [
        { ingredient: chicken._id, quantity_grams: 400 },
        { ingredient: capsicum._id, quantity_grams: 200 },
        { ingredient: onion._id, quantity_grams: 150 },
        { ingredient: tomatoes._id, quantity_grams: 200 },
        { ingredient: turmeric._id, quantity_grams: 3 },
        { ingredient: corianderPowder._id, quantity_grams: 5 },
        { ingredient: vegetableOil._id, quantity_grams: 20 },
        { ingredient: salt._id, quantity_grams: 4 }
      ]
    },
    {
      name: 'Prawn and Vegetable Skewers',
      instructions: '1. Marinate prawns in lemon juice, garlic, chili powder, and turmeric.\n2. Thread prawns onto skewers, alternating with chunks of zucchini and capsicum.\n3. Grill or pan-sear the skewers for 3-4 minutes per side, until prawns are pink.',
      cooking_time_minutes: 15,
      dietary_category: ['gluten-free', 'low-carb', 'paleo'],
      servings: 2,
      ingredients: [
        { ingredient: prawns._id, quantity_grams: 300 },
        { ingredient: zucchini._id, quantity_grams: 150 },
        { ingredient: capsicum._id, quantity_grams: 100 },
        { ingredient: lemonJuice._id, quantity_grams: 15 },
        { ingredient: garlic._id, quantity_grams: 10 },
        { ingredient: redChiliPowder._id, quantity_grams: 3 },
        { ingredient: vegetableOil._id, quantity_grams: 10 },
        { ingredient: salt._id, quantity_grams: 2 }
      ]
    },
    {
      name: 'Healthy Chicken Biryani (Brown Rice)',
      instructions: '1. Marinate chicken in yogurt, ginger, garlic, and biryani spices.\n2. Par-cook brown rice.\n3. In a pot, layer the marinated chicken and par-cooked brown rice with fried onions and mint.\n4. Cook on low heat (dum method) for 30-40 minutes.',
      cooking_time_minutes: 60,
      dietary_category: ['gluten-free'],
      servings: 4,
      ingredients: [
        { ingredient: chicken._id, quantity_grams: 500 },
        { ingredient: brownRice._id, quantity_grams: 300 },
        { ingredient: yogurt._id, quantity_grams: 150 },
        { ingredient: onion._id, quantity_grams: 200 },
        { ingredient: tomatoes._id, quantity_grams: 150 },
        { ingredient: ginger._id, quantity_grams: 15 },
        { ingredient: garlic._id, quantity_grams: 15 },
        { ingredient: garamMasala._id, quantity_grams: 10 },
        { ingredient: ghee._id, quantity_grams: 20 },
        { ingredient: salt._id, quantity_grams: 5 }
      ]
    }
  ];

  await Recipe.insertMany(recipes);
};

// --- UNCHANGED SCRIPT RUNNER ---
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing data...');
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    console.log('🌱 Seeding ingredients...');
    await Ingredient.insertMany(seedIngredients);
    console.log(`✅ ${seedIngredients.length} ingredients added`);
    console.log('🌱 Seeding recipes...');
    await seedRecipes();
    console.log('✅ Recipes added');
    console.log('✨ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();