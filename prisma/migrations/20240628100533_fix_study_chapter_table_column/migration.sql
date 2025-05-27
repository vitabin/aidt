/*
  Warnings:

  - You are about to drop the column `learning_sys_id` on the `study_chapter_plan` table. All the data in the column will be lost.
  - Added the required column `semester_id` to the `study_chapter_plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `learning_sys_id` ON `study_chapter_plan`;

-- AlterTable
ALTER TABLE `study_chapter_plan` DROP COLUMN `learning_sys_id`,
    ADD COLUMN `semester_id` INTEGER UNSIGNED NOT NULL;

-- CreateIndex
CREATE INDEX `semester_id` ON `study_chapter_plan`(`semester_id`);
