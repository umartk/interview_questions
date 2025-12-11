/**
 * =============================================================================
 * CENTRALIZED ERROR HANDLING
 * =============================================================================
 * 
 * PURPOSE:
 * Provides consistent error handling across the entire application with:
 * - Custom error classes for different error types
 * - Centralized error logging
 * - Consistent error response format
 * - Environment-aware error details
 * 
 * WHY CENTRALIZED ERROR HANDLING?
 * - Consistent error responses for API consumers
 * - Single place to modify error format
 * - Proper logging of all errors
 * - Separation of error handling from business logic
 * 
 * ERROR TYPES:
 * 1. Operational Errors: Expected errors (validation, not found, auth)
 * 2. Programmer Errors: Bugs (undefined variables, type errors)
 * 
 * INTERVIEW TOPICS:
 * - Error handling best practices
 * - Operational vs programmer errors
 * - Error logging strategies
 * - HTTP status codes
 */

const logger = require('../utils/logger');

/**
 * CUSTOM APPLICATION ERROR CLASS
 * 
 * Purpose: Creates structured errors with HTTP status codes
 * 
 * Why extend Error?
 * - Maintains stack trace for debugging
 * - Works with try/catch and error middleware
 * - Can add custom properties (statusCode, isOperational)
 * 
 * The isOperational flag distinguishes between:
 * - Operational errors: Expected, can be handled gracefully
 * - Programmer errors: Bugs that should crash the process
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode) {
    // Call parent Error constructor with message
    super(message);
    
    // HTTP status code for the response
    this.statusCode = statusCode;
    
    /**
     * isOperational Flag
     * 
     * true = Operational error (expected, handle gracefully)
     *   - Validation errors
     *   - Resource not found
     *   - Authentication failures
     * 
     * false = Programmer error (bug, may need to crash)
     *   - Undefined variable access
     *   - Type errors
     *   - Unhandled promise rejections
     */
    this.isOperational = true;

    /**
     * Capture Stack Trace
     * 
     * Error.captureStackTrace() creates a .stack property
     * The second argument excludes the constructor from the stack
     * This makes the stack trace cleaner and more useful
     */
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ERROR HANDLER MIDDLEWARE
 * 
 * Purpose: Catches all errors and sends appropriate responses
 * 
 * IMPORTANT: Express identifies error middleware by 4 parameters
 * (err, req, res, next) - all four must be present!
 * 
 * This middleware should be registered LAST, after all routes
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (required for signature)
 */
const errorHandler = (err, req, res, next) => {
  // Create a copy of error to avoid mutating the original
  let error = { ...err };
  error.message = err.message;

  // Log the error for debugging and monitoring
  // In production, this would go to a log aggregation service
  logger.error(err);

  /**
   * MONGOOSE ERROR HANDLING
   * 
   * Mongoose throws specific error types that we can handle gracefully
   * Converting them to AppError provides consistent responses
   */

  /**
   * CastError - Invalid MongoDB ObjectId
   * 
   * Occurs when: Invalid ID format passed to findById()
   * Example: GET /users/invalid-id
   * 
   * We convert this to a 404 because from the user's perspective,
   * an invalid ID means the resource doesn't exist
   */
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  /**
   * Duplicate Key Error (code 11000)
   * 
   * Occurs when: Trying to insert a duplicate value for a unique field
   * Example: Registering with an email that already exists
   * 
   * MongoDB error code 11000 indicates duplicate key violation
   */
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  /**
   * Validation Error
   * 
   * Occurs when: Mongoose schema validation fails
   * Example: Required field missing, invalid enum value
   * 
   * We extract all validation error messages and combine them
   */
  if (err.name === 'ValidationError') {
    // Extract messages from all validation errors
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  /**
   * SEND ERROR RESPONSE
   * 
   * Response format:
   * {
   *   success: false,
   *   error: "Error message",
   *   stack: "..." // Only in development
   * }
   * 
   * Security Note:
   * - Never expose stack traces in production
   * - Stack traces can reveal file paths and code structure
   * - Only include detailed errors in development
   */
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    // Only include stack trace in development environment
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * =============================================================================
 * HTTP STATUS CODES REFERENCE (Common Interview Topic)
 * =============================================================================
 * 
 * 2xx Success:
 * - 200 OK: Request succeeded
 * - 201 Created: Resource created successfully
 * - 204 No Content: Success but no response body
 * 
 * 4xx Client Errors:
 * - 400 Bad Request: Invalid request syntax/data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Authenticated but not authorized
 * - 404 Not Found: Resource doesn't exist
 * - 409 Conflict: Resource conflict (duplicate)
 * - 422 Unprocessable Entity: Validation failed
 * - 429 Too Many Requests: Rate limit exceeded
 * 
 * 5xx Server Errors:
 * - 500 Internal Server Error: Generic server error
 * - 502 Bad Gateway: Invalid response from upstream
 * - 503 Service Unavailable: Server temporarily unavailable
 * - 504 Gateway Timeout: Upstream server timeout
 * 
 * =============================================================================
 * ERROR HANDLING BEST PRACTICES
 * =============================================================================
 * 
 * 1. Use try/catch for async operations
 * 2. Always pass errors to next() in middleware
 * 3. Create custom error classes for different error types
 * 4. Log errors with context (user ID, request ID)
 * 5. Never expose sensitive information in error messages
 * 6. Use appropriate HTTP status codes
 * 7. Provide actionable error messages for clients
 * 8. Implement error monitoring (Sentry, DataDog)
 */

module.exports = {
  AppError,
  errorHandler
};