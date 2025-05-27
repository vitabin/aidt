/*
  Warnings:

  - You are about to drop the column `curriculum` on the `problem` table. All the data in the column will be lost.
  - You are about to alter the column `answer_type` on the `problem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(11)` to `Enum(EnumId(2))`.
  - Made the column `manage_no` on table `problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `problem` DROP COLUMN `curriculum`,
    MODIFY `answer_type` ENUM('SHORT', 'SELECT', 'MULTISELECT', 'ESSAY') NOT NULL DEFAULT 'SHORT',
    MODIFY `manage_no` INTEGER UNSIGNED NOT NULL;
