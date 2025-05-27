/*
  Warnings:

  - You are about to drop the column `learning_levelId` on the `user_achievement` table. All the data in the column will be lost.
  - Added the required column `school_class_id` to the `learning_map` table without a default value. This is not possible if the table is not empty.
  - Made the column `learning_level_id` on table `user_achievement` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `user_achievement` DROP FOREIGN KEY `user_achievement_learning_levelId_fkey`;

-- AlterTable
ALTER TABLE `learning_map` ADD COLUMN `school_class_id` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `user_achievement` DROP COLUMN `learning_levelId`,
    MODIFY `learning_level_id` INTEGER UNSIGNED NOT NULL;

-- AddForeignKey
ALTER TABLE `user_achievement` ADD CONSTRAINT `user_achievement_learning_level_id_fkey` FOREIGN KEY (`learning_level_id`) REFERENCES `learning_level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map` ADD CONSTRAINT `learning_map_school_class_id_fkey` FOREIGN KEY (`school_class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
