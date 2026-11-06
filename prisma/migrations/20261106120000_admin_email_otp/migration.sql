CREATE TABLE `AdminLoginChallenge` (
  `id` VARCHAR(64) NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `codeHash` VARCHAR(64) NOT NULL,
  `credentialVersion` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastSentAt` DATETIME(3) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `delivered` BOOLEAN NOT NULL DEFAULT false,
  `consumedAt` DATETIME(3) NULL,
  INDEX `AdminLoginChallenge_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
