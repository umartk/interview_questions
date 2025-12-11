/**
 * =============================================================================
 * AUTHENTICATION ROUTES
 * =============================================================================
 * 
 * PURPOSE:
 * Handles user authentication including:
 * - User registration
 * - User login
 * - Token refresh
 * 
 * AUTHENTICATION FLOW:
 * 
 * 1. REGISTRATION:
 *    Client -> POST /register -> Server creates user -> Returns tokens
 * 
 * 2. LOGIN:
 *    Client -> POST /login -> Server validates credentials -> Returns tokens
 * 
 * 3. TOKEN REFRESH:
 *    Client -> POST /refresh (with refresh token) -> Server returns new tokens
 * 
 * 4. AUTHENTICATED REQUEST:
 *    Client -> Request with Bearer token -> Server validates -> Returns data
 * 
 * INTERVIEW TOPICS:
 * - Password hashing (bcrypt)
 * - Token-based authentication
 * - Refresh token rotation
 * - Security best practices
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * MOCK USER DATABASE
 * 
 * In a real application, this would be a database (MongoDB, PostgreSQL)
 * 
 * The password is pre-hashed for the demo user:
 * - Plain text: "password"
 * - Hashed with bcrypt (10 rounds)
 * 
 * NEVER store plain text passwords!
 */
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    // This is bcrypt hash of "password"
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'admin'
  }
];

/**
 * REGISTER NEW USER
 * 
 * POST /api/auth/register
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword",
 *   "role": "user" (optional, defaults to "user")
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, email, role },
 *     "accessToken": "...",
 *     "refreshToken": "..."
 *   }
 * }
 * 
 * Security Considerations:
 * - Validate email format
 * - Enforce password complexity
 * - Hash password before storing
 * - Check for existing users
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role = 'user' } = req.body;

    /**
     * INPUT VALIDATION
     * 
     * In production, use a validation library like:
     * - Joi
     * - express-validator
     * - Yup
     * 
     * Validate:
     * - Email format
     * - Password length and complexity
     * - Required fields
     */
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    /**
     * CHECK FOR EXISTING USER
     * 
     * Prevent duplicate registrations
     * Return 409 Conflict for duplicate resources
     */
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    /**
     * HASH PASSWORD WITH BCRYPT
     * 
     * bcrypt.hash(password, saltRounds)
     * 
     * Salt Rounds (12 recommended):
     * - Higher = more secure but slower
     * - 10-12 is good balance for most applications
     * - Each increment doubles the time
     * 
     * Why bcrypt?
     * - Automatically handles salt generation
     * - Designed to be slow (prevents brute force)
     * - Widely tested and trusted
     * 
     * Alternatives:
     * - Argon2 (newer, winner of Password Hashing Competition)
     * - scrypt (memory-hard, good for preventing GPU attacks)
     */
    const hashedPassword = await bcrypt.hash(password, 12);

    /**
     * CREATE NEW USER
     * 
     * In production:
     * - Use database transaction
     * - Generate UUID for ID
     * - Add timestamps (createdAt, updatedAt)
     * - Send verification email
     */
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      role
    };
    users.push(newUser);

    /**
     * GENERATE AUTHENTICATION TOKENS
     * 
     * Include minimal user info in token payload:
     * - id: For database lookups
     * - email: For display/logging
     * - role: For authorization checks
     * 
     * DON'T include:
     * - Password (even hashed)
     * - Sensitive personal data
     * - Large objects (increases token size)
     */
    const tokens = generateTokens({ 
      id: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    });

    // Log successful registration
    logger.info(`New user registered: ${email}`);

    /**
     * RETURN SUCCESS RESPONSE
     * 
     * Status 201: Resource created successfully
     * 
     * Return:
     * - User data (without password)
     * - Access token
     * - Refresh token
     */
    res.status(201).json({
      success: true,
      data: {
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        ...tokens
      }
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
});

/**
 * USER LOGIN
 * 
 * POST /api/auth/login
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, email, role },
 *     "accessToken": "...",
 *     "refreshToken": "..."
 *   }
 * }
 * 
 * Security Considerations:
 * - Use generic error messages (don't reveal if email exists)
 * - Implement rate limiting on login attempts
 * - Log failed attempts for security monitoring
 * - Consider account lockout after X failures
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    /**
     * FIND USER BY EMAIL
     * 
     * In production with database:
     * const user = await User.findOne({ email });
     */
    const user = users.find(u => u.email === email);
    if (!user) {
      /**
       * SECURITY: Generic error message
       * 
       * Don't say "User not found" - this reveals that the email
       * doesn't exist, which helps attackers enumerate valid emails
       */
      throw new AppError('Invalid credentials', 401);
    }

    /**
     * VERIFY PASSWORD WITH BCRYPT
     * 
     * bcrypt.compare(plainPassword, hashedPassword)
     * 
     * How it works:
     * 1. Extracts salt from stored hash
     * 2. Hashes the provided password with same salt
     * 3. Compares the two hashes
     * 
     * Returns true if passwords match, false otherwise
     */
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Same generic message for security
      throw new AppError('Invalid credentials', 401);
    }

    // Generate new tokens for the session
    const tokens = generateTokens({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Log successful login
    logger.info(`User logged in: ${email}`);

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * REFRESH ACCESS TOKEN
 * 
 * POST /api/auth/refresh
 * 
 * Request Body:
 * {
 *   "refreshToken": "..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "...",
 *     "refreshToken": "..."
 *   }
 * }
 * 
 * Purpose:
 * - Access tokens expire quickly (15 min) for security
 * - Refresh tokens allow getting new access tokens without re-login
 * - Better UX: users stay logged in longer
 * 
 * Security Best Practices:
 * - Rotate refresh tokens (issue new one each time)
 * - Store refresh tokens in database for revocation
 * - Detect refresh token reuse (potential theft)
 * - Use httpOnly cookies for refresh tokens
 */
router.post('/refresh', (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    /**
     * VERIFY REFRESH TOKEN
     * 
     * Checks:
     * - Valid signature
     * - Not expired
     * - Not tampered with
     */
    const decoded = verifyRefreshToken(refreshToken);
    
    /**
     * GENERATE NEW TOKEN PAIR
     * 
     * Refresh Token Rotation:
     * - Issue new refresh token each time
     * - Old refresh token becomes invalid
     * - Helps detect token theft
     */
    const tokens = generateTokens({ 
      id: decoded.id, 
      email: decoded.email, 
      role: decoded.role 
    });

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    // Invalid refresh token
    next(new AppError('Invalid refresh token', 401));
  }
});

module.exports = router;