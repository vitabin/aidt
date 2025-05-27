-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trigger_uuid` VARCHAR(36) NOT NULL DEFAULT 'SYSTEM',
    `taker_uuid` VARCHAR(36) NOT NULL,
    `action` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `additional_data1` INTEGER NULL,
    `additional_data2` INTEGER NULL,
    `additional_data3` INTEGER NULL,
    `additional_text` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `action`(`action`),
    INDEX `createdAt`(`createdAt`),
    INDEX `taker_uuid`(`taker_uuid`),
    INDEX `trigger_uuid`(`trigger_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
