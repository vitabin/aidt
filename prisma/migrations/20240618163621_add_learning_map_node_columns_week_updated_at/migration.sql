/*
  Warnings:

  - Added the required column `week` to the `learning_map_node` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `learning_map` MODIFY `subject` CHAR(128) NULL;

-- AlterTable
ALTER TABLE `learning_map_node` ADD COLUMN `updated_at` DATETIME(0) NULL,
    ADD COLUMN `week` TINYINT NOT NULL;
