/*
  Warnings:

  - You are about to drop the `user_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_content_comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_content_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_content_like` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_content` DROP FOREIGN KEY `user_content_class_table_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_content` DROP FOREIGN KEY `user_content_learning_sys_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_content` DROP FOREIGN KEY `user_content_study_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_content_comment` DROP FOREIGN KEY `user_content_comment_user_content_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_content_data` DROP FOREIGN KEY `user_content_data_user_content_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_content_like` DROP FOREIGN KEY `user_content_like_user_content_id_fkey`;

-- DropTable
DROP TABLE `user_content`;

-- DropTable
DROP TABLE `user_content_comment`;

-- DropTable
DROP TABLE `user_content_data`;

-- DropTable
DROP TABLE `user_content_like`;
