-- Add the fields used by the admin shipping-rate table and opt-in calculator.
-- The migration runner records this file after applying it once per managed database.
ALTER TABLE `shipping_rates`
  ADD COLUMN `service_name` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `service_code` VARCHAR(191) NULL,
  ADD COLUMN `max_weight_kg` DECIMAL(10,2) NOT NULL DEFAULT 0;
