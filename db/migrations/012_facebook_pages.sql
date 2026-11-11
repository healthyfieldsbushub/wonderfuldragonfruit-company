-- One website managing many Facebook Pages. Each Page carries its own token.
CREATE TABLE IF NOT EXISTS facebook_pages (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  page_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  subscribed TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_facebook_page (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE facebook_comments ADD COLUMN page_id VARCHAR(64) NULL AFTER post_id;
