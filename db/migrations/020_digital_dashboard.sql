-- Digital-download dashboard support.
--
-- Two additions, both driven by the admin dashboard:
--
-- 1. reissue_count records how many times an order's links had to be replaced.
--    The admin reissue flow revokes the old rows and inserts new ones, so without
--    a counter there is no record that a customer ever needed help. Aggregated per
--    ebook it answers "which titles keep needing reissuing?", which usually means
--    delivery emails are not arriving or links are expiring too soon.
--
-- 2. An index on product_id so the per-ebook sales and usage aggregates stay fast
--    as the catalogue and the number of purchases grow.
--
-- Every step is guarded, so this file is safe to run more than once.

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'digital_downloads' AND COLUMN_NAME = 'reissue_count'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE digital_downloads ADD COLUMN reissue_count INT NOT NULL DEFAULT 0',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'digital_downloads' AND COLUMN_NAME = 'product_id'
);
SET @sql := IF(@has_idx = 0,
  'CREATE INDEX idx_digital_downloads_product ON digital_downloads (product_id)',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- The events table is queried by download_id when showing a link's history.
SET @has_ev_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'digital_download_events' AND COLUMN_NAME = 'download_id'
);
SET @sql := IF(@has_ev_idx = 0,
  'CREATE INDEX idx_digital_events_download ON digital_download_events (download_id)',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
