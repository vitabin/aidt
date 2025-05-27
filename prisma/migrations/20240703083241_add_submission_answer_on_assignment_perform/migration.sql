/*
  Warnings:

  - Added the required column `submission_answer` to the `assignment_perform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `assignment_perform` ADD COLUMN `submission_answer` TEXT NOT NULL;
