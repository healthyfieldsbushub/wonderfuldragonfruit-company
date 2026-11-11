-- 013_ai_marketing_engine.sql
-- Central 1min.ai engine: model catalog, per-task model assignment, usage accounting
-- and the business knowledgebase used by every AI customer-service surface.

CREATE TABLE IF NOT EXISTS ai_models (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  provider VARCHAR(64) NOT NULL DEFAULT '',
  owned_by VARCHAR(64) NOT NULL DEFAULT '',
  capabilities VARCHAR(255) NOT NULL DEFAULT 'text',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_task_assignments (
  task_key VARCHAR(64) NOT NULL PRIMARY KEY,
  label VARCHAR(128) NOT NULL DEFAULT '',
  category VARCHAR(32) NOT NULL DEFAULT 'text',
  provider VARCHAR(32) NOT NULL DEFAULT 'onemin',
  model VARCHAR(191) NOT NULL DEFAULT '',
  fallback_model VARCHAR(191) NOT NULL DEFAULT '',
  max_tokens INT NOT NULL DEFAULT 4096,
  temperature DECIMAL(3,2) NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  notes VARCHAR(255) NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_key VARCHAR(64) NOT NULL DEFAULT '',
  provider VARCHAR(32) NOT NULL DEFAULT 'onemin',
  model VARCHAR(191) NOT NULL DEFAULT '',
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  latency_ms INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'success',
  error_message VARCHAR(500) NOT NULL DEFAULT '',
  site_scope VARCHAR(64) NOT NULL DEFAULT 'wonderfuldragonfruit.company',
  country_code VARCHAR(8) NOT NULL DEFAULT '',
  page_id VARCHAR(64) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_usage_task (task_key),
  KEY idx_ai_usage_created (created_at),
  KEY idx_ai_usage_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_settings (
  setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entry_key VARCHAR(191) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'general',
  country_code VARCHAR(8) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NULL,
  source VARCHAR(191) NOT NULL DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_ai_kb_entry (entry_key),
  KEY idx_ai_kb_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default model assignment per task. Model IDs verified live against
-- GET https://api.1min.ai/openai/v1/models on 2026-11-11.
INSERT INTO ai_task_assignments (task_key, label, category, provider, model, fallback_model, max_tokens, notes) VALUES
  ('blog_research',     'Blog article research',        'text',  'onemin', 'gpt-5.1',       'gpt-4.1-mini', 8192, 'Topic discovery and factual research for daily country blogs.'),
  ('blog_writing',      'Blog article writing',         'text',  'onemin', 'gpt-5.2',       'gpt-5-mini',   8192, 'Long-form original article generation.'),
  ('seo_geo',           'SEO and GEO optimisation',     'text',  'onemin', 'gpt-5.1',       'gpt-4.1-mini', 4096, 'Meta titles, descriptions, keywords and GEO targeting.'),
  ('facebook_post',     'Facebook post writing',        'text',  'onemin', 'gpt-5-mini',    'gpt-4.1-mini', 2048, 'Adapts a blog article into a page-specific post.'),
  ('facebook_messenger','Facebook Messenger replies',   'text',  'onemin', 'gpt-5-mini',    'gpt-4.1-mini', 1024, 'Customer-service replies inside Messenger.'),
  ('facebook_comment',  'Facebook comment replies',     'text',  'onemin', 'gpt-5-mini',    'gpt-4.1-mini', 1024, 'Public comment responses.'),
  ('whatsapp_reply',    'WhatsApp replies',             'text',  'onemin', 'gpt-5-mini',    'gpt-4.1-mini', 1024, 'WhatsApp Cloud API auto-replies.'),
  ('customer_service',  'General customer service',     'text',  'onemin', 'gpt-5-mini',    'gpt-4.1-mini', 2048, 'Shared customer-service persona.'),
  ('image_generation',  'Blog and post images',         'image', 'onemin', 'black-forest-labs/flux-2-pro', '', 0, 'Legacy /api/features endpoint (IMAGE_GENERATOR).'),
  ('duplicate_check',   'Duplicate content detection',  'text',  'onemin', 'gpt-5-nano',    'gpt-4.1-mini', 1024, 'Semantic comparison before publishing.')
ON DUPLICATE KEY UPDATE label = VALUES(label), category = VALUES(category), notes = VALUES(notes);

INSERT INTO ai_settings (setting_key, setting_value) VALUES
  ('ai_marketing_enabled', '0'),
  ('blog_articles_per_page_per_day', '2'),
  ('auto_publish_facebook', '0'),
  ('require_manual_approval', '1'),
  ('publishing_timezone', 'Africa/Johannesburg')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
