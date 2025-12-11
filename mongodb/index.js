/**
 * =============================================================================
 * MONGODB ADVANCED OPERATIONS - Main Entry Point
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates advanced MongoDB operations including:
 * - Connection management
 * - Service layer architecture
 * - Complex aggregation pipelines
 * - Real-world business logic
 * 
 * ARCHITECTURE:
 * 
 *   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 *   │   Routes    │ --> │  Services   │ --> │   Models    │
 *   │  (Express)  │     │  (Business  │     │  (Mongoose) │
 *   └─────────────┘     │   Logic)    │     └─────────────┘
 *                       └─────────────┘            │
 *                                                  ▼
 *                                           ┌─────────────┐
 *                                           │   MongoDB   │
 *                                           └─────────────┘
 * 
 * INTERVIEW TOPICS:
 * - Service layer pattern
 * - Dependency injection
 * - Connection pooling
 * - Error handling in async operations
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UserService = require('./services/UserService');
const ProductService = require('./services/ProductService');
const OrderService = require('./services/OrderService');
const AnalyticsService = require('./services/AnalyticsService');

/**
 * MONGODB CONNECTION URI
 * 
 * Format: mongodb://[username:password@]host[:port]/database[?options]
 * 
 * Production considerations:
 * - Use replica set for high availability
 * - Enable SSL/TLS for encryption
 * - Use connection pooling (default: 100 connections)
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

/**
 * MAIN FUNCTION
 * 
 * Demonstrates various MongoDB operations using the service layer
 */
async function main() {
  try {
    /**
     * CONNECT TO MONGODB
     * 
     * mongoose.connect() options (Mongoose 6+):
     * - Most options are now set by default
     * - Connection pooling is automatic
     * - Buffering commands until connected
     */
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    /**

     * INITIALIZE SERVICES
     * 
     * Service Layer Pattern:
     * - Encapsulates business logic
     * - Separates concerns from routes/controllers
     * - Makes code testable and reusable
     * - Can be injected with dependencies
     */
    const userService = new UserService();
    const productService = new ProductService();
    const orderService = new OrderService();
    const analyticsService = new AnalyticsService();

    // =========================================================================
    // USER OPERATIONS DEMO
    // =========================================================================
    console.log('\n=== User Operations ===');
    
    /**
     * CREATE USER
     * Demonstrates basic CRUD operation with Mongoose
     */
    const user1 = await userService.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      preferences: ['electronics', 'books']
    });
    console.log('Created user:', user1.name);

    /**
     * USER STATISTICS AGGREGATION
     * Demonstrates $group, $sum, $avg operators
     */
    const userStats = await userService.getUserStats();
    console.log('User statistics:', userStats);

    // =========================================================================
    // PRODUCT OPERATIONS DEMO
    // =========================================================================
    console.log('\n=== Product Operations ===');
    
    /**
     * CREATE PRODUCT WITH NESTED DATA
     * Demonstrates embedded documents (specifications)
     */
    const product1 = await productService.createProduct({
      name: 'MacBook Pro',
      price: 2499.99,
      category: 'Electronics',
      tags: ['laptop', 'apple', 'premium'],
      specifications: {
        processor: 'M2 Pro',
        memory: '16GB',
        storage: '512GB SSD'
      }
    });
    console.log('Created product:', product1.name);

    /**
     * ADVANCED PRODUCT SEARCH
     * Demonstrates text search with filters
     */
    const searchResults = await productService.searchProducts('MacBook', {
      category: 'Electronics',
      minPrice: 1000,
      maxPrice: 3000
    });
    console.log('Search results:', searchResults.length);

    // =========================================================================
    // ORDER OPERATIONS DEMO
    // =========================================================================
    console.log('\n=== Order Operations ===');
    
    /**
     * CREATE ORDER
     * Demonstrates document references and calculated fields
     */
    const order = await orderService.createOrder({
      userId: user1._id,
      items: [{
        productId: product1._id,
        quantity: 1,
        price: product1.price
      }]
    });
    console.log('Created order:', order._id);

    /**
     * ORDER ANALYTICS
     * Demonstrates complex aggregation with $facet
     */
    const orderAnalytics = await analyticsService.getOrderAnalytics();
    console.log('Order analytics:', orderAnalytics);

    // =========================================================================
    // ADVANCED AGGREGATIONS DEMO
    // =========================================================================
    console.log('\n=== Advanced Aggregations ===');
    
    /**
     * REVENUE BY CATEGORY
     * Demonstrates $lookup (JOIN), $unwind, $group
     */
    const revenueByCategory = await analyticsService.getRevenueByCategory();
    console.log('Revenue by category:', revenueByCategory);

    /**
     * USER BEHAVIOR ANALYSIS
     * Demonstrates customer segmentation with $switch
     */
    const userBehavior = await analyticsService.getUserBehaviorAnalysis();
    console.log('User behavior analysis:', userBehavior);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    /**
     * DISCONNECT FROM MONGODB
     * 
     * Always close connections when done:
     * - Releases connection pool resources
     * - Prevents memory leaks
     * - Required for scripts to exit properly
     */
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the main function
main();