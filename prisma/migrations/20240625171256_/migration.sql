/*
  Warnings:

  - Added the required column `type` to the `assignment_gave` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `assignment_gave` ADD COLUMN `type` ENUM('BASIC', 'CONFIRM', 'FEEDBACK', 'METACOGNITION') NOT NULL;

-- CreateTable
CREATE TABLE `assignment_problem` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_gave_user_id` INTEGER UNSIGNED NOT NULL,
    `problem_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('IDEL', 'SUBMIT') NOT NULL DEFAULT 'IDEL',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_perform` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_problem_id` INTEGER UNSIGNED NOT NULL,
    `is_correct` TINYINT NOT NULL,
    `confidence` TINYINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `assignment_perform_assignment_problem_id_key`(`assignment_problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assignment_problem` ADD CONSTRAINT `assignment_problem_assignment_gave_user_id_fkey` FOREIGN KEY (`assignment_gave_user_id`) REFERENCES `assignment_gave_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_perform` ADD CONSTRAINT `assignment_perform_assignment_problem_id_fkey` FOREIGN KEY (`assignment_problem_id`) REFERENCES `assignment_problem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
