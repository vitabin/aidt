-- CreateTable
CREATE TABLE `common_concept_video_play` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `common_concept_video_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ended_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `common_concept_video_play` ADD CONSTRAINT `common_concept_video_play_common_concept_video_id_fkey` FOREIGN KEY (`common_concept_video_id`) REFERENCES `common_concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
