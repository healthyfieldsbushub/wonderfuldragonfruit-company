-- Quotations and their line items stored money as DECIMAL(10,0), i.e. with no
-- decimal places. Every quotation therefore silently rounded to whole Rands:
-- a R145.50 line item was stored as R146, and 15% VAT on R436.50 (R65.475)
-- became R65. Invoices already used DECIMAL(12,2); this brings quotations in
-- line so quoted prices and VAT match the invoice that follows them.

ALTER TABLE quotations
  MODIFY COLUMN subtotal_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN vat_zar      DECIMAL(12,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_zar    DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE quotation_items
  MODIFY COLUMN unit_price_zar  DECIMAL(12,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_price_zar DECIMAL(12,2) NOT NULL DEFAULT 0;
