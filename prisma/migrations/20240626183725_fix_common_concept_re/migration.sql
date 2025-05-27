/*
  Warnings:

  - Added the required column `common_concept_id` to the `common_concept_video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `common_concept_video` ADD COLUMN `common_concept_id` INTEGER UNSIGNED NOT NULL;

-- AddForeignKey
ALTER TABLE `common_concept_video` ADD CONSTRAINT `common_concept_video_common_concept_id_fkey` FOREIGN KEY (`common_concept_id`) REFERENCES `common_concept`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
