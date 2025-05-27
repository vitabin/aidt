-- CreateTable
CREATE TABLE `achievement_standard` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `achievement_id` VARCHAR(20) NOT NULL,
    `achievement_desc` VARCHAR(255) NOT NULL,
    `eval_model` ENUM('SHORT_SELECT', 'SHORT', 'SELECT') NOT NULL DEFAULT 'SHORT_SELECT',
    `achievement_level` ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
    `level_desc` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievement_region` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `achievement_id` VARCHAR(20) NOT NULL,
    `region_name` VARCHAR(255) NOT NULL,
    `achievement_level` ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
    `eval_category` ENUM('KU', 'PF', 'VA') NOT NULL,
    `level_desc` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
