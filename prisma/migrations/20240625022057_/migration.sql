/*
  Warnings:

  - You are about to drop the column `duration_in_minute` on the `assessment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[problem_solving_id]` on the table `question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `duration_in_second` to the `assessment` table without a default value. This is not possible if the table is not empty.
  - Made the column `manage_no` on table `problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `assessment` DROP COLUMN `duration_in_minute`,
    ADD COLUMN `duration_in_second` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `question_problem_solving_id_key` ON `question`(`problem_solving_id`);
