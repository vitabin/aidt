/*
  Warnings:

  - Made the column `progress_rate` on table `user_study_plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `achievement_level` on table `user_study_plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correct_rate` on table `user_study_plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metarecognition_rate` on table `user_study_plan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user_study_plan` MODIFY `progress_rate` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    MODIFY `achievement_level` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    MODIFY `correct_rate` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    MODIFY `metarecognition_rate` TINYINT UNSIGNED NOT NULL DEFAULT 1;
