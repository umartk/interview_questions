/**
 * =============================================================================
 * WINSTON LOGGER CONFIGURATION
 * =============================================================================
 * 
 * PURPOSE:
 * Provides structured, configurable logging for the application using Winston,
 * the most popular Node.js logging library.
 * 
 * WHY STRUCTURED LOGGING?
 * - Consistent log format across the application
 * - Easy to parse and search in log aggregation tools
 * - Different log levels for different environments
 * - Multiple output destinations (console, files, external services)
 * 
 * LOG LEVELS (in order of severity):
 * - error: Critical errors that need immediate attention
 * - warn: Warning conditions that should be reviewed
 * - info: General informational messages
 * - http: HTTP request logging
 * - verbose: Detailed information for debugging
 * - debug: Debug-level messages
 * - silly: Most verbose level, rarely used
 * 
 * INTERVIEW TOPICS:
 * - Log levels and when to use each
 * - Log aggregation (ELK Stack, CloudWatch, DataDog)
 * - Structured vs unstructured logging
 * - Log rotation and retention
 */

const winston = require('winston');

/**
 * CREATE WINSTON LOGGER INSTANCE
 * 
 * winston.createLogger() creates a new logger with:
 * - level: Minimum level to log (logs this level and above)
 * - format: How to format log messages
 * - defaultMeta: Metadata added to every log entry
 * - transports: Where to send log messages
 */
const logger = winston.createLogger({
  /**
   * LOG LEVEL
   * 
   * 'info' means log info, warn, and error messages
   * In production, you might use 'warn' to reduce noise
   * In development, you might use 'debug' for more detail
   */
  level: 'info',
  
  /**
   * LOG FORMAT
   * 
   * winston.format.combine() chains multiple formatters:
   * 
   * 1. timestamp(): Adds timestamp to each log entry
   *    - Essential for debugging and log analysis
   *    - Use ISO 8601 format for consistency
   * 
   * 2. errors({ stack: true }): Includes stack traces for errors
   *    - Critical for debugging production issues
   *    - Stack traces show where errors originated
   * 
   * 3. json(): Outputs logs as JSON
   *    - Easy to parse by log aggregation tools
   *    - Structured data enables powerful queries
   */
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  
  /**
   * DEFAULT METADATA
   * 
   * Added to every log entry automatically
   * Useful for identifying the source of logs in microservices
   * 
   * Common metadata:
   * - service: Name of the service/application
   * - version: Application version
   * - environment: dev/staging/production
   * - hostname: Server hostname
   */
  defaultMeta: { service: 'node-app' },
  
  /**
   * TRANSPORTS
   * 
   * Transports define WHERE logs are sent
   * You can have multiple transports for different purposes
   * 
   * Common transports:
   * - Console: Development debugging
   * - File: Persistent storage
   * - HTTP: Send to log aggregation service
   * - Stream: Custom destinations
   */
  transports: [
    /**
     * ERROR LOG FILE
     * 
     * Stores only error-level logs
     * Useful for quickly finding critical issues
     * 
     * In production, you might:
     * - Set up log rotation (winston-daily-rotate-file)
     * - Send to external service (CloudWatch, Loggly)
     * - Set up alerts for error patterns
     */
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    
    /**
     * COMBINED LOG FILE
     * 
     * Stores all log levels
     * Useful for detailed debugging and audit trails
     * 
     * Consider:
     * - Log rotation to manage file size
     * - Retention policies (delete after X days)
     * - Compression for older logs
     */
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

/**
 * CONSOLE TRANSPORT FOR DEVELOPMENT
 * 
 * In development, we also log to console for immediate feedback
 * 
 * Why not in production?
 * - Console logging is slower than file logging
 * - Container logs capture stdout anyway
 * - Reduces noise in production environments
 * 
 * The simple format is more readable in console than JSON
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * =============================================================================
 * LOGGING BEST PRACTICES (Interview Topics)
 * =============================================================================
 * 
 * 1. USE APPROPRIATE LOG LEVELS:
 *    - error: Application errors, exceptions
 *    - warn: Deprecations, retry attempts, fallbacks
 *    - info: Application lifecycle, important events
 *    - debug: Detailed debugging information
 * 
 * 2. INCLUDE CONTEXT:
 *    - Request ID for tracing
 *    - User ID for user-specific issues
 *    - Timestamp for timeline analysis
 *    - Environment for filtering
 * 
 * 3. DON'T LOG SENSITIVE DATA:
 *    - Passwords
 *    - API keys
 *    - Personal information (PII)
 *    - Credit card numbers
 * 
 * 4. STRUCTURED LOGGING:
 *    - Use JSON format
 *    - Consistent field names
 *    - Enables powerful queries
 * 
 * 5. LOG AGGREGATION:
 *    - ELK Stack (Elasticsearch, Logstash, Kibana)
 *    - AWS CloudWatch
 *    - DataDog
 *    - Splunk
 * 
 * =============================================================================
 * EXAMPLE LOG ENTRIES
 * =============================================================================
 * 
 * // Info level - application events
 * logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
 * 
 * // Error level - with error object
 * logger.error('Database connection failed', { error: err, retryCount: 3 });
 * 
 * // Warn level - potential issues
 * logger.warn('API rate limit approaching', { currentUsage: 95, limit: 100 });
 * 
 * // Debug level - detailed debugging
 * logger.debug('Processing request', { body: req.body, headers: req.headers });
 * 
 * =============================================================================
 * COMMON INTERVIEW QUESTIONS
 * =============================================================================
 * 
 * Q: How do you handle logging in a microservices architecture?
 * A: 
 *    - Centralized log aggregation (ELK, CloudWatch)
 *    - Correlation IDs to trace requests across services
 *    - Consistent log format across all services
 *    - Service name in metadata
 * 
 * Q: How do you debug production issues without console.log?
 * A:
 *    - Structured logging with appropriate levels
 *    - Log aggregation with search capabilities
 *    - Distributed tracing (Jaeger, X-Ray)
 *    - APM tools (New Relic, DataDog)
 * 
 * Q: How do you handle log rotation?
 * A:
 *    - winston-daily-rotate-file package
 *    - OS-level logrotate
 *    - Cloud-native solutions (CloudWatch Logs)
 *    - Set retention policies
 */

module.exports = logger;