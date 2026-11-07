-- Migration 009: WhatsApp Cloud API message store
-- Stores inbound/outbound WhatsApp messages for the Meta WhatsApp Business number
-- Phone Number ID: 1363502856851590 (+27 63 801 8790)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wa_message_id VARCHAR(128) NULL,
  direction ENUM('inbound','outbound') NOT NULL DEFAULT 'inbound',
  from_number VARCHAR(32) NULL,
  to_number VARCHAR(32) NULL,
  profile_name VARCHAR(191) NULL,
  message_type VARCHAR(32) NULL,
  text_body MEDIUMTEXT NULL,
  status VARCHAR(32) NULL,
  order_ref VARCHAR(64) NULL,
  raw JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wa_msg_id (wa_message_id),
  INDEX idx_wa_from (from_number),
  INDEX idx_wa_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
