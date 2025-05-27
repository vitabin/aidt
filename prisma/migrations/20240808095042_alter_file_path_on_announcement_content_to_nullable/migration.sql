/*
  Warnings:

  - Added the required column `scope` to the `question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `announcement_content` MODIFY `file_path` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL;
