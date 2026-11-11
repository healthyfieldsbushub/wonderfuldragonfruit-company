-- Direct Meta integration storage: Messenger threads and Page comments.
CREATE TABLE IF NOT EXISTS facebook_messages (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  mid VARCHAR(191) NOT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  sender_id VARCHAR(64) NULL,
  recipient_id VARCHAR(64) NULL,
  message_content TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_facebook_mid (mid),
  KEY idx_facebook_sender (sender_id),
  KEY idx_facebook_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS facebook_contacts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  psid VARCHAR(64) NOT NULL,
  name VARCHAR(255) NULL,
  last_message TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_facebook_psid (psid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS facebook_comments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  comment_id VARCHAR(191) NOT NULL,
  post_id VARCHAR(191) NULL,
  author_id VARCHAR(64) NULL,
  author_name VARCHAR(255) NULL,
  content TEXT NULL,
  reply_id VARCHAR(191) NULL,
  reply_content TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_facebook_comment (comment_id),
  KEY idx_facebook_post (post_id),
  KEY idx_facebook_comment_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
