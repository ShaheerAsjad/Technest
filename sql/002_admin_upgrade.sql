-- ============================================================================
-- 002_admin_upgrade.sql  -  additive changes for the admin upgrades.
-- (payment status on orders, back-in-stock notification tracking)
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending';
--;;
-- orders that were already delivered/cash-collected before this upgrade
UPDATE orders SET payment_status = 'Paid' WHERE status = 'Delivered' AND payment_status = 'Pending';
--;;
CREATE TABLE IF NOT EXISTS notify_subscribers (
  product_id INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, email)
);
--;;
ALTER TABLE notify_subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
--;;
ALTER TABLE notify_subscribers ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
--;;
CREATE INDEX IF NOT EXISTS notify_subscribers_product_idx ON notify_subscribers (product_id);
