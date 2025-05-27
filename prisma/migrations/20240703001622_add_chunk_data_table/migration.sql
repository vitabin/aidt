-- CreateTable
CREATE TABLE `chunk_format_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `chunk_index` INTEGER UNSIGNED NOT NULL,
    `chunk_data` TEXT NOT NULL,
    `chunk_size` VARCHAR(36) NOT NULL,
    `transfer_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
