/*
  Warnings:

  - Added the required column `learning_sys_id` to the `study_chapter_plan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `study_chapter_plan` ADD COLUMN `learning_sys_id` INTEGER UNSIGNED NOT NULL;
