/**
 * =============================================================================
 * ADVANCED SQL QUERIES - E-commerce Analytics
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates complex SQL concepts essential for senior developer interviews:
 * - Window functions for running calculations
 * - CTEs (Common Table Expressions) for readability
 * - Recursive queries for hierarchical data
 * - Advanced aggregations and analytics
 * 
 * INTERVIEW TOPICS:
 * - Window functions vs GROUP BY
 * - CTE vs subqueries
 * - Query optimization techniques
 * - Analytical SQL patterns
 */

/**
 * =============================================================================
 * 1. WINDOW FUNCTIONS - Customer Lifetime Value Analysis
 * =============================================================================
 * 
 * WINDOW FUNCTIONS allow calculations across related rows without collapsing
 * them into groups (unlike GROUP BY).
 * 
 * Key window functions:
 * - ROW_NUMBER(): Sequential number for each row
 * - LAG(): Access previous row's value
 * - LEAD(): Access next row's value
 * - SUM() OVER: Running total
 * - AVG() OVER: Moving average
 * 
 * PARTITION BY: Divides rows into groups (like GROUP BY but keeps all rows)
 * ORDER BY: Defines the order within each partition
 */
WITH customer_orders AS (
    SELECT 
        u.id as user_id,
        u.first_name || ' ' || u.last_name as customer_name,
        u.email,
        o.id as order_id,
        o.total_amount,
        o.created_at,
        ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY o.created_at) as order_sequence,
        SUM(o.total_amount) OVER (PARTITION BY u.id ORDER BY o.created_at ROWS UNBOUNDED PRECEDING) as running_total,
        LAG(o.created_at) OVER (PARTITION BY u.id ORDER BY o.created_at) as previous_order_date,
        LEAD(o.created_at) OVER (PARTITION BY u.id ORDER BY o.created_at) as next_order_date
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE o.payment_status = 'paid'
),
customer_metrics AS (
    SELECT 
        user_id,
        customer_name,
        email,
        COUNT(*) as total_orders,
        SUM(total_amount) as lifetime_value,
        AVG(total_amount) as avg_order_value,
        MIN(created_at) as first_order_date,
        MAX(created_at) as last_order_date,
        AVG(EXTRACT(EPOCH FROM (next_order_date - created_at))/86400) as avg_days_between_orders
    FROM customer_orders
    GROUP BY user_id, customer_name, email
)
SELECT 
    customer_name,
    email,
    total_orders,
    ROUND(lifetime_value::numeric, 2) as lifetime_value,
    ROUND(avg_order_value::numeric, 2) as avg_order_value,
    ROUND(avg_days_between_orders::numeric, 1) as avg_days_between_orders,
    CASE 
        WHEN lifetime_value >= 1000 AND total_orders >= 5 THEN 'VIP'
        WHEN lifetime_value >= 500 AND total_orders >= 3 THEN 'Loyal'
        WHEN total_orders >= 2 THEN 'Regular'
        ELSE 'New'
    END as customer_segment,
    EXTRACT(DAYS FROM CURRENT_DATE - last_order_date) as days_since_last_order
FROM customer_metrics
ORDER BY lifetime_value DESC;

/**
 * =============================================================================
 * 2. RECURSIVE CTE - Category Hierarchy with Path
 * =============================================================================
 * 
 * RECURSIVE CTEs traverse hierarchical/tree data structures.
 * 
 * Structure:
 * WITH RECURSIVE cte_name AS (
 *   -- Base case: Starting point (root nodes)
 *   SELECT ... WHERE parent_id IS NULL
 *   
 *   UNION ALL
 *   
 *   -- Recursive case: Join with CTE itself
 *   SELECT ... FROM table JOIN cte_name ON ...
 * )
 * 
 * Use cases:
 * - Category trees
 * - Organizational hierarchies
 * - Bill of materials
 * - Graph traversal
 */
WITH RECURSIVE category_hierarchy AS (
    -- Base case: root categories
    SELECT 
        id,
        parent_id,
        name,
        slug,
        0 as level,
        name as path,
        ARRAY[id] as id_path
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
        c.id,
        c.parent_id,
        c.name,
        c.slug,
        ch.level + 1,
        ch.path || ' > ' || c.name as path,
        ch.id_path || c.id
    FROM categories c
    JOIN category_hierarchy ch ON c.parent_id = ch.id
)
SELECT 
    id,
    name,
    level,
    path,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = ch.id) as product_count
FROM category_hierarchy ch
ORDER BY path;

/**
 * =============================================================================
 * 3. ADVANCED AGGREGATIONS - Product Performance Analysis
 * =============================================================================
 * 
 * Combines multiple techniques:
 * - LEFT JOINs to include products with no sales
 * - Subqueries for aggregated data
 * - CASE statements for conditional logic
 * - COALESCE for handling NULLs
 * - ROUND for formatting numbers
 * 
 * INTERVIEW TIP: Explain the difference between:
 * - INNER JOIN: Only matching rows
 * - LEFT JOIN: All from left + matching from right
 * - Subquery in SELECT: Correlated, runs per row
 * - Subquery in FROM: Runs once, joined like a table
 */
