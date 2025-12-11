-- Advanced Stored Procedures and Functions for E-commerce
-- These demonstrate complex business logic implementation in SQL

-- 1. Order Processing with Inventory Management
CREATE OR REPLACE FUNCTION process_order(
    p_user_id UUID,
    p_items JSONB, -- [{"product_id": "uuid", "variant_id": "uuid", "quantity": 2}]
    p_shipping_address JSONB,
    p_billing_address JSONB DEFAULT NULL,
    p_coupon_code VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    order_id UUID,
    total_amount DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR;
    v_subtotal DECIMAL := 0;
    v_tax_amount DECIMAL := 0;
    v_shipping_amount DECIMAL := 10.00; -- Fixed shipping for demo
    v_discount_amount DECIMAL := 0;
    v_total_amount DECIMAL;
    v_item JSONB;
    v_product RECORD;
    v_variant RECORD;
    v_item_total DECIMAL;
    v_coupon RECORD;
    v_insufficient_stock TEXT := '';
BEGIN
    -- Generate order ID and number
    v_order_id := uuid_generate_v4();
    v_order_number := 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
                      LPAD(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT, 10, '0');

    -- Validate and calculate totals
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get product details
        SELECT * INTO v_product
        FROM products 
        WHERE id = (v_item->>'product_id')::UUID 
        AND is_active = true;
        
        IF NOT FOUND THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 
                'Product not found: ' || (v_item->>'product_id');
            RETURN;
        END IF;

        -- Check if variant is specified
        IF v_item->>'variant_id' IS NOT NULL THEN
            SELECT * INTO v_variant
            FROM product_variants 
            WHERE id = (v_item->>'variant_id')::UUID 
            AND product_id = v_product.id
            AND is_active = true;
            
            IF NOT FOUND THEN
                RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 
                    'Product variant not found: ' || (v_item->>'variant_id');
                RETURN;
            END IF;
            
            -- Check variant inventory
            IF v_variant.inventory_quantity < (v_item->>'quantity')::INTEGER THEN
                v_insufficient_stock := v_insufficient_stock || v_product.name || ' (' || v_variant.title || '), ';
            END IF;
            
            v_item_total := v_variant.price * (v_item->>'quantity')::INTEGER;
        ELSE
            -- Check product inventory
            IF v_product.inventory_quantity < (v_item->>'quantity')::INTEGER THEN
                v_insufficient_stock := v_insufficient_stock || v_product.name || ', ';
            END IF;
            
            v_item_total := v_product.price * (v_item->>'quantity')::INTEGER;
        END IF;

        v_subtotal := v_subtotal + v_item_total;
    END LOOP;

    -- Check for insufficient stock
    IF LENGTH(v_insufficient_stock) > 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 
            'Insufficient stock for: ' || RTRIM(v_insufficient_stock, ', ');
        RETURN;
    END IF;

    -- Apply coupon if provided
    IF p_coupon_code IS NOT NULL THEN
        SELECT * INTO v_coupon
        FROM coupons 
        WHERE code = p_coupon_code 
        AND is_active = true
        AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
        AND (expires_at IS NULL OR expires_at >= CURRENT_TIMESTAMP)
        AND (usage_limit IS NULL OR usage_count < usage_limit);

        IF FOUND THEN
            IF v_coupon.minimum_amount <= v_subtotal THEN
                CASE v_coupon.type
                    WHEN 'percentage' THEN
                        v_discount_amount := v_subtotal * (v_coupon.value / 100);
                    WHEN 'fixed_amount' THEN
                        v_discount_amount := LEAST(v_coupon.value, v_subtotal);
                    WHEN 'free_shipping' THEN
                        v_shipping_amount := 0;
                END CASE;
            END IF;
        END IF;
    END IF;

    -- Calculate tax (8% for demo)
    v_tax_amount := (v_subtotal - v_discount_amount) * 0.08;
    v_total_amount := v_subtotal + v_tax_amount + v_shipping_amount - v_discount_amount;

    -- Create order
    INSERT INTO orders (
        id, order_number, user_id, subtotal, tax_amount, 
        shipping_amount, discount_amount, total_amount,
        shipping_address, billing_address
    ) VALUES (
        v_order_id, v_order_number, p_user_id, v_subtotal, v_tax_amount,
        v_shipping_amount, v_discount_amount, v_total_amount,
        p_shipping_address, COALESCE(p_billing_address, p_shipping_address)
    );

    -- Create order items and update inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
        
        IF v_item->>'variant_id' IS NOT NULL THEN
            SELECT * INTO v_variant FROM product_variants WHERE id = (v_item->>'variant_id')::UUID;
            
            INSERT INTO order_items (
                order_id, product_id, variant_id, quantity, unit_price, total_price,
                product_name, product_sku, variant_title
            ) VALUES (
                v_order_id, v_product.id, v_variant.id, (v_item->>'quantity')::INTEGER,
                v_variant.price, v_variant.price * (v_item->>'quantity')::INTEGER,
                v_product.name, v_product.sku, v_variant.title
            );
            
            -- Update variant inventory
            UPDATE product_variants 
            SET inventory_quantity = inventory_quantity - (v_item->>'quantity')::INTEGER
            WHERE id = v_variant.id;
            
            -- Log inventory transaction
            INSERT INTO inventory_transactions (
                product_id, variant_id, type, quantity_change, quantity_after,
                reference_id, reference_type
            ) VALUES (
                v_product.id, v_variant.id, 'sale', -(v_item->>'quantity')::INTEGER,
                v_variant.inventory_quantity - (v_item->>'quantity')::INTEGER,
                v_order_id, 'order'
            );
        ELSE
            INSERT INTO order_items (
                order_id, product_id, quantity, unit_price, total_price,
                product_name, product_sku
            ) VALUES (
                v_order_id, v_product.id, (v_item->>'quantity')::INTEGER,
                v_product.price, v_product.price * (v_item->>'quantity')::INTEGER,
                v_product.name, v_product.sku
            );
            
            -- Update product inventory
            UPDATE products 
            SET inventory_quantity = inventory_quantity - (v_item->>'quantity')::INTEGER
            WHERE id = v_product.id;
            
            -- Log inventory transaction
            INSERT INTO inventory_transactions (
                product_id, type, quantity_change, quantity_after,
                reference_id, reference_type
            ) VALUES (
                v_product.id, 'sale', -(v_item->>'quantity')::INTEGER,
                v_product.inventory_quantity - (v_item->>'quantity')::INTEGER,
                v_order_id, 'order'
            );
        END IF;
    END LOOP;

    -- Update coupon usage if applied
    IF v_coupon.id IS NOT NULL THEN
        UPDATE coupons SET usage_count = usage_count + 1 WHERE id = v_coupon.id;
        
        INSERT INTO coupon_usages (coupon_id, order_id, user_id, discount_amount)
        VALUES (v_coupon.id, v_order_id, p_user_id, v_discount_amount);
    END IF;

    -- Clear user's cart
    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN QUERY SELECT TRUE, v_order_id, v_total_amount, 'Order processed successfully';
END;
$$ LANGUAGE plpgsql;

-- 2. Product Recommendation Engine
CREATE OR REPLACE FUNCTION get_product_recommendations(
    p_user_id UUID DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    price DECIMAL,
    avg_rating DECIMAL,
    recommendation_score DECIMAL,
    recommendation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        -- Get user's purchase history and preferences
        SELECT DISTINCT
            p.category_id,
            p.brand_id,
            COUNT(*) as purchase_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = p_user_id AND o.payment_status = 'paid'
        GROUP BY p.category_id, p.brand_id
    ),
    similar_products AS (
        -- Products in same category as viewed product
        SELECT 
            p.id,
            p.name,
            p.price,
            COALESCE(r.avg_rating, 0) as avg_rating,
            3.0 as base_score,
            'Similar product' as reason
        FROM products p
        LEFT JOIN (
            SELECT product_id, AVG(rating::numeric) as avg_rating
            FROM reviews WHERE is_approved = true
            GROUP BY product_id
        ) r ON p.id = r.product_id
        WHERE p.category_id = (SELECT category_id FROM products WHERE id = p_product_id)
        AND p.id != p_product_id
        AND p.is_active = true
    ),
    frequently_bought_together AS (
        -- Products frequently bought with the viewed product
        SELECT 
            p.id,
            p.name,
            p.price,
            COALESCE(r.avg_rating, 0) as avg_rating,
            4.0 + (COUNT(*) * 0.5) as base_score,
            'Frequently bought together' as reason
        FROM products p
        LEFT JOIN (
            SELECT product_id, AVG(rating::numeric) as avg_rating
            FROM reviews WHERE is_approved = true
            GROUP BY product_id
        ) r ON p.id = r.product_id
        WHERE p.id IN (
            SELECT DISTINCT oi2.product_id
            FROM order_items oi1
            JOIN order_items oi2 ON oi1.order_id = oi2.order_id
            WHERE oi1.product_id = p_product_id
            AND oi2.product_id != p_product_id
        )
        AND p.is_active = true
        GROUP BY p.id, p.name, p.price, r.avg_rating
    ),
    user_based_recommendations AS (
        -- Based on user's purchase history
        SELECT 
            p.id,
            p.name,
            p.price,
            COALESCE(r.avg_rating, 0) as avg_rating,
            2.0 + COALESCE(up.purchase_count * 0.3, 0) as base_score,
            'Based on your preferences' as reason
        FROM products p
        LEFT JOIN user_preferences up ON p.category_id = up.category_id OR p.brand_id = up.brand_id
        LEFT JOIN (
            SELECT product_id, AVG(rating::numeric) as avg_rating
            FROM reviews WHERE is_approved = true
            GROUP BY product_id
        ) r ON p.id = r.product_id
        WHERE p.is_active = true
        AND p.id != COALESCE(p_product_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND p_user_id IS NOT NULL
    ),
    trending_products AS (
        -- Trending/popular products
        SELECT 
            p.id,
            p.name,
            p.price,
            COALESCE(r.avg_rating, 0) as avg_rating,
            1.0 + (sales.order_count * 0.1) as base_score,
            'Trending product' as reason
        FROM products p
        LEFT JOIN (
            SELECT product_id, AVG(rating::numeric) as avg_rating
            FROM reviews WHERE is_approved = true
            GROUP BY product_id
        ) r ON p.id = r.product_id
        LEFT JOIN (
            SELECT 
                oi.product_id,
                COUNT(DISTINCT oi.order_id) as order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND o.payment_status = 'paid'
            GROUP BY oi.product_id
        ) sales ON p.id = sales.product_id
        WHERE p.is_active = true
        AND p.id != COALESCE(p_product_id, '00000000-0000-0000-0000-000000000000'::UUID)
    ),
    all_recommendations AS (
        SELECT * FROM similar_products
        UNION ALL
        SELECT * FROM frequently_bought_together
        UNION ALL
        SELECT * FROM user_based_recommendations
        UNION ALL
        SELECT * FROM trending_products
    ),
    scored_recommendations AS (
        SELECT 
            id,
            name,
            price,
            avg_rating,
            SUM(base_score) + (avg_rating * 0.5) as final_score,
            STRING_AGG(DISTINCT reason, ', ') as combined_reason
        FROM all_recommendations
        GROUP BY id, name, price, avg_rating
    )
    SELECT 
        id,
        name,
        price,
        ROUND(avg_rating::numeric, 2),
        ROUND(final_score::numeric, 2),
        combined_reason
    FROM scored_recommendations
    ORDER BY final_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 3. Dynamic Pricing Function
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    base_price DECIMAL,
    dynamic_price DECIMAL,
    discount_percentage DECIMAL,
    pricing_factors JSONB
) AS $$
DECLARE
    v_product RECORD;
    v_base_price DECIMAL;
    v_final_price DECIMAL;
    v_discount_percent DECIMAL := 0;
    v_factors JSONB := '{}';
    v_inventory_factor DECIMAL := 1.0;
    v_demand_factor DECIMAL := 1.0;
    v_loyalty_factor DECIMAL := 1.0;
    v_seasonal_factor DECIMAL := 1.0;
BEGIN
    -- Get product details
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    v_base_price := v_product.price;
    v_final_price := v_base_price;

    -- Inventory-based pricing
    IF v_product.inventory_quantity <= v_product.low_stock_threshold THEN
        v_inventory_factor := 1.1; -- 10% increase for low stock
        v_factors := jsonb_set(v_factors, '{inventory}', '"Low stock premium"');
    ELSIF v_product.inventory_quantity > 100 THEN
        v_inventory_factor := 0.95; -- 5% decrease for overstocked
        v_factors := jsonb_set(v_factors, '{inventory}', '"Overstock discount"');
    END IF;

    -- Demand-based pricing (based on recent sales)
    WITH recent_sales AS (
        SELECT COUNT(*) as sale_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = p_product_id
        AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND o.payment_status = 'paid'
    )
    SELECT 
        CASE 
            WHEN sale_count > 10 THEN 1.05 -- High demand
            WHEN sale_count < 2 THEN 0.9   -- Low demand
            ELSE 1.0
        END,
        CASE 
            WHEN sale_count > 10 THEN '"High demand premium"'
            WHEN sale_count < 2 THEN '"Low demand discount"'
            ELSE '"Normal demand"'
        END
    INTO v_demand_factor, v_factors
    FROM recent_sales;

    v_factors := jsonb_set(v_factors, '{demand}', v_factors);

    -- Customer loyalty discount
    IF p_user_id IS NOT NULL THEN
        WITH customer_stats AS (
            SELECT 
                COUNT(*) as order_count,
                SUM(total_amount) as total_spent
            FROM orders
            WHERE user_id = p_user_id AND payment_status = 'paid'
        )
        SELECT 
            CASE 
                WHEN total_spent > 1000 THEN 0.9  -- VIP 10% discount
                WHEN total_spent > 500 THEN 0.95  -- Loyal 5% discount
                WHEN order_count > 5 THEN 0.97    -- Regular 3% discount
                ELSE 1.0
            END
        INTO v_loyalty_factor
        FROM customer_stats;

        IF v_loyalty_factor < 1.0 THEN
            v_factors := jsonb_set(v_factors, '{loyalty}', '"Customer loyalty discount"');
        END IF;
    END IF;

    -- Seasonal factors (example: holiday season)
    IF EXTRACT(MONTH FROM CURRENT_DATE) IN (11, 12) THEN
        v_seasonal_factor := 1.05; -- Holiday premium
        v_factors := jsonb_set(v_factors, '{seasonal}', '"Holiday season premium"');
    END IF;

    -- Calculate final price
    v_final_price := v_base_price * v_inventory_factor * v_demand_factor * v_loyalty_factor * v_seasonal_factor;
    v_discount_percent := ((v_base_price - v_final_price) / v_base_price) * 100;

    RETURN QUERY SELECT 
        v_base_price,
        ROUND(v_final_price::numeric, 2),
        ROUND(v_discount_percent::numeric, 2),
        v_factors;
END;
$$ LANGUAGE plpgsql;

-- 4. Automated Reorder Point Calculation
CREATE OR REPLACE FUNCTION calculate_reorder_points()
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    current_stock INTEGER,
    avg_daily_sales DECIMAL,
    lead_time_days INTEGER,
    safety_stock INTEGER,
    reorder_point INTEGER,
    suggested_order_quantity INTEGER,
    urgency_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            p.id as product_id,
            p.name as product_name,
            p.inventory_quantity as current_stock,
            COALESCE(AVG(daily_sales.quantity), 0) as avg_daily_sales,
            7 as lead_time_days, -- Assume 7 days lead time
            GREATEST(COALESCE(AVG(daily_sales.quantity) * 3, 5), 5) as safety_stock
        FROM products p
        LEFT JOIN (
            SELECT 
                oi.product_id,
                DATE(o.created_at) as sale_date,
                SUM(oi.quantity) as quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.payment_status = 'paid'
            AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY oi.product_id, DATE(o.created_at)
        ) daily_sales ON p.id = daily_sales.product_id
        WHERE p.is_active = true AND p.track_inventory = true
        GROUP BY p.id, p.name, p.inventory_quantity
    )
    SELECT 
        sd.product_id,
        sd.product_name,
        sd.current_stock,
        ROUND(sd.avg_daily_sales::numeric, 2),
        sd.lead_time_days,
        sd.safety_stock::INTEGER,
        (sd.avg_daily_sales * sd.lead_time_days + sd.safety_stock)::INTEGER as reorder_point,
        GREATEST((sd.avg_daily_sales * 30)::INTEGER, 10) as suggested_order_quantity,
        CASE 
            WHEN sd.current_stock <= 0 THEN 'CRITICAL - Out of Stock'
            WHEN sd.current_stock <= (sd.avg_daily_sales * sd.lead_time_days + sd.safety_stock) * 0.5 THEN 'HIGH - Immediate Reorder'
            WHEN sd.current_stock <= (sd.avg_daily_sales * sd.lead_time_days + sd.safety_stock) THEN 'MEDIUM - Reorder Soon'
            ELSE 'LOW - Monitor'
        END as urgency_level
    FROM sales_data sd
    ORDER BY 
        CASE 
            WHEN sd.current_stock <= 0 THEN 1
            WHEN sd.current_stock <= (sd.avg_daily_sales * sd.lead_time_days + sd.safety_stock) * 0.5 THEN 2
            WHEN sd.current_stock <= (sd.avg_daily_sales * sd.lead_time_days + sd.safety_stock) THEN 3
            ELSE 4
        END,
        sd.avg_daily_sales DESC;
END;
$$ LANGUAGE plpgsql;