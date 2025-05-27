/*
  Warnings:

  - You are about to drop the column `problem_solving_id` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `solving_user_uuid` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `solving_video_id` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `study_problem_id` on the `shared_solution_video` table. All the data in the column will be lost.
  - You are about to drop the `problem_solving` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `problem_solving_meta` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shared_solution_video_id]` on the table `question` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `problem_solving` DROP FOREIGN KEY `problem_solving_problem_id_fkey`;

-- DropForeignKey
ALTER TABLE `problem_solving_meta` DROP FOREIGN KEY `problem_solving_meta_problem_solving_id_fkey`;

-- DropForeignKey
ALTER TABLE `problem_solving_meta` DROP FOREIGN KEY `problem_solving_meta_school_class_id_fkey`;

-- DropForeignKey
ALTER TABLE `problem_solving_meta` DROP FOREIGN KEY `problem_solving_meta_user_uuid_fkey`;

-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `question_problem_solving_id_fkey`;

-- DropForeignKey
ALTER TABLE `shared_solution_video` DROP FOREIGN KEY `shared_solution_video_study_problem_id_fkey`;

-- AlterTable
ALTER TABLE `question` DROP COLUMN `problem_solving_id`,
    DROP COLUMN `solving_user_uuid`,
    DROP COLUMN `solving_video_id`,
    ADD COLUMN `shared_solution_video_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `shared_solution_video` DROP COLUMN `study_problem_id`,
    ADD COLUMN `problem_id` INTEGER UNSIGNED NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `shared_solution_video_data` ADD COLUMN `pause_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `play_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `watch_time` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `problem_solving`;

-- DropTable
DROP TABLE `problem_solving_meta`;

-- CreateIndex
CREATE UNIQUE INDEX `question_shared_solution_video_id_key` ON `question`(`shared_solution_video_id`);

-- CreateIndex
CREATE INDEX `question_shared_solution_video_id_fkey` ON `question`(`shared_solution_video_id`);

-- AddForeignKey
ALTER TABLE `shared_solution_video` ADD CONSTRAINT `shared_solution_video_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_shared_solution_video_id_fkey` FOREIGN KEY (`shared_solution_video_id`) REFERENCES `shared_solution_video`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
