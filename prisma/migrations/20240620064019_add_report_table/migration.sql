/*
  Warnings:

  - You are about to alter the column `learning_map_id` on the `assessment` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedInt`.

*/
-- AlterTable
ALTER TABLE `assessment` MODIFY `learning_map_id` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `report` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL,
    `type` ENUM('CONCENT_VIDEO', 'PROBLEM_SOLVING_VIDEO') NOT NULL,
    `target_id` INTEGER UNSIGNED NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `reason_detail` VARCHAR(255) NULL,
    `admin_pid` INTEGER NULL,
    `status` ENUM('IDLE', 'WORKING', 'DONE', 'REJECT') NOT NULL DEFAULT 'IDLE',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assessment` ADD CONSTRAINT `assessment_learning_map_id_fkey` FOREIGN KEY (`learning_map_id`) REFERENCES `learning_map`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_problem` ADD CONSTRAINT `assessment_problem_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
