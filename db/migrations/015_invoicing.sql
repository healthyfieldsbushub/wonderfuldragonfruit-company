-- 015_invoicing.sql
--
-- Customer invoicing, built alongside the existing `quotations` module rather
-- than replacing it. An invoice is a separate document type: it carries a due
-- date, a payment state and a delivery history, which a quotation does not.
--
-- `invoices.farmer_id` links an invoice to an Association farmer profile so a
-- farmer's purchase history can be read straight off their record.

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) NOT NULL PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL,
  customer_id CHAR(36) NULL,
  farmer_id CHAR(36) NULL,
  quotation_id CHAR(36) NULL,
  -- Customer identity is stored on the invoice itself so an invoice can be
  -- raised for a walk-in customer who has never registered on the website.
  contact_name VARCHAR(191) NOT NULL DEFAULT '',
  company_name VARCHAR(191) NOT NULL DEFAULT '',
  email VARCHAR(191) NOT NULL DEFAULT '',
  whatsapp VARCHAR(64) NOT NULL DEFAULT '',
  billing_address TEXT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NULL,
  subtotal_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_enabled TINYINT(1) NOT NULL DEFAULT 1,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  vat_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'ZAR',
  -- payment_status changes only through a recorded payment or an explicit
  -- administrator action; creating an invoice never marks it paid.
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  status VARCHAR(32) NOT NULL DEFAULT 'issued',
  payment_terms VARCHAR(191) NOT NULL DEFAULT 'Payment due within 7 days of invoice date.',
  payment_instructions TEXT NULL,
  payment_reference VARCHAR(191) NOT NULL DEFAULT '',
  payment_date DATE NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_invoice_number (invoice_number),
  KEY idx_invoice_payment_status (payment_status),
  KEY idx_invoice_due_date (due_date),
  KEY idx_invoice_customer (customer_id),
  KEY idx_invoice_farmer (farmer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NULL,
  product_sku VARCHAR(64) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price_zar DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_item_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Immutable history: cancellations, status changes and every send attempt are
-- appended here so an invoice always has an audit trail.
CREATE TABLE IF NOT EXISTS invoice_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  event_type VARCHAR(48) NOT NULL,
  channel VARCHAR(24) NOT NULL DEFAULT '',
  recipient VARCHAR(191) NOT NULL DEFAULT '',
  status VARCHAR(24) NOT NULL DEFAULT '',
  detail TEXT NULL,
  actor VARCHAR(191) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_event_invoice (invoice_id),
  KEY idx_invoice_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sequence used to allocate gap-free invoice numbers per calendar year.
CREATE TABLE IF NOT EXISTS invoice_number_sequences (
  sequence_year INT NOT NULL PRIMARY KEY,
  -- `last_value` is reserved on TiDB, so the counter column is named explicitly.
  last_number INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
