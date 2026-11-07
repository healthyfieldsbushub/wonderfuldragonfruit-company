-- Distributors enhancement: secure enquiry submissions and downloadable document registers.
-- Non-destructive: only adds tables and seeds reference data.

CREATE TABLE IF NOT EXISTS distributor_enquiries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  distributor_id CHAR(36) NOT NULL,
  country_slug VARCHAR(64) NOT NULL DEFAULT 'zimbabwe',
  full_name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NULL,
  inquiry_category VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  privacy_consent TINYINT(1) NOT NULL DEFAULT 0,
  user_agent_hash CHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  notified_email VARCHAR(191) NULL,
  notified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_enq_distributor (distributor_id),
  KEY idx_enq_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS distributor_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  country_slug VARCHAR(64) NOT NULL DEFAULT 'zimbabwe',
  title VARCHAR(191) NOT NULL,
  description VARCHAR(500) NULL,
  version_label VARCHAR(64) NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(191) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_doc_country (country_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the eight distributing countries if the table is still empty.
INSERT INTO distributor_countries (id, slug, name, flag_emoji, is_active, sort_order)
SELECT * FROM (
  SELECT 'cc000000-0000-4000-8000-000000000001' AS id, 'zimbabwe' AS slug, 'Zimbabwe' AS name, '🇿🇼' AS flag_emoji, 1 AS is_active, 1 AS sort_order UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000002', 'botswana', 'Botswana', '🇧🇼', 1, 2 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000003', 'zambia', 'Zambia', '🇿🇲', 1, 3 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000004', 'namibia', 'Namibia', '🇳🇦', 1, 4 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000005', 'drc', 'DRC', '🇨🇩', 1, 5 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000006', 'south-africa', 'South Africa', '🇿🇦', 1, 6 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000007', 'eswatini', 'Eswatini (Swaziland)', '🇸🇿', 1, 7 UNION ALL
  SELECT 'cc000000-0000-4000-8000-000000000008', 'lesotho', 'Lesotho', '🇱🇸', 1, 8
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM distributor_countries);
