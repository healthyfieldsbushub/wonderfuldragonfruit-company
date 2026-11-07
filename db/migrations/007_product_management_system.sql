-- Product management system upgrade (master implementation prompt phases 2-5 + 10).
-- Non-destructive: only adds columns/tables. Run once; recorded in _manus_migrations.
-- Groups list-type content in JSON columns (arrays/objects) so every field remains
-- individually editable and addressable without exploding the column count.

-- ============ PHASE 2: GENERAL PRODUCT INFORMATION ============
ALTER TABLE products
  ADD COLUMN subcategory VARCHAR(191) NULL,
  ADD COLUMN manufacturer VARCHAR(191) NULL,
  ADD COLUMN supplier VARCHAR(191) NULL,
  ADD COLUMN product_type VARCHAR(100) NULL,           -- physical / digital / service / license
  ADD COLUMN product_condition VARCHAR(50) NULL,       -- new / used / refurbished
  ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'visible', -- visible / hidden / search-only
  ADD COLUMN highlights JSON NULL,                     -- ["..."]
  ADD COLUMN benefits JSON NULL,                       -- ["..."]
  ADD COLUMN features JSON NULL,                       -- ["..."]
  ADD COLUMN specifications JSON NULL,                 -- [{"label":"...","value":"..."}]
  ADD COLUMN applications TEXT NULL,                   -- applications and uses
  ADD COLUMN origin_country VARCHAR(100) NULL,
  ADD COLUMN countries_available JSON NULL,            -- ["South Africa", ...]
  ADD COLUMN target_customer TEXT NULL,
  ADD COLUMN target_industry VARCHAR(191) NULL,
  ADD COLUMN intended_use TEXT NULL,
  ADD COLUMN instructions TEXT NULL,
  ADD COLUMN warnings TEXT NULL,
  ADD COLUMN faqs JSON NULL,                           -- [{"question":"...","answer":"..."}]
  ADD COLUMN related_products JSON NULL,               -- [product ids]
  ADD COLUMN attachments JSON NULL;                    -- [{"name":"...","url":"/manus-storage/..."}]

-- ============ PHASE 3: ADVANCED SEARCH KEYWORDS & TAGS ============
ALTER TABLE products
  ADD COLUMN primary_keyword VARCHAR(255) NULL,
  ADD COLUMN secondary_keywords JSON NULL,
  ADD COLUMN long_tail_keywords JSON NULL,
  ADD COLUMN related_phrases JSON NULL,
  ADD COLUMN synonyms JSON NULL,
  ADD COLUMN alternative_names JSON NULL,
  ADD COLUMN spelling_variations JSON NULL,
  ADD COLUMN customer_questions JSON NULL,
  ADD COLUMN frequently_searched JSON NULL,
  ADD COLUMN search_tags JSON NULL,
  ADD COLUMN hashtags JSON NULL,
  ADD COLUMN industry_terms JSON NULL,
  ADD COLUMN geographic_keywords JSON NULL,
  ADD COLUMN country_keywords JSON NULL,
  ADD COLUMN city_keywords JSON NULL,
  ADD COLUMN identification_terms JSON NULL,
  ADD COLUMN product_classification VARCHAR(255) NULL,
  ADD COLUMN use_cases JSON NULL,
  ADD COLUMN problem_solution_keywords JSON NULL,
  ADD COLUMN search_intent VARCHAR(100) NULL,
  ADD COLUMN audience_keywords JSON NULL;

-- ============ PHASE 3: SEO FIELDS (beyond existing meta_title/meta_description/tags) ============
ALTER TABLE products
  ADD COLUMN canonical_url VARCHAR(500) NULL,
  ADD COLUMN og_title VARCHAR(255) NULL,
  ADD COLUMN og_description TEXT NULL,
  ADD COLUMN og_image VARCHAR(500) NULL,
  ADD COLUMN twitter_title VARCHAR(255) NULL,
  ADD COLUMN twitter_description TEXT NULL,
  ADD COLUMN twitter_image VARCHAR(500) NULL,
  ADD COLUMN internal_links JSON NULL,                 -- [{anchor,url,reason}]
  ADD COLUMN seo_content_score INT NULL,
  ADD COLUMN keyword_coverage_score INT NULL,
  ADD COLUMN duplicate_check_status VARCHAR(30) NULL;  -- ok / duplicate-found / not-checked

-- ============ PHASE 3: GEO / AI SEARCH FIELDS ============
ALTER TABLE products
  ADD COLUMN ai_search_title VARCHAR(255) NULL,
  ADD COLUMN ai_search_summary TEXT NULL,
  ADD COLUMN entity_description TEXT NULL,
  ADD COLUMN knowledge_summary TEXT NULL,
  ADD COLUMN qa_content JSON NULL,                     -- [{"question":"...","answer":"..."}]
  ADD COLUMN nl_search_phrases JSON NULL,
  ADD COLUMN conversational_questions JSON NULL,
  ADD COLUMN product_facts JSON NULL,                  -- [{"fact":"..."}] verified facts only
  ADD COLUMN geo_relevance TEXT NULL,
  ADD COLUMN target_regions JSON NULL,
  ADD COLUMN business_identity VARCHAR(255) NULL,
  ADD COLUMN expertise_info TEXT NULL;

-- ============ PHASE 4: PRODUCT-SPECIFIC OPTIONAL ATTRIBUTES ============
-- Optional, category-adaptive groups stored as {agri:{...}, health:{...}, general:{...}}.
ALTER TABLE products
  ADD COLUMN specific_attributes JSON NULL;

-- ============ PHASE 5: PRICING, INVENTORY, SHIPPING additions ============
ALTER TABLE products
  ADD COLUMN parcel_count INT NULL DEFAULT 1,
  ADD COLUMN shipping_class VARCHAR(100) NULL,
  ADD COLUMN special_handling TEXT NULL,
  ADD COLUMN tax_rate DECIMAL(5,2) NULL,               -- percent; NULL = use site default
  ADD COLUMN tax_included TINYINT(1) NULL DEFAULT 0;

-- ============ PHASE 10: SEARCH INDEX COLUMN ============
-- Server-maintained concatenation of name, sku, descriptions, category, brand and every
-- keyword/tag/synonym field, rewritten on each product save. Search queries LIKE-match
-- this column (plus direct column matches) so keywords genuinely drive discovery.
ALTER TABLE products
  ADD COLUMN search_text MEDIUMTEXT NULL;

CREATE INDEX idx_products_search_text ON products (search_text(191));
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_status ON products (is_active, is_featured);
