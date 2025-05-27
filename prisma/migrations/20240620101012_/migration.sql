/*
  Warnings:

  - You are about to drop the column `ended_at` on the `assessment` table. All the data in the column will be lost.
  - Added the required column `duration_in_minute` to the `assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `assessment` DROP COLUMN `ended_at`,
    ADD COLUMN `duration_in_minute` INTEGER NOT NULL;
