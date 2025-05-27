/*
  Warnings:

  - You are about to drop the column `password` on the `admin` table. All the data in the column will be lost.
  - Added the required column `sso_access_token` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sso_id` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sso_refresh_token` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sso_token_expire` to the `admin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `admin` DROP COLUMN `password`,
    ADD COLUMN `sso_access_token` TEXT NOT NULL,
    ADD COLUMN `sso_id` VARCHAR(64) NOT NULL,
    ADD COLUMN `sso_refresh_token` TEXT NOT NULL,
    ADD COLUMN `sso_token_expire` INTEGER UNSIGNED NOT NULL;
