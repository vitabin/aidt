/*
  Warnings:

  - You are about to drop the column `scope` on the `common_concept_video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `common_concept` MODIFY `created_by` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `common_concept_video` DROP COLUMN `scope`,
    MODIFY `status` ENUM('IDLE', 'PROCESSING', 'DONE', 'ERROR') NULL DEFAULT 'IDLE',
    MODIFY `created_by` INTEGER UNSIGNED NULL;
