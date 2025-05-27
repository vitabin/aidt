/*
  Warnings:

  - You are about to drop the column `learning_sys_id` on the `concept` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `concept` DROP FOREIGN KEY `concept_learning_sys_id_fkey`;

-- DropForeignKey
ALTER TABLE `problem` DROP FOREIGN KEY `problem_learning_sys_id_fkey`;

-- AlterTable
ALTER TABLE `concept` DROP COLUMN `learning_sys_id`,
    ADD COLUMN `cls_id` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `problem` ADD COLUMN `cls_id` VARCHAR(20) NULL,
    ADD COLUMN `type` ENUM('GENERAL', 'DIAGNOSTIC', 'UNIT_PROGRESS', 'UNIT_END') NOT NULL DEFAULT 'GENERAL';
