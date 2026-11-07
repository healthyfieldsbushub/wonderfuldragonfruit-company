-- 007: Add delivery_zone to orders (Courier Guy / PUDO webhook handler writes
-- the normalized delivery zone reported by the shipment webhook).
ALTER TABLE orders ADD COLUMN delivery_zone VARCHAR(64) NULL AFTER courier;
