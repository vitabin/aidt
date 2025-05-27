-- CreateTable
CREATE TABLE `study_chapter_plan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `progress_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `achievement_level` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `correct_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `metarecognition_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `learning_sys_id`(`learning_sys_id`),
    INDEX `uuid`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
