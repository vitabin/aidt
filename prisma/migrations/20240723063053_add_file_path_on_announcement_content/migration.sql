/*
  Warnings:

  - Added the required column `file_path` to the `announcement_content` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `announcement_content` ADD COLUMN `file_path` LONGTEXT NOT NULL;
