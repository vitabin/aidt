/*
  Warnings:

  - You are about to drop the column `learning_sys_id` on the `concept_video` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `concept_video` DROP FOREIGN KEY `concept_video_learning_sys_id_fkey`;

-- AlterTable
ALTER TABLE `concept_video` DROP COLUMN `learning_sys_id`;

-- CreateTable
CREATE TABLE `common_concept` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cls_id` VARCHAR(20) NOT NULL,
    `type` ENUM('BASIC', 'ADVANCED') NOT NULL,
    `order_no` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type_name` VARCHAR(128) NOT NULL,
    `latex_data` TEXT NOT NULL,
    `content_status` ENUM('ACTIVED', 'TEMPSAVE', 'TEMPDELETE', 'DELETED') NOT NULL,
    `is_algeomath` BOOLEAN NOT NULL DEFAULT false,
    `created_by` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `common_concept_cls_id_order_no_key`(`cls_id`, `order_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `common_concept_video` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `common_concept_id` INTEGER UNSIGNED NOT NULL,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `video_path` TEXT NULL,
    `subtitle_path` TEXT NULL,
    `commentary_path` TEXT NULL,
    `sign_video_path` TEXT NULL,
    `status` ENUM('IDLE', 'PROCESSING', 'DONE', 'ERROR') NOT NULL,
    `created_by` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(0) NULL,

    INDEX `common_concept_video_common_concept_id_fkey`(`common_concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `common_concept_video_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `like_count` INTEGER NOT NULL,
    `view_count` INTEGER NOT NULL,
    `common_concept_video_id` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `common_concept_video_data_common_concept_video_id_key`(`common_concept_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `common_concept_video_like` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `common_concept_video_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `common_concept_video_like_common_concept_video_id_fkey`(`common_concept_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `common_concept_video_comment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `common_concept_video_data_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(0) NULL,
    `content` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,

    INDEX `common_concept_video_comment_common_concept_video_data_id_fkey`(`common_concept_video_data_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `common_concept_video` ADD CONSTRAINT `common_concept_video_common_concept_id_fkey` FOREIGN KEY (`common_concept_id`) REFERENCES `common_concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `common_concept_video_data` ADD CONSTRAINT `common_concept_video_data_common_concept_video_id_fkey` FOREIGN KEY (`common_concept_video_id`) REFERENCES `common_concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `common_concept_video_like` ADD CONSTRAINT `common_concept_video_like_common_concept_video_id_fkey` FOREIGN KEY (`common_concept_video_id`) REFERENCES `common_concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `common_concept_video_comment` ADD CONSTRAINT `common_concept_video_comment_common_concept_video_data_id_fkey` FOREIGN KEY (`common_concept_video_data_id`) REFERENCES `common_concept_video_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
