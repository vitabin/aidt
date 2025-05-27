-- DropForeignKey
ALTER TABLE `problem` DROP FOREIGN KEY `problem_cls_id_fkey`;

-- DropIndex
DROP INDEX `learning_sys_cls_id_key` ON `learning_sys`;
