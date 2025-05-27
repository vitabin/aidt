/*
  Warnings:

  - You are about to drop the column `learning_duration_in_seconds` on the `learning_history` table. All the data in the column will be lost.
  - Added the required column `state` to the `learning_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `learning_history` DROP COLUMN `learning_duration_in_seconds`,
    ADD COLUMN `state` ENUM('Initialized', 'Terminated') NOT NULL;
