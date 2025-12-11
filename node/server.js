/**
 * =============================================================================
 * MAIN EXPRESS SERVER - Advanced Node.js Concepts
 * =============================================================================
 * 
 * PURPOSE:
 * This file demonstrates production-ready Express server setup with:
 * - Security middleware (Helmet)
 * - Rate limiting for DDoS protection
 * - Structured logging
 * - Graceful shutdown handling
 * - Health check endpoints
 * 
 * INTERVIEW TOPICS:
 * - Middleware execution order
 * - Security best practices
 * - Process signal handling
 * - Memory management
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('rate-limiter-flexible');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * SECURITY MIDDLEWARE - Helmet
 * 
 * Purpose: Sets various HTTP headers to protect against common vulnerabilities
 * 
 * What it does:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables browser XSS filtering
 * - Content-Security-Policy: Controls resource loading
 * 
 * Interview Tip: Always explain WHY security headers matter, not just WHAT they do
 */
app.use(helmet());

/**
 * RATE LIMITING
 * 
 * Purpose: Prevents abuse by limiting requests per IP address
 * 
 * Configuration:
 * - points: Maximum number of requests allowed
 * - duration: Time window in seconds
 * 
 * Strategies (Interview Topic):
 * 1. Fixed Window - Simple but can allow burst at window boundaries
 * 2. Sliding Window - More accurate but more memory intensive
 * 3. Token Bucket - Allows controlled bursts
 * 4. Leaky Bucket - Smooths out traffic
 * 
 * This implementation uses in-memory storage. For production with multiple
 * servers, use Redis as the backing store for distributed rate limiting.
 */
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip,  // Use IP address as the key
  points: 100,                     // Allow 100 requests
  duration: 60,                    // Per 60 seconds (1 minute)
});

/**
 * Rate Limiting Middleware
 * 
 * Purpose: Applies rate limiting to all incoming requests
 * 
 * How it works:
 * 1. Consumes a "point" for each request from the IP's allowance
 * 2. If points exhausted, returns 429 Too Many Requests
 * 3. Points regenerate over time based on duration setting
 */
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    // Rate limit exceeded - return 429 status
    res.status(429).json({ error: 'Too many requests' });
  }
});

/**
 * BODY PARSING MIDDLEWARE
 * 
 * Purpose: Parses incoming request bodies
 * 
 * express.json(): Parses JSON payloads
 * - limit: '10mb' prevents large payload attacks (DoS protection)
 * 
 * express.urlencoded(): Parses URL-encoded form data
 * - extended: true allows nested objects
 * 
 * Interview Tip: Explain the security implications of not setting limits
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * REQUEST LOGGING MIDDLEWARE
 * 
 * Purpose: Logs all incoming requests for monitoring and debugging
 * 
 * Best Practices:
 * - Log request method, path, and IP
 * - Don't log sensitive data (passwords, tokens)
 * - Use structured logging (JSON format) for log aggregation
 * - Include correlation IDs for request tracing
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

/**
 * ROUTE MOUNTING
 * 
 * Purpose: Organizes routes into logical groups
 * 
 * Pattern: /api/[resource]
 * - /api/auth - Public authentication routes
 * - /api/users - Protected user routes (requires authentication)
 * 
 * The authenticateToken middleware is applied to all /api/users routes,
 * ensuring only authenticated users can access them.
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Purpose: Provides server health status for monitoring and load balancers
 * 
 * Returns:
 * - status: Current server status
 * - timestamp: Current time (useful for clock sync verification)
 * - uptime: How long the server has been running
 * - memory: Current memory usage (helps detect memory leaks)
 * 
 * Interview Tip: Discuss what makes a good health check:
 * - Should be lightweight
 * - Can include dependency checks (DB, cache)
 * - Used by Kubernetes liveness/readiness probes
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * ERROR HANDLING MIDDLEWARE
 * 
 * Purpose: Catches all errors and returns consistent error responses
 * 
 * IMPORTANT: Must be registered AFTER all routes
 * 
 * Express identifies error-handling middleware by its 4 parameters:
 * (err, req, res, next)
 */
app.use(errorHandler);

/**
 * GRACEFUL SHUTDOWN HANDLERS
 * 
 * Purpose: Properly closes connections when the server is terminated
 * 
 * Signals:
 * - SIGTERM: Sent by process managers (PM2, Kubernetes) for graceful shutdown
 * - SIGINT: Sent when pressing Ctrl+C in terminal
 * 
 * Best Practices for Graceful Shutdown:
 * 1. Stop accepting new connections
 * 2. Wait for existing requests to complete (with timeout)
 * 3. Close database connections
 * 4. Close cache connections
 * 5. Flush logs
 * 6. Exit process
 * 
 * Interview Tip: Explain why graceful shutdown matters:
 * - Prevents data corruption
 * - Ensures in-flight requests complete
 * - Allows load balancers to redirect traffic
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // In production, you would:
  // 1. server.close() to stop accepting new connections
  // 2. Close database connections
  // 3. Wait for pending requests with a timeout
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

/**
 * START SERVER
 * 
 * Purpose: Binds the server to a port and starts listening for connections
 * 
 * The callback confirms the server started successfully.
 * In production, you might also:
 * - Connect to databases before listening
 * - Warm up caches
 * - Register with service discovery
 */
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Export app for testing purposes
module.exports = app;