// src/config/sequelize.js
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance. It will automatically use the environment variables from .env
const sequelize = new Sequelize(
  process.env.DB_DATABASE,   // Database name
  process.env.DB_USER,       // Username
  process.env.DB_PASSWORD,   // Password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries only in dev
    pool: {
      max: 5,     // Maximum number of connections in pool
      min: 0,     // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) to try to get a connection before throwing an error
      idle: 10000 // Maximum time (ms) a connection can be idle before being released
    }
  }
);

module.exports = sequelize;