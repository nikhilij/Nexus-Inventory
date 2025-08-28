require('dotenv').config();

const express = require('express');
const app = express();

// Import Sequelize connection and models
const sequelize = require('./src/config/sequelize');
const Product = require('./src/models/productModel');

// Import routes
const productRoutes = require('./src/api/productsRoutes');

// Import middleware
const errorMiddleware = require('./src/middleware/errorMiddleware');

// Sync database models
// sequelize.sync();
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1); // Exit the process with a failure code
  }
}
testConnection();
// Built-in middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint (no middleware needed)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes - middleware applied at route level for better organization
app.use('/api/products', productRoutes);

// Error handling middleware (MUST be last middleware)
app.use(errorMiddleware);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
    console.log('API Routes:');
    console.log('  GET /api/products -> Public (no auth)');
    console.log('  GET /api/products/:id -> Public (no auth)');
    console.log('  POST /api/products -> Protected (auth + validation)');
    console.log('  PUT /api/products/:id -> Protected (auth + validation)');
    console.log('  DELETE /api/products/:id -> Protected (auth only)');
    console.log('  PATCH /api/products/status -> Protected (auth only)');
});