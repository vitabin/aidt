/*
  Warnings:

  - You are about to drop the column `state` on the `learning_history` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `common_concept_video` DROP FOREIGN KEY `common_concept_video_common_concept_id_fkey`;

-- AlterTable
ALTER TABLE `common_concept_video` ADD COLUMN `concept_id` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    MODIFY `common_concept_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `concept` MODIFY `created_by` INTEGER UNSIGNED NULL;

-- AddForeignKey
ALTER TABLE `common_concept_video` ADD CONSTRAINT `common_concept_video_common_concept_id_fkey` FOREIGN KEY (`common_concept_id`) REFERENCES `common_concept`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `common_concept_video` ADD CONSTRAINT `common_concept_video_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
