-- DropForeignKey
ALTER TABLE `learning_map_node` DROP FOREIGN KEY `learning_map_node_pre_learning_map_id_fkey`;

-- AlterTable
ALTER TABLE `learning_map_node` MODIFY `pre_learning_map_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `learning_sys` ADD COLUMN `pre_learning_map_id` INTEGER UNSIGNED NULL;

-- AddForeignKey
ALTER TABLE `learning_map_node` ADD CONSTRAINT `learning_map_node_pre_learning_map_id_fkey` FOREIGN KEY (`pre_learning_map_id`) REFERENCES `pre_learning_map`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
