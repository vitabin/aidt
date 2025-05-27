/*
  Warnings:

  - You are about to drop the column `commentary_path` on the `common_concept_video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `common_concept` ADD COLUMN `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `common_concept_video` DROP COLUMN `commentary_path`,
    ADD COLUMN `commentary` TEXT NULL,
    ADD COLUMN `title` TEXT NULL;
