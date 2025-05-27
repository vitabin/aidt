-- CreateTable
CREATE TABLE `study_perform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `study_problem_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `solving_start` DATETIME(6) NOT NULL,
    `solving_end` DATETIME(6) NULL,
    `confidence` TINYINT NOT NULL,
    `submission_answer` TEXT NULL,
    `is_correct` TINYINT NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `study_perform` ADD CONSTRAINT `study_perform_study_problem_id_fkey` FOREIGN KEY (`study_problem_id`) REFERENCES `study_problem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
