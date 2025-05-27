/*
  Warnings:

  - You are about to drop the column `school_class_id` on the `learning_map` table. All the data in the column will be lost.
  - Added the required column `learning_map_id` to the `class` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `learning_map` DROP FOREIGN KEY `learning_map_school_class_id_fkey`;

-- AlterTable
ALTER TABLE `class` ADD COLUMN `learning_map_id` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `learning_map` DROP COLUMN `school_class_id`;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_learning_map_id_fkey` FOREIGN KEY (`learning_map_id`) REFERENCES `learning_map`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
