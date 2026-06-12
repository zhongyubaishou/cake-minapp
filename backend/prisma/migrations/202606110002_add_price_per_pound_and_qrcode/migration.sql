ALTER TABLE `store_config`
  ADD COLUMN `price_per_pound` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE `store_config`
  ADD COLUMN `qr_code_url` VARCHAR(512) NULL;
