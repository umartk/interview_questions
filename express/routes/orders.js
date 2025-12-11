const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Mock data
let orders = [
  {
    id: 1,
    userId: 1,
    items: [
      { productId: 1, quantity: 2, price: 999.99 }
    ],
    total: 1999.98,
    status: 'pending',
    createdAt: new Date()
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *         total:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { userId, items } = req.body;
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const newOrder = {
    id: orders.length + 1,
    userId,
    items,
    total: parseFloat(total.toFixed(2)),
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(newOrder);

  res.status(201).json({
    success: true,
    data: newOrder
  });
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', async (req, res) => {
  res.json({
    success: true,
    data: orders
  });
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = orders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:id/status', [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (orderIndex === -1) {
    throw new AppError('Order not found', 404);
  }

  orders[orderIndex].status = req.body.status;
  orders[orderIndex].updatedAt = new Date();

  res.json({
    success: true,
    data: orders[orderIndex]
  });
});

module.exports = router;