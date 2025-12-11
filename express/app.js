/**
 * =============================================================================
 * EXPRESS.JS ADVANCED API - Main Application
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates production-ready Express.js API setup with:
 * - Security middleware (CORS, rate limiting, compression)
 * - API documentation (Swagger/OpenAPI)
 * - Structured routing
 * - Centralized error handling
 * 
 * INTERVIEW TOPICS:
 * - Middleware execution order
 * - RESTful API design principles
 * - API versioning strategies
 * - Security best practices
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('express-async-errors'); // Automatically catches async errors

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();

/**
 * SWAGGER/OPENAPI CONFIGURATION
 * 
 * Purpose: Auto-generates API documentation from JSDoc comments
 * 
 * Benefits:
 * - Interactive API testing interface
 * - Always up-to-date with code
 * - Standard format (OpenAPI 3.0)
 * - Can generate client SDKs
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'Advanced Express.js API for e-commerce',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development' }],
  },
  apis: ['./routes/*.js'], // Path to route files with JSDoc comments
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**

 * RATE LIMITING MIDDLEWARE
 * 
 * Purpose: Prevents API abuse by limiting requests per IP
 * 
 * Configuration:
 * - windowMs: Time window in milliseconds
 * - max: Maximum requests per window
 * - message: Error message when limit exceeded
 * 
 * Interview Tip: For distributed systems, use Redis-backed rate limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * MIDDLEWARE STACK
 * 
 * Order matters! Middleware executes in the order it's registered.
 * 
 * Recommended order:
 * 1. Security (rate limiting, helmet)
 * 2. CORS
 * 3. Compression
 * 4. Logging
 * 5. Body parsing
 * 6. Custom middleware
 * 7. Routes
 * 8. Error handling (MUST be last)
 */
app.use(limiter);           // Rate limiting first to block abusers early
app.use(cors());            // Enable Cross-Origin Resource Sharing
app.use(compression());     // Compress responses (gzip)
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10mb' }));      // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestLogger);     // Custom request logging

/**
 * ROUTE MOUNTING
 * 
 * Pattern: /api/[resource]
 * 
 * RESTful conventions:
 * - Use nouns, not verbs (products, not getProducts)
 * - Use plural names (products, not product)
 * - Use HTTP methods for actions (GET, POST, PUT, DELETE)
 */
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Purpose: Monitoring and load balancer health checks
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 404 HANDLER
 * 
 * Catches requests to undefined routes
 * Must be after all route definitions
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * ERROR HANDLING MIDDLEWARE
 * 
 * MUST be registered last
 * Catches all errors from routes and middleware
 */
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;