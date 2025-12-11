# MongoDB Advanced Operations

## 🎯 Purpose
This project demonstrates advanced MongoDB concepts using Mongoose ODM, including complex aggregation pipelines, schema design, indexing strategies, and real-world data modeling patterns.

## 📁 Project Structure

```
mongodb/
├── index.js               # Main entry point with example operations
├── package.json           # Dependencies
├── models/
│   ├── User.js           # User schema with virtuals & methods
│   ├── Product.js        # Product schema with reviews & inventory
│   └── Order.js          # Order schema with status workflow
└── services/
    ├── UserService.js    # User business logic & aggregations
    ├── ProductService.js # Product operations & search
    ├── OrderService.js   # Order processing & analytics
    └── AnalyticsService.js # Complex analytics aggregations
```

## 🔑 Key Concepts Covered

### 1. Schema Design Patterns
- **Embedding vs Referencing**: When to embed documents vs use references
- **Virtuals**: Computed properties that don't persist to database
- **Middleware (Hooks)**: Pre/post save operations
- **Static & Instance Methods**: Reusable query logic

### 2. Aggregation Pipeline
- **$match**: Filter documents
- **$group**: Group and aggregate data
- **$lookup**: Join collections (like SQL JOIN)
- **$project**: Shape output documents
- **$facet**: Multiple aggregations in one query

### 3. Indexing Strategies
- **Single field indexes**: Basic query optimization
- **Compound indexes**: Multi-field queries
- **Text indexes**: Full-text search
- **Partial indexes**: Index subset of documents

### 4. Performance Optimization
- **Query optimization**: Using explain()
- **Index selection**: Choosing right indexes
- **Pagination**: Cursor vs skip/limit

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set MongoDB URI (optional, defaults to localhost)
export MONGODB_URI=mongodb://localhost:27017/ecommerce

# Run examples
npm start

# Seed sample data
npm run seed
```

## 📊 Example Aggregations

### Customer Lifetime Value
```javascript
// Groups orders by user, calculates total spent, segments customers
await User.aggregate([
  { $lookup: { from: 'orders', ... } },
  { $group: { _id: '$_id', totalSpent: { $sum: '$orders.total' } } },
  { $addFields: { segment: { $switch: { ... } } } }
]);
```

### Revenue by Category
```javascript
// Joins orders with products, groups by category
await Order.aggregate([
  { $unwind: '$items' },
  { $lookup: { from: 'products', ... } },
  { $group: { _id: '$product.category', revenue: { $sum: ... } } }
]);
```

## 🎤 Common Interview Questions

1. **When to embed vs reference documents?**
   - Embed: Data accessed together, 1:few relationship
   - Reference: Large documents, many:many, frequently updated

2. **How do you optimize slow MongoDB queries?**
   - Use explain() to analyze query plan
   - Create appropriate indexes
   - Use projection to limit fields
   - Consider denormalization

3. **What's the aggregation pipeline?**
   - Series of stages that transform documents
   - Each stage passes output to next stage
   - More powerful than find() for complex queries

4. **How do you handle transactions in MongoDB?**
   - Multi-document transactions (MongoDB 4.0+)
   - Use sessions for transaction scope
   - ACID compliance for replica sets

5. **Explain sharding in MongoDB**
   - Horizontal scaling across multiple servers
   - Shard key determines data distribution
   - Config servers store metadata
