-- Baseline: create Prisma migrations tracking table and mark existing migrations as applied
-- This table is normally auto-created by `prisma migrate dev`

CREATE TABLE `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
(UUID(), '25a1ae45b92a3f7470586d3c3b6396762ab7a054c1372b0aac9fe66c95266b75', NOW(), '202606090001_admin_rbac_reminder', NULL, NULL, NOW(), 1),
(UUID(), '3f09e129eadf3b7d96cc78b0c703e099a801d58883640612674c582babf7e88d', NOW(), '202606100001_optional_order_phone', NULL, NULL, NOW(), 1);
