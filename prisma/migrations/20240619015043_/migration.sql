/*
  Warnings:

  - You are about to drop the column `node_ids` on the `assessment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `assessment` DROP COLUMN `node_ids`;

-- CreateTable
CREATE TABLE `assessment_class` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assessment_id` INTEGER UNSIGNED NULL,
    `school_class_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assessment_class` ADD CONSTRAINT `assessment_class_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_class` ADD CONSTRAINT `assessment_class_school_class_id_fkey` FOREIGN KEY (`school_class_id`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
