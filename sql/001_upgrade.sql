-- ============================================================================
-- 001_upgrade.sql  -  ADDITIVE upgrade for the Atlantic-style catalog.
-- Only ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / CREATE INDEX IF
-- NOT EXISTS. Nothing is dropped, renamed or deleted. Safe to run many times.
-- Statements are separated by lines that start with  --;;
-- A separator written as  --;; optional  means "ignore failure of the next
-- statement" (e.g. an extension the DB user may not be allowed to create).
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--;;
-- ---------------------------------------------------------------- categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(160);
--;;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER;
--;;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS department VARCHAR(30) NOT NULL DEFAULT 'consumer';
--;;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;
--;;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
--;;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
--;;
UPDATE categories
   SET slug = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')))
 WHERE slug IS NULL OR slug = '';
--;;
UPDATE categories SET slug = 'category-' || id WHERE slug IS NULL OR slug = '';
--;;
UPDATE categories c SET slug = c.slug || '-' || c.id
 WHERE c.id IN (
   SELECT id FROM (
     SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn FROM categories
   ) t WHERE t.rn > 1
 );
--;;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uq ON categories (slug);
--;;
CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories (parent_id);
--;;
-- ------------------------------------------------------------------ products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(80);
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(240);
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(120);
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE;
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
--;;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'manual';
--;;
UPDATE products
   SET slug = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')))
 WHERE slug IS NULL OR slug = '';
--;;
UPDATE products SET slug = 'product-' || id WHERE slug IS NULL OR slug = '';
--;;
UPDATE products p SET slug = p.slug || '-' || p.id
 WHERE p.id IN (
   SELECT id FROM (
     SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn FROM products
   ) t WHERE t.rn > 1
 );
--;;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uq ON products (slug);
--;;
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_uq ON products (sku) WHERE sku IS NOT NULL;
--;;
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);
--;;
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);
--;;
CREATE INDEX IF NOT EXISTS products_brand_idx ON products (LOWER(brand));
--;; optional
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--;; optional
CREATE INDEX IF NOT EXISTS products_title_trgm ON products USING gin (title gin_trgm_ops);
--;;
-- -------------------------------------------------------------------- brands
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
--;;
-- -------------------------------------------------------------------- orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  customer_name VARCHAR(255),
  phone VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  items JSONB,
  total_amount NUMERIC(10, 2),
  payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
  status VARCHAR(100) DEFAULT 'Order Placed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(80);
--;;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN NOT NULL DEFAULT FALSE;
--;;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idem_uq ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
--;;
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);
--;;
-- ------------------------------------------------------------------- coupons
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
--;;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
--;;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
--;;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER;
--;;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;
--;;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE;
--;;
-- ------------------------------------------------------------------- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--;;
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);
--;;
-- ---------------------------------------------- settings, media, rate limits
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);
--;;
INSERT INTO store_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
--;;
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  mime VARCHAR(60) NOT NULL,
  data BYTEA NOT NULL,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
--;;
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
