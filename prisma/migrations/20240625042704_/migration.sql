-- AlterTable
ALTER TABLE `problem_solving_meta` ADD COLUMN `school_class_id` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `problem_solving_meta` ADD CONSTRAINT `problem_solving_meta_school_class_id_fkey` FOREIGN KEY (`school_class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
