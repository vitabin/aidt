/*
  Warnings:

  - You are about to drop the column `achievement_level` on the `user_achievement` table. All the data in the column will be lost.
  - Added the required column `learning_levelId` to the `user_achievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user_achievement` DROP COLUMN `achievement_level`,
    ADD COLUMN `learning_levelId` INTEGER UNSIGNED NOT NULL;

-- AddForeignKey
ALTER TABLE `user_achievement` ADD CONSTRAINT `user_achievement_learning_levelId_fkey` FOREIGN KEY (`learning_levelId`) REFERENCES `learning_level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
