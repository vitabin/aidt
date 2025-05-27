-- AlterTable
ALTER TABLE `achievement_region` MODIFY `level_desc` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `achievement_standard` MODIFY `level_desc` TEXT NOT NULL,
    MODIFY `model_desc` TEXT NOT NULL;
