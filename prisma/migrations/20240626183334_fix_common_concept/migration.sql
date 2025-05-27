/*
  Warnings:

  - You are about to drop the column `common_concept_id` on the `common_concept_video` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `common_concept_video` DROP FOREIGN KEY `common_concept_video_common_concept_id_fkey`;

-- AlterTable
ALTER TABLE `common_concept_video` DROP COLUMN `common_concept_id`;
