/*
  Warnings:

  - You are about to drop the column `concept_status` on the `concept` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `learning_sys` table. All the data in the column will be lost.
  - The values [ESSAY] on the enum `problem_answer_type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `content_status` to the `concept` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `learning_sys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `learning_sys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content_status` to the `problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `concept` DROP COLUMN `concept_status`,
    ADD COLUMN `content_status` ENUM('ACTIVED', 'TEMPSAVE', 'TEMPDELETE', 'DELETED') NOT NULL;

-- AlterTable
ALTER TABLE `learning_sys` DROP COLUMN `subject`,
    ADD COLUMN `grade` TINYINT NOT NULL,
    ADD COLUMN `semester` TINYINT NOT NULL;

-- AlterTable
ALTER TABLE `problem` ADD COLUMN `content_status` ENUM('ACTIVED', 'TEMPSAVE', 'TEMPDELETE', 'DELETED') NOT NULL,
    MODIFY `answer_type` ENUM('SHORT', 'SELECT', 'MULTISELECT') NOT NULL DEFAULT 'SHORT';
