-- Specials of the Month: independent per-product flag (separate from is_featured).
ALTER TABLE products
  ADD COLUMN is_special_of_month TINYINT(1) NOT NULL DEFAULT 0;
