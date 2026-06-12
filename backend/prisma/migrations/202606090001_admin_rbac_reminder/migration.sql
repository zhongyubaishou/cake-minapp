CREATE TABLE IF NOT EXISTS `admin_role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `permissions` JSON NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_role_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_user`
  ADD COLUMN `role_id` INT NULL;

CREATE INDEX `admin_user_role_id_idx` ON `admin_user` (`role_id`);

ALTER TABLE `admin_user`
  ADD CONSTRAINT `admin_user_role_id_fkey`
  FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `reminder_setting` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_confirm_notice` TINYINT NOT NULL DEFAULT 1,
  `paid_notice` TINYINT NOT NULL DEFAULT 0,
  `production_notice` TINYINT NOT NULL DEFAULT 1,
  `pickup_notice` TINYINT NOT NULL DEFAULT 1,
  `delivery_notice` TINYINT NOT NULL DEFAULT 1,
  `complete_notice` TINYINT NOT NULL DEFAULT 1,
  `refund_notice` TINYINT NOT NULL DEFAULT 0,
  `new_order_sound` TINYINT NOT NULL DEFAULT 1,
  `paid_sound` TINYINT NOT NULL DEFAULT 0,
  `refund_sound` TINYINT NOT NULL DEFAULT 0,
  `after_sale_sound` TINYINT NOT NULL DEFAULT 1,
  `appointment_sound` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `admin_role` (`code`, `name`, `permissions`)
VALUES (
  'OWNER',
  '老板',
  JSON_ARRAY(
    'dashboard:view',
    'order:view', 'order:confirm', 'order:adjust', 'order:cancel', 'order:produce', 'order:deliver',
    'product:view', 'product:manage',
    'category:view', 'category:manage',
    'case:view', 'case:manage',
    'afterSale:view', 'afterSale:complete',
    'report:view',
    'reminder:view', 'reminder:manage',
    'store:view', 'store:manage',
    'upload:admin'
  )
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `permissions` = VALUES(`permissions`),
  `status` = 1;

UPDATE `admin_user`
SET `role_id` = (SELECT `id` FROM `admin_role` WHERE `code` = 'OWNER' LIMIT 1)
WHERE `role_id` IS NULL;

INSERT INTO `reminder_setting` (`id`)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM `reminder_setting` WHERE `id` = 1);
