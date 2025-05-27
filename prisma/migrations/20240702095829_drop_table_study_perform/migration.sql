/*
  Warnings:

  - You are about to drop the `study_perform` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `study_perform` DROP FOREIGN KEY `study_perform_study_problem_id_fkey`;

-- DropTable
DROP TABLE `study_perform`;
