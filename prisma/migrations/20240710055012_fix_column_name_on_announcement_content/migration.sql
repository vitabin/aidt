/*
  Warnings:

  - You are about to drop the column `class_table_id` on the `announcement_content` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `announcement_content` DROP FOREIGN KEY `announcement_content_class_table_id_fkey`;

-- AlterTable
ALTER TABLE `announcement_content` DROP COLUMN `class_table_id`,
    ADD COLUMN `school_class_id` INTEGER UNSIGNED NULL;

-- CreateIndex
CREATE INDEX `announcement_content_class_table_id_fkey` ON `announcement_content`(`school_class_id`);

-- AddForeignKey
ALTER TABLE `announcement_content` ADD CONSTRAINT `announcement_content_school_class_id_fkey` FOREIGN KEY (`school_class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
