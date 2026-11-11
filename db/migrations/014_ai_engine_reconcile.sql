-- 014_ai_engine_reconcile.sql
--
-- The database already contained `ai_model_config`, `ai_usage_log` and
-- `ai_knowledge_base` (created by 001_initial_schema.sql and used by the
-- existing AI Configuration / AI Provider Dashboard admin pages).
--
-- The 1min.ai engine therefore reuses those tables as the single source of
-- truth instead of keeping a parallel set, and this migration extends them
-- with the extra columns the engine needs. All changes are guarded so the
-- migration is safe to re-run.

-- ---------------------------------------------------------------------------
-- ai_model_config: per-task model assignment (function_type is the task key)
-- ---------------------------------------------------------------------------
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_model_config' AND column_name = 'label') = 0,
  'ALTER TABLE ai_model_config ADD COLUMN label VARCHAR(191) NOT NULL DEFAULT ''''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_model_config' AND column_name = 'fallback_model') = 0,
  'ALTER TABLE ai_model_config ADD COLUMN fallback_model VARCHAR(191) NOT NULL DEFAULT ''''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_model_config' AND column_name = 'max_tokens') = 0,
  'ALTER TABLE ai_model_config ADD COLUMN max_tokens INT NOT NULL DEFAULT 4096',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_model_config' AND column_name = 'notes') = 0,
  'ALTER TABLE ai_model_config ADD COLUMN notes VARCHAR(255) NOT NULL DEFAULT ''''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_model_config' AND column_name = 'category') = 0,
  'ALTER TABLE ai_model_config ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT ''text''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- ai_usage_log: engine attribution columns
-- ---------------------------------------------------------------------------
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_usage_log' AND column_name = 'country_code') = 0,
  'ALTER TABLE ai_usage_log ADD COLUMN country_code VARCHAR(8) NOT NULL DEFAULT ''''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ai_usage_log' AND column_name = 'page_id') = 0,
  'ALTER TABLE ai_usage_log ADD COLUMN page_id VARCHAR(64) NOT NULL DEFAULT ''''',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Carry the seeded assignments into the existing table, then retire the
-- parallel table created moments earlier (it held only these seed rows).
-- ---------------------------------------------------------------------------
INSERT INTO ai_model_config (function_type, provider, model_id, model_name, label, fallback_model, max_tokens, notes, category, is_active)
SELECT task_key, 'onemin', model, model, label, fallback_model, max_tokens, notes, category, is_enabled
FROM ai_task_assignments
ON DUPLICATE KEY UPDATE
  provider = VALUES(provider),
  model_id = VALUES(model_id),
  label = VALUES(label),
  fallback_model = VALUES(fallback_model),
  max_tokens = VALUES(max_tokens),
  category = VALUES(category);

DROP TABLE IF EXISTS ai_task_assignments;
