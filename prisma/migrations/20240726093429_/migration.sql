/*
 Warnings:
 
 - You are about to drop the `user_study_plan` table. If the table is not empty, all the data it contains will be lost.
 - A unique constraint covering the columns `[achievement_id,achievement_level,eval_category]` on the table `achievement_region` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[achievement_id,eval_model,achievement_level]` on the table `achievement_standard` will be added. If there are existing duplicate values, this will fail.
 - Added the required column `model_desc` to the `achievement_standard` table without a default value. This is not possible if the table is not empty.
 
 */
-- DropForeignKey
ALTER TABLE
  `announcement_comment` DROP FOREIGN KEY `announcement_comment_id_fkey`;

-- AlterTable
ALTER TABLE
  `achievement_standard`
ADD
  COLUMN `model_desc` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE
  `announcement_content`
ADD
  COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE
  `study_chapter_plan`
MODIFY
  `learning_sys_id` INTEGER UNSIGNED NULL;

-- DropTable
DROP TABLE `user_study_plan`;

-- CreateIndex
CREATE UNIQUE INDEX `achievement_region_achievement_id_achievement_level_eval_cat_key` ON `achievement_region`(
  `achievement_id`,
  `achievement_level`,
  `eval_category`
);

-- CreateIndex
CREATE UNIQUE INDEX `achievement_standard_achievement_id_eval_model_achievement_l_key` ON `achievement_standard`(
  `achievement_id`,
  `eval_model`,
  `achievement_level`
);

-- AddForeignKey
ALTER TABLE
  `announcement_comment`
ADD
  CONSTRAINT `announcement_comment_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcement_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
