-- CreateTable
CREATE TABLE `learning_history` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `learning_duration_in_seconds` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `user_uuid` VARCHAR(36) NOT NULL,
    `cls_id` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
