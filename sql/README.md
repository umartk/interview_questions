# SQL Advanced Database Operations

## 🎯 Purpose
This project demonstrates advanced SQL concepts for PostgreSQL, including complex queries, stored procedures, window functions, and database design patterns essential for senior developer interviews.

## 📁 Project Structure

```
sql/
├── schema.sql              # Complete database schema with indexes
├── advanced-queries.sql    # Complex analytical queries
└── stored-procedures.sql   # Business logic in SQL
```

## 🔑 Key Concepts Covered

### 1. Schema Design (schema.sql)
- **Normalization**: Proper table relationships
- **Indexes**: Performance optimization
- **Constraints**: Data integrity (FK, CHECK, UNIQUE)
- **JSON columns**: Flexible data storage

### 2. Advanced Queries (advanced-queries.sql)
- **Window Functions**: ROW_NUMBER, LAG, LEAD, SUM OVER
- **CTEs**: Common Table Expressions for readability
- **Recursive CTEs**: Hierarchical data (categories)
- **Aggregations**: GROUP BY, HAVING, ROLLUP

### 3. Stored Procedures (stored-procedures.sql)
- **Order Processing**: Transaction with inventory management
- **Recommendations**: Product recommendation engine
- **Dynamic Pricing**: Price calculation based on factors
- **Inventory Management**: Reorder point calculations

## 📊 Query Examples

### Window Functions - Customer Analysis
```sql
SELECT 
  customer_name,
  order_total,
  SUM(order_total) OVER (PARTITION BY customer_id ORDER BY order_date) as running_total,
  LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_order
FROM orders;
```

### Recursive CTE - Category Hierarchy
```sql
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 as level
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, ct.level + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;
```

### Cohort Analysis
```sql
WITH cohorts AS (
  SELECT user_id, DATE_TRUNC('month', first_order) as cohort
  FROM users
)
SELECT cohort, period, COUNT(DISTINCT user_id) as retained
FROM cohorts
GROUP BY cohort, period;
```

## 🎤 Common Interview Questions

1. **What's the difference between WHERE and HAVING?**
   - WHERE: Filters rows before grouping
   - HAVING: Filters groups after aggregation
   - HAVING can use aggregate functions

2. **Explain different types of JOINs**
   - INNER: Only matching rows
   - LEFT: All from left + matching from right
   - RIGHT: All from right + matching from left
   - FULL: All rows from both tables
   - CROSS: Cartesian product

3. **What are window functions?**
   - Perform calculations across related rows
   - Don't collapse rows like GROUP BY
   - OVER clause defines the window
   - Examples: ROW_NUMBER, RANK, LAG, LEAD

4. **How do you optimize slow queries?**
   - Use EXPLAIN ANALYZE to see query plan
   - Add appropriate indexes
   - Avoid SELECT * (specify columns)
   - Use JOINs instead of subqueries when possible
   - Consider query restructuring

5. **What's the difference between DELETE and TRUNCATE?**
   - DELETE: Row-by-row, can use WHERE, logged
   - TRUNCATE: Drops all rows, faster, minimal logging
   - TRUNCATE resets auto-increment

6. **Explain ACID properties**
   - Atomicity: All or nothing
   - Consistency: Valid state to valid state
   - Isolation: Concurrent transactions don't interfere
   - Durability: Committed data persists

7. **What are indexes and when to use them?**
   - Data structures for faster lookups
   - Use on: WHERE columns, JOIN columns, ORDER BY
   - Avoid on: Small tables, frequently updated columns
   - Types: B-tree, Hash, GIN, GiST

## 🚀 Running the SQL Files

```bash
# Connect to PostgreSQL
psql -U postgres -d your_database

# Run schema
\i schema.sql

# Run queries
\i advanced-queries.sql

# Create stored procedures
\i stored-procedures.sql
```

## 📈 Performance Tips

1. **Use EXPLAIN ANALYZE** to understand query execution
2. **Create indexes** on frequently queried columns
3. **Avoid N+1 queries** - use JOINs or batch queries
4. **Use connection pooling** in applications
5. **Partition large tables** for better performance
6. **Regular VACUUM and ANALYZE** for statistics
