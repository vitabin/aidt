/*
  Warnings:

  - Made the column `cls_id` on table `problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `problem` MODIFY `cls_id` VARCHAR(20) NOT NULL;
