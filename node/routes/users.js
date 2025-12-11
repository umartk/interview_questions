/**
 * =============================================================================
 * USER MANAGEMENT ROUTES (Protected)
 * =============================================================================
 * 
 * PURPOSE:
 * Handles user-related operations that require authentication:
 * - Get all users (admin only)
 * - Get current user profile
 * - Update current user profile
 * 
 * AUTHORIZATION:
 * All routes require valid JWT token (handled by authenticateToken middleware)
 * Some routes require specific roles (admin)
 * 
 * INTERVIEW TOPICS:
 * - Role-based access control (RBAC)
 * - Authorization vs Authentication
 * - RESTful API design
 */

const express = require('express');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock users data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
];

/**
 * GET ALL USERS (Admin Only)
 * GET /api/users
 * 
 * Authorization: Requires admin role
 * req.user is populated by authenticateToken middleware
 */
router.get('/', (req, res, next) => {
  try {
    // Role-based authorization check
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied. Admin role required.', 403);
    }
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

/**
 * GET CURRENT USER PROFILE
 * GET /api/users/profile
 * Uses req.user.id from JWT token to find user
 */
router.get('/profile', (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  res.json({ success: true, data: user });
});

/**
 * UPDATE CURRENT USER PROFILE
 * PUT /api/users/profile
 * Only allows updating own profile
 */
router.put('/profile', (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      throw new AppError('User not found', 404);
    }
    users[userIndex] = { ...users[userIndex], name, email };
    res.json({ success: true, data: users[userIndex] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;