/*
  Warnings:

  - A unique constraint covering the columns `[cls_id]` on the table `learning_sys` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `learning_sys_cls_id_key` ON `learning_sys`(`cls_id`);

-- AddForeignKey
ALTER TABLE `problem` ADD CONSTRAINT `problem_cls_id_fkey` FOREIGN KEY (`cls_id`) REFERENCES `learning_sys`(`cls_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
