ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `image_fingerprint` VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS `image_original_name` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `image_original_bytes` BIGINT NULL,
  ADD COLUMN IF NOT EXISTS `image_processed_bytes` BIGINT NULL,
  ADD COLUMN IF NOT EXISTS `image_width` INT NULL,
  ADD COLUMN IF NOT EXISTS `image_height` INT NULL,
  ADD COLUMN IF NOT EXISTS `image_processed_at` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `image_watermarked` tinyint(1) NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `image_metadata` JSON NULL;

CREATE TABLE IF NOT EXISTS `bridge_audit_log` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `action` VARCHAR(80) NOT NULL,
  `resource` VARCHAR(80) NULL,
  `request_id` VARCHAR(80) NULL,
  `client_name` VARCHAR(191) NULL,
  `ip_hash` VARCHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bridge_audit_created_at` (`created_at`),
  INDEX `idx_bridge_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
