CREATE TABLE `EmailSettings` (
  `id` VARCHAR(64) NOT NULL,
  `host` VARCHAR(255) NOT NULL,
  `port` INTEGER NOT NULL,
  `secure` BOOLEAN NOT NULL,
  `username` VARCHAR(254) NOT NULL,
  `sender` VARCHAR(320) NOT NULL,
  `passwordEncrypted` TEXT NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `EmailSetupGrant` (
  `id` VARCHAR(191) NOT NULL,
  `ownerId` VARCHAR(64) NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EmailSetupGrant_tokenHash_key` (`tokenHash`),
  INDEX `EmailSetupGrant_ownerId_expiresAt_idx` (`ownerId`, `expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
