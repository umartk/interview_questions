/**
 * =============================================================================
 * PRODUCTS API ROUTES - RESTful CRUD Operations
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates production-ready REST API patterns including:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Input validation with express-validator
 * - Swagger/OpenAPI documentation
 * - Pagination, filtering, and sorting
 * - Proper error handling
 * 
 * REST CONVENTIONS:
 * - GET /products - List all (with pagination)
 * - GET /products/:id - Get single resource
 * - POST /products - Create new resource
 * - PUT /products/:id - Update entire resource
 * - PATCH /products/:id - Partial update
 * - DELETE /products/:id - Remove resource
 * 
 * INTERVIEW TOPICS:
 * - RESTful API design principles
 * - HTTP methods and status codes
 * - Input validation strategies
 * - API documentation best practices
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * MOCK DATABASE
 * 
 * In production, this would be MongoDB, PostgreSQL, etc.
 * Using array for demonstration purposes
 */
let products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Phone', price: 699.99, category: 'Electronics', stock: 100 },
  { id: 3, name: 'Book', price: 19.99, category: 'Books', stock: 200 }
];

/**
 * =============================================================================
 * SWAGGER SCHEMA DEFINITIONS
 * =============================================================================
 * 
 * These JSDoc comments are parsed by swagger-jsdoc to generate
 * OpenAPI documentation automatically.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Product name
 *         price:
 *           type: number
 *           description: Product price
 *         category:
 *           type: string
 *           description: Product category
 *         stock:
 *           type: integer
 *           description: Stock quantity
 */


/**
 * =============================================================================
 * GET /api/products - List Products with Pagination & Filtering
 * =============================================================================
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - category: Filter by category
 * 
 * Response includes pagination metadata for client-side navigation
 * 
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of products with pagination
 */
router.get('/', [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString()
], async (req, res) => {
  /**
   * VALIDATION CHECK
   * 
   * validationResult() collects all validation errors
   * If errors exist, throw AppError with details
   */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  // Parse query parameters with defaults
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const category = req.query.category;

  // Apply category filter if provided
  let filteredProducts = products;
  if (category) {
    filteredProducts = products.filter(p => 
      p.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  /**
   * PAGINATION LOGIC
   * 
   * Calculate start and end indices for slicing
   * This is "offset pagination" - simple but has performance issues
   * for large datasets. Consider "cursor pagination" for production.
   */
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  /**
   * RESPONSE FORMAT
   * 
   * Include pagination metadata for client navigation
   * - page: Current page number
   * - limit: Items per page
   * - total: Total items matching filter
   * - pages: Total number of pages
   */
  res.json({
    success: true,
    data: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

/**
 * =============================================================================
 * GET /api/products/:id - Get Single Product
 * =============================================================================
 * 
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({ success: true, data: product });
});

/**
 * =============================================================================
 * POST /api/products - Create New Product
 * =============================================================================
 * 
 * Request Body Validation:
 * - name: Required, non-empty string
 * - price: Required, positive number
 * - category: Required, non-empty string
 * - stock: Optional, non-negative integer
 * 
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { name, price, category, stock = 0 } = req.body;
  
  const newProduct = {
    id: products.length + 1,
    name,
    price,
    category,
    stock
  };

  products.push(newProduct);

  // Return 201 Created with the new resource
  res.status(201).json({ success: true, data: newProduct });
});

/**
 * =============================================================================
 * PUT /api/products/:id - Update Product
 * =============================================================================
 * 
 * PUT replaces the entire resource
 * Use PATCH for partial updates
 */
router.put('/:id', [
  param('id').isInt({ min: 1 }),
  body('name').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().notEmpty(),
  body('stock').optional().isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (productIndex === -1) {
    throw new AppError('Product not found', 404);
  }

  // Merge existing product with updates
  products[productIndex] = { ...products[productIndex], ...req.body };

  res.json({ success: true, data: products[productIndex] });
});

/**
 * =============================================================================
 * DELETE /api/products/:id - Delete Product
 * =============================================================================
 * 
 * Returns 200 with success message (some prefer 204 No Content)
 */
router.delete('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Invalid product ID', 400);
  }

  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (productIndex === -1) {
    throw new AppError('Product not found', 404);
  }

  products.splice(productIndex, 1);

  res.json({ success: true, message: 'Product deleted successfully' });
});

module.exports = router;