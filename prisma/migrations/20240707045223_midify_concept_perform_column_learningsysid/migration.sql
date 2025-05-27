/*
  Warnings:

  - Added the required column `learning_sys_id` to the `concept_perform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `concept_perform` ADD COLUMN `learning_sys_id` INTEGER UNSIGNED NOT NULL;
