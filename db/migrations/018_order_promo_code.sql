-- Attribute an order to the promo code it used.
--
-- Until now the only record was a human-readable note ("Promo code: X (-R 60.00)")
-- which cannot be aggregated reliably. A real column lets the admin dashboard show
-- accurate redemption counts and trends per code.
--
-- The column may already exist (it was created by the schema bridge as TEXT), so
-- every step below is guarded and this file is safe to run more than once.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'promo_code'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE orders ADD COLUMN promo_code VARCHAR(191) NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- A TEXT column needs a prefix length to be indexable.
SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'promo_code'
);
SET @sql := IF(@has_idx = 0,
  'CREATE INDEX idx_orders_promo_code ON orders (promo_code(64))',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Backfill from the existing note format. The note reads
-- "Promo code: BLACKNOVEMBER2026 (-R 60.00)", so take everything after the label
-- and cut at the first space.
UPDATE orders
SET promo_code = UPPER(SUBSTRING_INDEX(SUBSTRING_INDEX(notes, 'Promo code: ', -1), ' ', 1))
WHERE (promo_code IS NULL OR promo_code = '')
  AND notes LIKE '%Promo code:%';
