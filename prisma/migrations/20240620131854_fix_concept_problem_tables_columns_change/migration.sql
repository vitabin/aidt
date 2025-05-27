/*
  Warnings:

  - You are about to drop the column `algeomath` on the `concept` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cls_id,order_no]` on the table `concept` will be added. If there are existing duplicate values, this will fail.
  - Made the column `cls_id` on table `concept` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `concept` DROP COLUMN `algeomath`,
    ADD COLUMN `is_algeomath` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `order_no` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `updated_at` DATETIME(0) NULL,
    MODIFY `cls_id` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `problem` ADD COLUMN `is_algeomath` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_ebs` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `manage_no` INTEGER UNSIGNED NULL,
    ADD COLUMN `updated_at` DATETIME(0) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `concept_cls_id_order_no_key` ON `concept`(`cls_id`, `order_no`);
