-- Digital downloads (ebooks and other files) sold alongside physical stock.
--
-- A product is digital when products.is_digital = 1. Digital lines carry no
-- weight and no dimensions, so they must never contribute to a shipping quote
-- and an all-digital cart must never be charged delivery.
--
-- Delivery is token based. Paying for an order creates one digital_downloads
-- row per digital unit bought; the buyer receives a link containing that token
-- and the file is streamed through the server behind a short-lived signed URL,
-- so the storage key itself is never exposed to the browser.
--
-- Every step is guarded, so this file is safe to run more than once.

-- ---------------------------------------------------------------- products ---
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_digital') = 0,
  'ALTER TABLE products ADD COLUMN is_digital TINYINT(1) NOT NULL DEFAULT 0',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_file_key') = 0,
  'ALTER TABLE products ADD COLUMN digital_file_key VARCHAR(512) NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_file_name') = 0,
  'ALTER TABLE products ADD COLUMN digital_file_name VARCHAR(255) NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_file_size') = 0,
  'ALTER TABLE products ADD COLUMN digital_file_size BIGINT NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_file_format') = 0,
  'ALTER TABLE products ADD COLUMN digital_file_format VARCHAR(32) NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_download_limit') = 0,
  'ALTER TABLE products ADD COLUMN digital_download_limit INT NOT NULL DEFAULT 5',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'digital_expiry_days') = 0,
  'ALTER TABLE products ADD COLUMN digital_expiry_days INT NOT NULL DEFAULT 365',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_is_digital') = 0,
  'CREATE INDEX idx_products_is_digital ON products (is_digital)',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------- download entitlements
CREATE TABLE IF NOT EXISTS digital_downloads (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  token             CHAR(64) NOT NULL,
  order_id          VARCHAR(64) NOT NULL,
  order_number      VARCHAR(64) NULL,
  product_id        VARCHAR(64) NOT NULL,
  product_name      VARCHAR(255) NULL,
  email             VARCHAR(255) NOT NULL,
  max_downloads     INT NOT NULL DEFAULT 5,
  download_count    INT NOT NULL DEFAULT 0,
  expires_at        DATETIME NULL,
  revoked           TINYINT(1) NOT NULL DEFAULT 0,
  last_downloaded_at DATETIME NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_digital_token (token),
  KEY idx_digital_order (order_id),
  KEY idx_digital_product (product_id),
  KEY idx_digital_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit trail: who fetched a file and when, so a shared link can be traced.
CREATE TABLE IF NOT EXISTS digital_download_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  download_id INT NOT NULL,
  token       CHAR(64) NULL,
  ip          VARCHAR(64) NULL,
  user_agent  VARCHAR(255) NULL,
  outcome     VARCHAR(32) NOT NULL DEFAULT 'ok',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_digital_event_download (download_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