SELECT 
    p.name as product_name,
    p.sku,
    c.name as category_name,
    b.name as brand_name,
    p.price,
    
    -- Sales metrics
    COALESCE(sales.total_quantity_sold, 0) as total_quantity_sold,
    COALESCE(sales.total_revenue, 0) as total_revenue,
    COALESCE(sales.order_count, 0) as order_count,
    
    -- Review metrics
    COALESCE(reviews.avg_rating, 0) as avg_rating,
    COALESCE(reviews.review_count, 0) as review_count,
    
    -- Inventory metrics
    p.inventory_quantity,
    CASE 
        WHEN p.inventory_quantity = 0 THEN 'Out of Stock'
        WHEN p.inventory_quantity <= p.low_stock_threshold THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    
    -- Performance calculations
    CASE 
        WHEN p.inventory_quantity > 0 
        THEN ROUND((COALESCE(sales.total_quantity_sold, 0)::numeric / p.inventory_quantity) * 100, 2)
        ELSE 0 
    END as inventory_turnover_percentage,
    
    ROUND(COALESCE(sales.total_revenue, 0) / NULLIF(COALESCE(sales.total_quantity_sold, 0), 0), 2) as avg_selling_price

FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN (
    SELECT 
        oi.product_id,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
    GROUP BY oi.product_id
) sales ON p.id = sales.product_id
LEFT JOIN (
    SELECT 
        product_id,
        AVG(rating::numeric) as avg_rating,
        COUNT(*) as review_count
    FROM reviews
    WHERE is_approved = true
    GROUP BY product_id
) reviews ON p.id = reviews.product_id
WHERE p.is_active = true
ORDER BY total_revenue DESC NULLS LAST;

/**
 * =============================================================================
 * 4. COHORT ANALYSIS - Monthly Customer Retention
 * =============================================================================
 * 
 * COHORT ANALYSIS groups users by when they first performed an action
 * (e.g., first purchase) and tracks their behavior over time.
 * 
 * Use cases:
 * - Customer retention rates
 * - Feature adoption tracking
 * - Revenue cohort analysis
 * 
 * Key concepts:
 * - Cohort: Group of users with shared characteristic
 * - Period: Time since cohort formation
 * - Retention: Percentage still active in each period
 * 
 * INTERVIEW TIP: Cohort analysis reveals trends that aggregate
 * metrics hide. A declining retention rate might be masked by
 * growing user acquisition.
 */
WITH monthly_cohorts AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', MIN(created_at)) as cohort_month
    FROM orders
    WHERE payment_status = 'paid'
    GROUP BY user_id
),
user_activities AS (
    SELECT 
        mc.user_id,
        mc.cohort_month,
        DATE_TRUNC('month', o.created_at) as activity_month,
        EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', o.created_at), mc.cohort_month)) * 12 + 
        EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', o.created_at), mc.cohort_month)) as period_number
    FROM monthly_cohorts mc
    JOIN orders o ON mc.user_id = o.user_id
    WHERE o.payment_status = 'paid'
),
cohort_data AS (
    SELECT 
        cohort_month,
        period_number,
        COUNT(DISTINCT user_id) as customers
    FROM user_activities
    GROUP BY cohort_month, period_number
),
cohort_sizes AS (
    SELECT 
        cohort_month,
        COUNT(DISTINCT user_id) as cohort_size
    FROM monthly_cohorts
    GROUP BY cohort_month
)
SELECT 
    cd.cohort_month,
    cs.cohort_size,
    cd.period_number,
    cd.customers,
    ROUND(100.0 * cd.customers / cs.cohort_size, 2) as retention_rate
FROM cohort_data cd
JOIN cohort_sizes cs ON cd.cohort_month = cs.cohort_month
WHERE cd.cohort_month >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY cd.cohort_month, cd.period_number;

-- 5. ADVANCED FILTERING - Dynamic Product Search with Full-Text Search
CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT DEFAULT NULL,
    category_ids UUID[] DEFAULT NULL,
    brand_ids UUID[] DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    min_rating DECIMAL DEFAULT NULL,
    in_stock_only BOOLEAN DEFAULT FALSE,
    sort_by TEXT DEFAULT 'relevance',
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    product_slug VARCHAR,
    price DECIMAL,
    avg_rating DECIMAL,
    review_count BIGINT,
    inventory_quantity INTEGER,
    category_name VARCHAR,
    brand_name VARCHAR,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        COALESCE(r.avg_rating, 0) as avg_rating,
        COALESCE(r.review_count, 0) as review_count,
        p.inventory_quantity,
        c.name as category_name,
        b.name as brand_name,
        CASE 
            WHEN search_term IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || array_to_string(p.tags, ' ')),
                    plainto_tsquery('english', search_term)
                )
            ELSE 0
        END as relevance_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN (
        SELECT 
            product_id,
            AVG(rating::numeric) as avg_rating,
            COUNT(*) as review_count
        FROM reviews
        WHERE is_approved = true
        GROUP BY product_id
    ) r ON p.id = r.product_id
    WHERE 
        p.is_active = true
        AND (search_term IS NULL OR 
             to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || array_to_string(p.tags, ' ')) 
             @@ plainto_tsquery('english', search_term))
        AND (category_ids IS NULL OR p.category_id = ANY(category_ids))
        AND (brand_ids IS NULL OR p.brand_id = ANY(brand_ids))
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (min_rating IS NULL OR COALESCE(r.avg_rating, 0) >= min_rating)
        AND (NOT in_stock_only OR p.inventory_quantity > 0)
    ORDER BY 
        CASE 
            WHEN sort_by = 'relevance' AND search_term IS NOT NULL THEN relevance_score
            WHEN sort_by = 'price_asc' THEN p.price
            WHEN sort_by = 'price_desc' THEN -p.price
            WHEN sort_by = 'rating' THEN -COALESCE(r.avg_rating, 0)
            WHEN sort_by = 'newest' THEN EXTRACT(EPOCH FROM p.created_at)
            ELSE relevance_score
        END DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- 6. SALES ANALYTICS - Revenue Trends with Moving Averages
