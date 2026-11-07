-- 008: Packaging & packed-parcel shipping fields (doc 9A, additive-safe)
-- packaging_weight_kg: extra carton/box weight per unit
-- packed_*: final parcel dimensions when packaging changes the footprint
ALTER TABLE products
  ADD COLUMN packaging_weight_kg DECIMAL(8,3) NULL COMMENT 'Carton/packaging weight per unit (kg)',
  ADD COLUMN packed_length_cm DECIMAL(8,2) NULL COMMENT 'Final packed parcel length (cm)',
  ADD COLUMN packed_width_cm DECIMAL(8,2) NULL COMMENT 'Final packed parcel width (cm)',
  ADD COLUMN packed_height_cm DECIMAL(8,2) NULL COMMENT 'Final packed parcel height (cm)';
