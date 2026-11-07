-- Manus-managed MySQL schema generated from the approved source history.

-- This file contains schema only; data import is intentionally separate and waits for the user export.

SET NAMES utf8mb4;



CREATE TABLE IF NOT EXISTS `african_countries` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL UNIQUE,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `flag_emoji` TEXT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_buyers` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `city` TEXT NULL,
  `physical_address` TEXT NULL,
  `postal_address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `description` TEXT NULL,
  `notes` TEXT NULL,
  `associated_market_id` char(36) NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_dragon_fruit_prices` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NULL,
  `source` TEXT NOT NULL,
  `source_url` TEXT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'ZAR',
  `price_per_kg` NUMERIC(10,2) NOT NULL,
  `wholesale_or_retail` VARCHAR(191) NOT NULL DEFAULT 'wholesale',
  `variety` TEXT NULL,
  `notes` TEXT NULL,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_feed_items` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `source_id` char(36) NOT NULL,
  `title` TEXT NOT NULL,
  `link` TEXT NOT NULL,
  `summary` TEXT NULL,
  `image_url` TEXT NULL,
  `published_at` DATETIME NULL,
  `category` TEXT NULL,
  `country_scope` VARCHAR(191) NOT NULL DEFAULT 'global',
  `guid` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_feed_sources` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `source_type` VARCHAR(191) NOT NULL DEFAULT 'rss',
  `category` VARCHAR(191) NOT NULL DEFAULT 'agri_news',
  `url` TEXT NOT NULL,
  `country_scope` VARCHAR(191) NOT NULL DEFAULT 'global',
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `last_fetched_at` DATETIME NULL,
  `fetch_status` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_government_bodies` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `level` VARCHAR(191) NOT NULL DEFAULT 'national',
  `city` TEXT NULL,
  `physical_address` TEXT NULL,
  `postal_address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_markets` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `region_id` char(36) NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `market_type` VARCHAR(191) NOT NULL DEFAULT 'municipal_fresh_produce',
  `city` TEXT NULL,
  `physical_address` TEXT NULL,
  `postal_address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `description` TEXT NULL,
  `notes` TEXT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT false,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_organizations` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `focus` TEXT NULL,
  `city` TEXT NULL,
  `physical_address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agri_processing_facilities` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `segment` TEXT NOT NULL,
  `city` TEXT NULL,
  `physical_address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_model_config` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `function_type` VARCHAR(191) NOT NULL UNIQUE,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'openrouter',
  `model_id` TEXT NOT NULL,
  `model_name` TEXT NOT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_provider_config` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `provider_name` VARCHAR(191) NOT NULL UNIQUE,
  `display_name` text NOT NULL,
  `base_url` text NOT NULL,
  `auth_type` VARCHAR(191) NOT NULL DEFAULT 'bearer',
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `priority` int NOT NULL DEFAULT 10,
  `rate_limit_per_minute` int DEFAULT 60 NULL,
  `daily_credit_limit` int DEFAULT NULL,
  `settings` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_usage_log` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `provider_name` text NOT NULL,
  `model_id` text NOT NULL,
  `function_type` text NOT NULL,
  `user_id` char(36) NULL,
  `prompt_tokens` int DEFAULT 0 NULL,
  `completion_tokens` int DEFAULT 0 NULL,
  `total_tokens` int DEFAULT 0 NULL,
  `cost_estimate` numeric(10, 6) DEFAULT 0 NULL,
  `success` tinyint(1) NOT NULL DEFAULT true,
  `error_message` text NULL,
  `response_time_ms` int NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `api_clients` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` text NOT NULL,
  `description` text NULL,
  `key_prefix` text NOT NULL,
  `key_hash` text NOT NULL,
  `scopes` json NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `last_used_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `created_by` char(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `api_keys_vault` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `key_name` VARCHAR(191) NOT NULL UNIQUE,
  `key_value` TEXT NOT NULL,
  `service_type` TEXT NOT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `last_used_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP NULL,
  `created_by` char(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `title` TEXT NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `excerpt` TEXT NULL,
  `content` TEXT NOT NULL,
  `featured_image_url` TEXT NULL,
  `author_id` char(36) NULL,
  `author_name` TEXT NULL,
  `category` VARCHAR(191) DEFAULT 'general' NULL,
  `tags` json NULL,
  `is_published` tinyint(1) DEFAULT false NULL,
  `is_featured` tinyint(1) DEFAULT false NULL,
  `published_at` datetime NULL,
  `meta_title` TEXT NULL,
  `meta_description` TEXT NULL,
  `read_time_minutes` int DEFAULT 5 NULL,
  `view_count` int DEFAULT 0 NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_listings` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `user_id` char(36) NULL,
  `business_name` TEXT NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `category` TEXT NOT NULL,
  `province_id` char(36) NULL,
  `city_id` char(36) NULL,
  `address` TEXT NULL,
  `phone` TEXT NULL,
  `email` TEXT NULL,
  `website` TEXT NULL,
  `logo_url` TEXT NULL,
  `cover_image_url` TEXT NULL,
  `gallery_images` json NULL,
  `management_team` json NULL,
  `operating_hours` json NULL,
  `services` json NULL,
  `is_verified` tinyint(1) DEFAULT false NULL,
  `is_featured` tinyint(1) DEFAULT false NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `subscription_status` VARCHAR(191) DEFAULT 'inactive' NULL,
  `view_count` int DEFAULT 0 NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_subscriptions` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `business_id` char(36) NULL,
  `plan_id` char(36) NULL,
  `user_id` char(36) NULL,
  `status` VARCHAR(191) DEFAULT 'pending' NULL,
  `expires_at` datetime NULL,
  `payment_reference` TEXT NULL,
  `amount_paid_zar` NUMERIC NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `customer_id` char(36) NULL,
  `session_id` TEXT NULL,
  `items` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image_url` TEXT NULL,
  `parent_id` char(36) NULL,
  `sort_order` int DEFAULT 0 NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `province_id` char(36) NULL,
  `name` TEXT NOT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `commercial_leads` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `full_name` TEXT NOT NULL,
  `country` TEXT NOT NULL,
  `phone` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `plants_needed` TEXT NOT NULL,
  `message` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'new',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_enquiries` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `phone` TEXT NULL,
  `subject` TEXT NULL,
  `message` TEXT NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'contact_form',
  `status` VARCHAR(191) NOT NULL DEFAULT 'new',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `email` TEXT NOT NULL,
  `first_name` TEXT NULL,
  `last_name` TEXT NULL,
  `phone` TEXT NULL,
  `default_shipping_address` json NULL,
  `default_billing_address` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dfsa_countries` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `name` text NOT NULL,
  `sub_region` VARCHAR(191) NOT NULL DEFAULT 'Southern Africa',
  `iso_code` text NULL,
  `flag_emoji` text NULL,
  `currency` text NULL,
  `languages` json NULL,
  `hero_title` text NULL,
  `hero_subtitle` text NULL,
  `intro` text NULL,
  `meta_title` text NULL,
  `meta_description` text NULL,
  `keywords` json NULL,
  `hashtags` json NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dfsa_region_pages` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `region_id` char(36) NOT NULL,
  `page_slug` text NOT NULL,
  `page_category` text NULL,
  `title` text NOT NULL,
  `h1` text NULL,
  `body_md` text NULL,
  `meta_title` text NULL,
  `meta_description` text NULL,
  `keywords` json NULL,
  `hashtags` json NULL,
  `schema_jsonld` json NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT true,
  `ai_generated` tinyint(1) NOT NULL DEFAULT false,
  `generation_model` text NULL,
  `generated_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dfsa_regions` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `capital_city` text NULL,
  `hero_title` text NULL,
  `hero_subtitle` text NULL,
  `intro` text NULL,
  `meta_title` text NULL,
  `meta_description` text NULL,
  `keywords` json NULL,
  `hashtags` json NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `directory_listings` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `business_name` text NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `contact_name` text NULL,
  `email` text NULL,
  `phone` text NULL,
  `website` text NULL,
  `description` text NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT 'general',
  `country` text NULL,
  `city` text NULL,
  `address` text NULL,
  `logo_url` text NULL,
  `cover_image_url` text NULL,
  `social_links` json NULL,
  `tags` json NULL,
  `approval_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `rejection_reason` text NULL,
  `approved_by` char(36) NULL,
  `approved_at` DATETIME NULL,
  `submitted_by` char(36) NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT false,
  `view_count` int NOT NULL DEFAULT 0,
  `metadata` json NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `distributor_countries` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `name` text NOT NULL,
  `flag_emoji` text NULL,
  `hero_title` text NULL,
  `hero_subtitle` text NULL,
  `hero_tagline` text NULL,
  `hero_image_url` text NULL,
  `intro` text NULL,
  `meta_title` text NULL,
  `meta_description` text NULL,
  `keywords` json NULL,
  `hashtags` json NULL,
  `head_office_email` VARCHAR(191) NOT NULL DEFAULT 'orders@proagrisa.co.za',
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `distributors` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `business_name` text NOT NULL,
  `logo_url` text NULL,
  `banner_url` text NULL,
  `representative_name` text NULL,
  `position` text NULL,
  `address` text NULL,
  `province` text NULL,
  `phone` text NULL,
  `mobile` text NULL,
  `whatsapp` text NULL,
  `email` text NULL,
  `website` text NULL,
  `facebook` text NULL,
  `instagram` text NULL,
  `operating_hours` text NULL,
  `latitude` numeric NULL,
  `longitude` numeric NULL,
  `maps_embed_url` text NULL,
  `years_with_dfsa` text NULL,
  `service_area` text NULL,
  `description` text NULL,
  `products` json NULL,
  `gallery_images` json NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `integration_tokens` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `encrypted_token` TEXT NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_base` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `title` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT 'general',
  `tags` json NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `priority` int DEFAULT 0 NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menus` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `location` TEXT NOT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `email` text NOT NULL,
  `name` text NULL,
  `source` text NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'subscribed',
  `tags` json NULL,
  `metadata` json NULL,
  `unsubscribe_token` char(36) NOT NULL DEFAULT (UUID()),
  `subscribed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `order_id` char(36) NOT NULL,
  `product_id` char(36) NULL,
  `product_name` TEXT NOT NULL,
  `product_sku` TEXT NULL,
  `quantity` int NOT NULL,
  `unit_price_zar` DECIMAL(10,2) NOT NULL,
  `total_price_zar` DECIMAL(10,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `order_number` VARCHAR(191) NOT NULL UNIQUE,
  `customer_id` char(36) NULL,
  `guest_email` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `payment_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `payment_method` TEXT NULL,
  `payment_reference` TEXT NULL,
  `subtotal_zar` DECIMAL(10,2) NOT NULL,
  `shipping_cost_zar` DECIMAL(10,2) DEFAULT 0 NULL,
  `discount_zar` DECIMAL(10,2) DEFAULT 0 NULL,
  `tax_zar` DECIMAL(10,2) DEFAULT 0 NULL,
  `total_zar` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(191) DEFAULT 'ZAR' NULL,
  `shipping_method` TEXT NULL,
  `shipping_address` json NULL,
  `billing_address` json NULL,
  `notes` TEXT NULL,
  `tracking_number` TEXT NULL,
  `shipped_at` datetime NULL,
  `delivered_at` datetime NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `title` TEXT NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `content` TEXT NULL,
  `template` VARCHAR(191) DEFAULT 'default' NULL,
  `is_published` tinyint(1) DEFAULT false NULL,
  `meta_title` TEXT NULL,
  `meta_description` TEXT NULL,
  `featured_image_url` TEXT NULL,
  `sort_order` int DEFAULT 0 NULL,
  `parent_id` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `order_id` char(36) NOT NULL,
  `provider` TEXT NOT NULL,
  `transaction_id` TEXT NULL,
  `payment_id` TEXT NULL,
  `amount_zar` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `payment_data` json NULL,
  `error_message` TEXT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `sku` VARCHAR(191) NOT NULL UNIQUE,
  `name` TEXT NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `short_description` TEXT NULL,
  `description` TEXT NULL,
  `category_id` char(36) NULL,
  `price_zar` DECIMAL(10,2) NOT NULL,
  `compare_at_price_zar` DECIMAL(10,2) NULL,
  `cost_price_zar` DECIMAL(10,2) NULL,
  `weight_kg` DECIMAL(8,3) NULL,
  `length_cm` DECIMAL(8,2) NULL,
  `width_cm` DECIMAL(8,2) NULL,
  `height_cm` DECIMAL(8,2) NULL,
  `stock_quantity` int NOT NULL DEFAULT 0,
  `low_stock_threshold` int DEFAULT 5 NULL,
  `allow_backorder` tinyint(1) DEFAULT false NULL,
  `images` json NULL,
  `primary_image_url` TEXT NULL,
  `brand` TEXT NULL,
  `barcode` TEXT NULL,
  `meta_title` TEXT NULL,
  `meta_description` TEXT NULL,
  `tags` json NULL,
  `is_featured` tinyint(1) DEFAULT false NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `email` text NOT NULL,
  `full_name` text NULL,
  `avatar_url` text NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `discount_type` VARCHAR(191) NOT NULL DEFAULT 'percentage',
  `discount_value` NUMERIC NOT NULL DEFAULT 0,
  `min_order_zar` NUMERIC DEFAULT 0 NULL,
  `max_uses` int NULL,
  `current_uses` int DEFAULT 0 NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `starts_at` datetime NULL,
  `expires_at` datetime NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `provinces` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `country_id` char(36) NULL,
  `name` TEXT NOT NULL,
  `code` TEXT NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `quotation_id` char(36) NOT NULL,
  `product_id` char(36) NULL,
  `product_name` text NOT NULL,
  `product_sku` text NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `unit_price_zar` numeric NOT NULL,
  `total_price_zar` numeric NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `quotation_number` VARCHAR(191) NOT NULL DEFAULT '',
  `customer_name` text NOT NULL,
  `company_name` text NULL,
  `phone` text NULL,
  `email` text NULL,
  `billing_address` text NULL,
  `subtotal_zar` numeric NOT NULL DEFAULT 0,
  `vat_zar` numeric NOT NULL DEFAULT 0,
  `total_zar` numeric NOT NULL DEFAULT 0,
  `vat_enabled` tinyint(1) NOT NULL DEFAULT true,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `notes` text NULL,
  `created_by` char(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shipping_rates` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `provider` TEXT NOT NULL,
  `max_length_cm` DECIMAL(10,2) NULL,
  `max_width_cm` DECIMAL(10,2) NULL,
  `max_height_cm` DECIMAL(10,2) NULL,
  `price_zar` DECIMAL(10,2) NOT NULL,
  `description` TEXT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `sort_order` int DEFAULT 0 NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `price_zar` NUMERIC NOT NULL DEFAULT 200,
  `duration_months` int NOT NULL DEFAULT 1,
  `features` json NULL,
  `is_active` tinyint(1) DEFAULT true NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tiktok_connections` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  `tiktok_user_id` text NULL,
  `business_id` text NULL,
  `account_name` text NULL,
  `access_token_encrypted` text NOT NULL,
  `refresh_token_encrypted` text NULL,
  `token_expires_at` DATETIME NULL,
  `refresh_token_expires_at` DATETIME NULL,
  `scopes` json NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'connected',
  `connected_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tiktok_oauth_states` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `state_hash` VARCHAR(191) NOT NULL UNIQUE,
  `user_id` char(36) NOT NULL,
  `redirect_uri` text NOT NULL,
  `scopes` json NULL,
  `used_at` DATETIME NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `user_id` char(36) NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webhook_events` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `event_type` text NOT NULL,
  `payload` json NOT NULL,
  `resource_type` text NULL,
  `resource_id` char(36) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `subscription_id` char(36) NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `max_attempts` int NOT NULL DEFAULT 3,
  `next_attempt_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_response_status` int NULL,
  `last_response_body` text NULL,
  `last_error` text NULL,
  `delivered_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webhook_subscriptions` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `secret` text NOT NULL,
  `events` json NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT true,
  `description` text NULL,
  `headers` json NULL,
  `last_success_at` DATETIME NULL,
  `last_failure_at` DATETIME NULL,
  `failure_count` int NOT NULL DEFAULT 0,
  `created_by` char(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whatsapp_contacts` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `wa_id` VARCHAR(191) UNIQUE NOT NULL,
  `name` TEXT NULL,
  `phone_number` TEXT NULL,
  `email` TEXT NULL,
  `notes` TEXT NULL,
  `tags` json NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id` char(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  `wa_message_id` VARCHAR(191) UNIQUE NULL,
  `from_number` TEXT NOT NULL,
  `to_number` TEXT NULL,
  `message_type` VARCHAR(191) NOT NULL DEFAULT 'text',
  `message_content` TEXT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP NULL,
  `direction` TEXT NOT NULL,
  `status` VARCHAR(191) DEFAULT 'pending' NULL,
  `status_timestamp` DATETIME NULL,
  `raw_payload` json NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `rooting_status` VARCHAR(191) DEFAULT NULL;

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `access_token` char(36) DEFAULT NULL;

ALTER TABLE `ai_model_config` ADD COLUMN IF NOT EXISTS `tools_enabled_serpapi` tinyint(1) DEFAULT false,
ADD COLUMN IF NOT EXISTS serpapi_max_calls int DEFAULT 10;

ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `promo_start_date` datetime,
  ADD COLUMN IF NOT EXISTS promo_end_date datetime;

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `promo_code` TEXT,
  ADD COLUMN IF NOT EXISTS promo_discount_zar NUMERIC DEFAULT 0;

ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `whatsapp_opt_in` tinyint(1) NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS customer_type VARCHAR(191) NOT NULL DEFAULT 'home_grower',
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS monday_id text,
  ADD COLUMN IF NOT EXISTS facebook_lead_id text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags json NULL,
  ADD COLUMN IF NOT EXISTS metadata json NULL;

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `tracking_url` text,
  ADD COLUMN IF NOT EXISTS courier text,
  ADD COLUMN IF NOT EXISTS metadata json NULL;
