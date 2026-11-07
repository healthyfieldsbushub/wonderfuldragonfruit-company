-- Product system upgrade: variants, slug redirects, per-image alt texts, SEO backfills.
-- Non-destructive: only adds tables/columns and fills empty values.

CREATE TABLE IF NOT EXISTS product_variants (
  id CHAR(36) NOT NULL PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  name VARCHAR(191) NOT NULL,
  sku VARCHAR(191) NOT NULL,
  price_zar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  weight_kg DECIMAL(8,3) NULL,
  length_cm DECIMAL(8,2) NULL,
  width_cm DECIMAL(8,2) NULL,
  height_cm DECIMAL(8,2) NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_variant_sku (sku),
  KEY idx_variants_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_slug_redirects (
  old_slug VARCHAR(191) NOT NULL PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_redirect_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-image alt texts, aligned by index with the products.images JSON array.
ALTER TABLE products
  ADD COLUMN image_alt_texts JSON NULL AFTER images;

-- Backfill SEO fields only where empty; never overwrite existing copy.
UPDATE products
SET meta_title = CONCAT(name, ' | Buy Dragon Fruit Plants | DFSA')
WHERE meta_title IS NULL OR meta_title = '';

UPDATE products
SET meta_description = LEFT(CONCAT(COALESCE(short_description, name), ' – premium dragon fruit cultivar from Wonderful Dragon Fruit South Africa. Nationwide delivery.'), 160)
WHERE meta_description IS NULL OR meta_description = '';
