/*
  Warnings:

  - You are about to drop the column `learning_sys_id` on the `problem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `problem_learning_sys_id_fkey` ON `problem`;

-- AlterTable
ALTER TABLE `problem` DROP COLUMN `learning_sys_id`;
