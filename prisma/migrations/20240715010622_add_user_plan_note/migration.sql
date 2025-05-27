-- CreateTable
CREATE TABLE `user_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',
    `status_message` TEXT NULL,
    `physical_state` TINYINT NOT NULL DEFAULT 0,
    `mental_state` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
