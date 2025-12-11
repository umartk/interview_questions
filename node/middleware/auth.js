/**
 * =============================================================================
 * JWT AUTHENTICATION MIDDLEWARE
 * =============================================================================
 * 
 * PURPOSE:
 * Implements JSON Web Token (JWT) based authentication with:
 * - Access tokens (short-lived, for API access)
 * - Refresh tokens (long-lived, for getting new access tokens)
 * 
 * WHY JWT?
 * - Stateless: No server-side session storage needed
 * - Scalable: Works across multiple servers without shared state
 * - Self-contained: Token contains user info (claims)
 * - Secure: Cryptographically signed to prevent tampering
 * 
 * JWT STRUCTURE:
 * header.payload.signature
 * 
 * Example:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  <- Header (algorithm, type)
 * eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.  <- Payload (claims)
 * SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  <- Signature
 * 
 * INTERVIEW TOPICS:
 * - JWT vs Session-based authentication
 * - Token storage (localStorage vs httpOnly cookies)
 * - Refresh token rotation
 * - Token revocation strategies
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT SECRET KEY
 * 
 * CRITICAL SECURITY NOTE:
 * - NEVER hardcode secrets in production
 * - Use environment variables
 * - Use strong, random secrets (256+ bits)
 * - Rotate secrets periodically
 * 
 * Interview Tip: Discuss secret management (AWS Secrets Manager, HashiCorp Vault)
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * AUTHENTICATE TOKEN MIDDLEWARE
 * 
 * Purpose: Verifies JWT token and attaches user info to request
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token signature and expiration
 * 3. Attach decoded user info to req.user
 * 4. Call next() to proceed to route handler
 * 
 * Authorization Header Format:
 * Authorization: Bearer <token>
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  // Extract Authorization header
  const authHeader = req.headers['authorization'];
  
  // Extract token from "Bearer <token>" format
  // The ?. (optional chaining) prevents errors if authHeader is undefined
  const token = authHeader && authHeader.split(' ')[1];

  // No token provided - return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  /**
   * VERIFY TOKEN
   * 
   * jwt.verify() does the following:
   * 1. Decodes the token
   * 2. Verifies the signature using the secret
   * 3. Checks if token is expired (exp claim)
   * 
   * If verification fails, callback receives an error
   */
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Log failed authentication attempts for security monitoring
      logger.warn(`Invalid token attempt from ${req.ip}`);
      
      // Return 403 Forbidden for invalid/expired tokens
      // Note: Some prefer 401 for expired tokens
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Attach decoded user info to request object
    // This makes user data available to route handlers
    req.user = user;
    
    // Proceed to next middleware/route handler
    next();
  });
};

/**
 * GENERATE ACCESS AND REFRESH TOKENS
 * 
 * Purpose: Creates a pair of tokens for authentication
 * 
 * Token Strategy:
 * - Access Token: Short-lived (15 minutes)
 *   - Used for API requests
 *   - Stored in memory (frontend)
 *   - If stolen, limited damage window
 * 
 * - Refresh Token: Long-lived (7 days)
 *   - Used only to get new access tokens
 *   - Stored in httpOnly cookie (more secure)
 *   - Can be revoked server-side
 * 
 * @param {Object} payload - User data to encode in token
 * @returns {Object} Object containing accessToken and refreshToken
 * 
 * Interview Tip: Discuss token rotation and refresh token reuse detection
 */
const generateTokens = (payload) => {
  // Access token - short expiration for security
  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '15m' }  // Expires in 15 minutes
  );
  
  // Refresh token - longer expiration for convenience
  const refreshToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '7d' }   // Expires in 7 days
  );
  
  return { accessToken, refreshToken };
};

/**
 * VERIFY REFRESH TOKEN
 * 
 * Purpose: Validates a refresh token for token refresh flow
 * 
 * Flow:
 * 1. Client's access token expires
 * 2. Client sends refresh token to /auth/refresh
 * 3. Server verifies refresh token
 * 4. Server issues new access token (and optionally new refresh token)
 * 
 * Security Considerations:
 * - Store refresh tokens in database for revocation capability
 * - Implement refresh token rotation (new refresh token each use)
 * - Detect refresh token reuse (potential theft indicator)
 * 
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * =============================================================================
 * COMMON INTERVIEW QUESTIONS ABOUT JWT
 * =============================================================================
 * 
 * Q: How do you handle token revocation with JWT?
 * A: Options include:
 *    1. Short expiration times (minimize damage window)
 *    2. Token blacklist in Redis (check on each request)
 *    3. Token versioning (increment version on logout)
 *    4. Refresh token rotation with family tracking
 * 
 * Q: Where should tokens be stored on the client?
 * A: 
 *    - Access Token: Memory (JavaScript variable) - safest from XSS
 *    - Refresh Token: httpOnly cookie - safe from XSS, vulnerable to CSRF
 *    - localStorage: Convenient but vulnerable to XSS attacks
 * 
 * Q: What's the difference between authentication and authorization?
 * A:
 *    - Authentication: Verifying WHO the user is (login)
 *    - Authorization: Verifying WHAT the user can do (permissions)
 * 
 * Q: How do you handle JWT in a microservices architecture?
 * A:
 *    - API Gateway validates tokens
 *    - Services trust the gateway
 *    - Or: Each service validates (more secure, more overhead)
 *    - Consider using asymmetric keys (RS256) for distributed validation
 */

module.exports = {
  authenticateToken,
  generateTokens,
  verifyRefreshToken
};