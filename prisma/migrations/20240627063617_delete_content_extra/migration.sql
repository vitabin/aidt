/*
  Warnings:

  - You are about to drop the column `content_extra` on the `concept_reference_data` table. All the data in the column will be lost.
  - You are about to drop the column `content_extra_path` on the `concept_reference_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `concept_reference_data` DROP COLUMN `content_extra`,
    DROP COLUMN `content_extra_path`;
