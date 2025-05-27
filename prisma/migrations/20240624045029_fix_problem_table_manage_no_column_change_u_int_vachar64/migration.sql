/*
  Warnings:

  - You are about to alter the column `manage_no` on the `problem` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE `problem` MODIFY `manage_no` VARCHAR(64) NULL;
