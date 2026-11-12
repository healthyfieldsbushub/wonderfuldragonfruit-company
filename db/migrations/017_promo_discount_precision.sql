-- promo_codes.discount_value was DECIMAL(10,0), so a percentage discount such as
-- 12.5% could not be stored, and a fixed discount with cents would round. Invoices
-- and quotations already use DECIMAL(12,2); this brings promo codes in line.
ALTER TABLE promo_codes
  MODIFY COLUMN discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN min_order_zar  DECIMAL(12,2) NOT NULL DEFAULT 0;
