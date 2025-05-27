-- CreateTable
CREATE TABLE `user_study_plan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL,
    `semester_id` INTEGER UNSIGNED NOT NULL,
    `progress_rate` TINYINT UNSIGNED NULL,
    `achievement_level` TINYINT UNSIGNED NULL,
    `correct_rate` TINYINT UNSIGNED NULL,
    `metarecognition_rate` TINYINT UNSIGNED NULL,

    INDEX `semester_id`(`semester_id`),
    INDEX `uuid`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `admin_pid` ON `report`(`admin_pid`);

-- CreateIndex
CREATE INDEX `status` ON `report`(`status`);

-- CreateIndex
CREATE INDEX `type` ON `report`(`type`);

-- CreateIndex
CREATE INDEX `uuid` ON `report`(`uuid`);