WITH daily_sales AS (
    SELECT 
        DATE(o.created_at) as sale_date,
        COUNT(*) as order_count,
        SUM(o.total_amount) as daily_revenue,
        AVG(o.total_amount) as avg_order_value
    FROM orders o
    WHERE 
        o.payment_status = 'paid'
        AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE(o.created_at)
),
sales_with_trends AS (
    SELECT 
        sale_date,
        order_count,
        daily_revenue,
        avg_order_value,
        
        -- 7-day moving averages
        AVG(daily_revenue) OVER (
            ORDER BY sale_date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as revenue_7day_ma,
        
        AVG(order_count) OVER (
            ORDER BY sale_date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as orders_7day_ma,
        
        -- Week-over-week growth
        LAG(daily_revenue, 7) OVER (ORDER BY sale_date) as revenue_7days_ago,
        
        -- Month-over-month comparison
        LAG(daily_revenue, 30) OVER (ORDER BY sale_date) as revenue_30days_ago
    FROM daily_sales
)
SELECT 
    sale_date,
    ROUND(daily_revenue::numeric, 2) as daily_revenue,
    order_count,
    ROUND(avg_order_value::numeric, 2) as avg_order_value,
    ROUND(revenue_7day_ma::numeric, 2) as revenue_7day_moving_avg,
    ROUND(orders_7day_ma::numeric, 2) as orders_7day_moving_avg,
    
    -- Growth calculations
    CASE 
        WHEN revenue_7days_ago > 0 THEN
            ROUND(((daily_revenue - revenue_7days_ago) / revenue_7days_ago * 100)::numeric, 2)
        ELSE NULL
    END as wow_growth_percent,
    
    CASE 
        WHEN revenue_30days_ago > 0 THEN
            ROUND(((daily_revenue - revenue_30days_ago) / revenue_30days_ago * 100)::numeric, 2)
        ELSE NULL
    END as mom_growth_percent

FROM sales_with_trends
ORDER BY sale_date DESC;

-- 7. INVENTORY OPTIMIZATION - ABC Analysis
WITH product_sales AS (
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total_price) as total_revenue,
        p.inventory_quantity,
        p.price * p.inventory_quantity as inventory_value
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.sku, p.inventory_quantity, p.price
),
revenue_analysis AS (
    SELECT 
        *,
        SUM(total_revenue) OVER () as total_company_revenue,
        total_revenue / SUM(total_revenue) OVER () * 100 as revenue_percentage,
        SUM(total_revenue) OVER (ORDER BY total_revenue DESC ROWS UNBOUNDED PRECEDING) / 
        SUM(total_revenue) OVER () * 100 as cumulative_revenue_percentage
    FROM product_sales
)
SELECT 
    product_name,
    sku,
    COALESCE(total_quantity_sold, 0) as units_sold,
    ROUND(COALESCE(total_revenue, 0)::numeric, 2) as revenue,
    ROUND(revenue_percentage::numeric, 2) as revenue_percentage,
    ROUND(cumulative_revenue_percentage::numeric, 2) as cumulative_percentage,
    inventory_quantity,
    ROUND(inventory_value::numeric, 2) as inventory_value,
    
    -- ABC Classification
    CASE 
        WHEN cumulative_revenue_percentage <= 80 THEN 'A'
        WHEN cumulative_revenue_percentage <= 95 THEN 'B'
        ELSE 'C'
    END as abc_category,
    
    -- Recommendations
    CASE 
        WHEN cumulative_revenue_percentage <= 80 AND inventory_quantity < 50 THEN 'Increase Stock - High Priority'
        WHEN cumulative_revenue_percentage > 95 AND inventory_quantity > 100 THEN 'Reduce Stock - Low Priority'
        WHEN COALESCE(total_quantity_sold, 0) = 0 AND inventory_quantity > 0 THEN 'Consider Discontinuing'
        ELSE 'Monitor'
    END as recommendation

FROM revenue_analysis
ORDER BY total_revenue DESC NULLS LAST;