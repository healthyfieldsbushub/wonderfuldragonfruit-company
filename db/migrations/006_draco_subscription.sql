-- DRACO Pro Grower paid AI subscription (PayFast recurring)
-- Strict no-free-tier: every DRACO chat/scan requires an active subscription.

CREATE TABLE IF NOT EXISTS draco_subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_open_id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NULL,
  plan VARCHAR(64) NOT NULL DEFAULT 'draco_pro_grower',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  provider VARCHAR(32) NOT NULL DEFAULT 'payfast',
  provider_token VARCHAR(191) NULL,
  amount_zar DECIMAL(10,2) NOT NULL DEFAULT 199.00,
  current_period_start DATETIME NULL,
  current_period_end DATETIME NULL,
  usage_month CHAR(7) NULL,
  message_count_this_month INT NOT NULL DEFAULT 0,
  scan_count_this_month INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_draco_user (user_open_id),
  INDEX idx_draco_status (status),
  UNIQUE KEY uq_draco_user_plan (user_open_id, plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS draco_usage_events (
  id CHAR(36) PRIMARY KEY,
  subscription_id CHAR(36) NOT NULL,
  event_type VARCHAR(32) NOT NULL, -- 'message' | 'scan'
  detail TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_draco_usage_sub (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the DRACO Pro Grower plan in the existing plans catalogue (was empty).
INSERT INTO subscription_plans (id, name, description, price_zar, duration_months, features, is_active)
SELECT UUID(), 'DRACO Pro Grower', 'Full AI Agronomist access: unlimited DRACO chat, 30 photo diagnosis scans per month, and priority answers from the admin-curated knowledgebase.',
  199, 1, JSON_ARRAY('Full DRACO AI Agronomist chat', '30 AI photo diagnosis scans per month', 'Admin-curated knowledgebase answers', 'Priority support routing'), 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'DRACO Pro Grower');
