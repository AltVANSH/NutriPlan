require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();

connectDB();

// ✅ CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400
}));

// ✅ Helmet - Disabled in development to avoid CORS issues
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
} else {
  console.log('⚠️  Helmet disabled in development mode');
}

// ✅ FIXED: Rate limiting ONLY in production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', limiter);
  console.log('🛡️  Rate limiting enabled (production mode)');
} else {
  console.log('⚠️  Rate limiting disabled in development mode');
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const pantryRoutes = require('./routes/pantry');
const recipeRoutes = require('./routes/recipes');
const mealPlanRoutes = require('./routes/mealPlan');
const shoppingListRoutes = require('./routes/shoppingList');
const nutritionRoutes = require('./routes/nutrition');
const ingredientRoutes = require('./routes/ingredients');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/shopping-list', shoppingListRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/ingredients', ingredientRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NutriPlan API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to NutriPlan API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      pantry: '/api/pantry',
      recipes: '/api/recipes',
      mealPlan: '/api/meal-plan',
      shoppingList: '/api/shopping-list',
      nutrition: '/api/nutrition',
      ingredients: '/api/ingredients'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   NutriPlan Backend Server Running   ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}       ║
  ║   Database: MongoDB                   ║
  ║   CORS: Enabled for localhost:5173    ║
  ║   Rate Limiting: ${process.env.NODE_ENV === 'production' ? 'ENABLED' : 'DISABLED'} ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;