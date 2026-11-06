ALTER TABLE `AdminLoginChallenge` ADD COLUMN `pendingPasswordHash` VARCHAR(256) NULL;
CREATE TABLE `AdminCredential` (
  `id` VARCHAR(64) NOT NULL,
  `passwordHash` VARCHAR(256) NOT NULL,
  `bootstrapVersion` VARCHAR(64) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
