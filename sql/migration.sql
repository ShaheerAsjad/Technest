-- ============================================================
-- TechNest — New Features Migration
-- ============================================================
-- Run this ONCE in your Neon dashboard (SQL Editor tab).
-- This ONLY adds two new tables — it does not touch, alter,
-- or delete anything in your existing products, categories,
-- or orders tables. 100% safe / additive.
-- ============================================================

-- Product reviews (real user reviews + ratings)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- "Notify me when back in stock" requests
CREATE TABLE IF NOT EXISTS notify_subscribers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, email)
);

CREATE INDEX IF NOT EXISTS idx_notify_product_id ON notify_subscribers(product_id);

-- ============================================================
-- Done. You should see "Success" with no errors.
-- ============================================================
