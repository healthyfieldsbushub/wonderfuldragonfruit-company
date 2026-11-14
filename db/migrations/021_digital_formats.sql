-- One ebook, several files: PDF and EPUB from a single purchase.
--
-- A buyer who pays once should be able to take the book in whichever format
-- suits them, and later come back for the other. Formats live in their own table
-- rather than as more columns on products, so a title can carry two, three or
-- more files without a schema change each time.
--
-- products.digital_file_key stays as the primary format and is still what older
-- rows use, so nothing that already works is disturbed. When a product has no
-- rows here, delivery falls back to the single file on the product.
--
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS digital_product_files (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  product_id     VARCHAR(64) NOT NULL,
  -- Shown to the buyer as the format name, e.g. "PDF" or "EPUB".
  format         VARCHAR(32) NOT NULL,
  file_key       VARCHAR(512) NOT NULL,
  file_name      VARCHAR(255) NULL,
  file_size      BIGINT NULL,
  label          VARCHAR(128) NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_digital_product_format (product_id, format),
  KEY idx_digital_product_files_product (product_id)
);

-- Which file a download actually served. A token can be used once per format,
-- so a buyer taking the PDF does not spend their EPUB allowance.
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'digital_download_events' AND COLUMN_NAME = 'format'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE digital_download_events ADD COLUMN format VARCHAR(32) NULL',
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Seed the table from any product that already has a single file, so existing
-- ebooks immediately behave as one-format titles in the new structure.
INSERT IGNORE INTO digital_product_files (product_id, format, file_key, file_name, file_size, sort_order)
SELECT id,
       UPPER(COALESCE(NULLIF(digital_file_format, ''), 'PDF')),
       digital_file_key,
       digital_file_name,
       digital_file_size,
       0
  FROM products
 WHERE is_digital = 1
   AND digital_file_key IS NOT NULL
   AND digital_file_key <> '';
