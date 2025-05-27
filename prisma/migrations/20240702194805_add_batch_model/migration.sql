-- CreateTable
CREATE TABLE `partner` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `partner_id` VARCHAR(36) NOT NULL,
    `grade` CHAR(2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_transfer` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `partner_id` VARCHAR(36) NOT NULL,
    `transfer_id` VARCHAR(36) NOT NULL,
    `partner_access_token` VARCHAR(256) NOT NULL,
    `start_time` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
