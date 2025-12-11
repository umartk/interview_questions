/**
 * =============================================================================
 * ADVANCED SQL SCHEMA - E-commerce Database
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates production-ready database schema design including:
 * - Proper normalization and relationships
 * - Strategic indexing for performance
 * - Constraints for data integrity
 * - JSON columns for flexible data
 * 
 * DATABASE: PostgreSQL
 * 
 * INTERVIEW TOPICS:
 * - Database normalization (1NF, 2NF, 3NF)
 * - Index types and when to use them
 * - Foreign key relationships
 * - Data integrity constraints
 * 
 * SCHEMA OVERVIEW:
 * 
 *   users ─────┬───── addresses
 *              │
 *              ├───── orders ────── order_items ────── products
 *              │                                          │
 *              ├───── reviews ────────────────────────────┤
 *              │                                          │
 *              ├───── cart_items ─────────────────────────┤
 *              │                                          │
 *              └───── wishlists ──────────────────────────┘
 *                                                         │
 *                     categories ─────────────────────────┤
 *                                                         │
 *                     brands ─────────────────────────────┘
 */

-- Enable UUID extension for PostgreSQL (generates unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/**
 * USERS TABLE
 * 
 * Core user information with:
 * - UUID primary key (better for distributed systems)
 * - Email uniqueness constraint
 * - JSONB for flexible preferences storage
 * - Soft delete support (deleted_at)
 * 
 * INTERVIEW TIP: Discuss UUID vs auto-increment IDs
 * - UUID: No central authority needed, harder to guess
 * - Auto-increment: Smaller, faster, sequential
 */
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'moderator')),
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Addresses table for flexible address management
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories with hierarchical structure
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * PRODUCTS TABLE
 * 
 * Product catalog with:
 * - SKU for inventory tracking
 * - Slug for SEO-friendly URLs
 * - JSONB for flexible dimensions/attributes
 * - Array type for tags (PostgreSQL feature)
 * - Inventory tracking fields
 * 
 * INTERVIEW TIP: Discuss denormalization trade-offs
 * - Normalized: Less redundancy, more JOINs
 * - Denormalized: Faster reads, data duplication
 */
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_price DECIMAL(10,2) CHECK (compare_price >= price),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    weight DECIMAL(8,3),
    dimensions JSONB, -- {length, width, height, unit}
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT TRUE,
    track_inventory BOOLEAN DEFAULT TRUE,
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    tags TEXT[],
    images JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}', -- Custom product attributes
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Product variants for products with multiple options
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
    weight DECIMAL(8,3),
    image_url TEXT,
    options JSONB DEFAULT '{}', -- {color: 'red', size: 'large'}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Shopping cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, variant_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    
    -- Financial details
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Addresses (denormalized for historical accuracy)
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Shipping details
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    carrier VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    admin_notes TEXT
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Snapshot of product details at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_title VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupons and discounts
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage tracking
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coupon_id, order_id)
);

-- Inventory tracking
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_id UUID, -- Could reference order_id, return_id, etc.
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Wishlist
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Recently viewed products
CREATE TABLE recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

/**
 * =============================================================================
 * INDEXES - Performance Optimization
 * =============================================================================
 * 
 * INDEX TYPES:
 * - B-tree (default): Good for equality and range queries
 * - Hash: Only equality comparisons
 * - GIN: Full-text search, arrays, JSONB
 * - GiST: Geometric data, full-text search
 * 
 * WHEN TO CREATE INDEXES:
 * - Columns in WHERE clauses
 * - Columns in JOIN conditions
 * - Columns in ORDER BY
 * - Foreign key columns
 * 
 * WHEN NOT TO INDEX:
 * - Small tables (full scan is faster)
 * - Columns with low cardinality
 * - Frequently updated columns
 * - Tables with heavy write operations
 * 
 * INTERVIEW TIP: Indexes speed up reads but slow down writes
 * Each INSERT/UPDATE must also update the index
 */
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_type ON addresses(type);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON recently_viewed(viewed_at);