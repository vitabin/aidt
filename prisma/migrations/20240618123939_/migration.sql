/*
  Warnings:

  - You are about to alter the column `deleted_at` on the `announcement_content` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `type` on the `assessment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1)` to `Enum(EnumId(5))`.
  - You are about to alter the column `deleted_at` on the `concept_reference_comment` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `concept_reference_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `concept_solving` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `concept_video` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `concept_video_comment` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `user_content_comment` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `deleted_at` on the `user_content_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `announcement_content` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `assessment` MODIFY `type` ENUM('NONE', 'DIAGNOSTIC', 'UNIT', 'COMPREHENSIVE') NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE `concept_reference_comment` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `concept_reference_data` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `concept_solving` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `concept_video` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `concept_video_comment` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `user_content_comment` MODIFY `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `user_content_data` MODIFY `deleted_at` DATETIME(0) NULL;
