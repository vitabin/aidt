-- AlterTable
ALTER TABLE `user_study_plan` MODIFY `progress_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `achievement_level` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `correct_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `metarecognition_rate` TINYINT UNSIGNED NOT NULL DEFAULT 0;
