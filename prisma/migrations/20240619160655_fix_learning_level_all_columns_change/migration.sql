/*
  Warnings:

  - You are about to drop the column `level_group` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_0_count` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_0_difficulty` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_1_count` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_1_difficulty` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_2_count` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_2_difficulty` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_3_count` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `lv_3_difficulty` on the `learning_level` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `learning_level` table. All the data in the column will be lost.
  - Added the required column `level_group_id` to the `learning_level` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `learning_level` DROP COLUMN `level_group`,
    DROP COLUMN `lv_0_count`,
    DROP COLUMN `lv_0_difficulty`,
    DROP COLUMN `lv_1_count`,
    DROP COLUMN `lv_1_difficulty`,
    DROP COLUMN `lv_2_count`,
    DROP COLUMN `lv_2_difficulty`,
    DROP COLUMN `lv_3_count`,
    DROP COLUMN `lv_3_difficulty`,
    DROP COLUMN `name`,
    ADD COLUMN `base_lv_high_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `base_lv_highest_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `base_lv_low_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `base_lv_medium_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `level_group_id` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `pre_lv_1_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `pre_lv_2_count` TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN `pre_lv_3_count` TINYINT NOT NULL DEFAULT 0,
    MODIFY `achievement_score_from` TINYINT NOT NULL DEFAULT 0,
    MODIFY `achievement_score_to` TINYINT NOT NULL DEFAULT 0,
    MODIFY `total_quest_count` TINYINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `learning_level_level_group_id_fkey` ON `learning_level`(`level_group_id`);

-- AddForeignKey
ALTER TABLE `learning_level` ADD CONSTRAINT `learning_level_level_group_id_fkey` FOREIGN KEY (`level_group_id`) REFERENCES `learning_level_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
