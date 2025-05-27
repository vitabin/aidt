/*
  Warnings:

  - You are about to drop the column `createdAt` on the `notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `createdAt` ON `notification`;

-- AlterTable
ALTER TABLE `notification` DROP COLUMN `createdAt`,
    ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `read` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `created_at` ON `notification`(`created_at`);
