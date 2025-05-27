/*
  Warnings:

  - A unique constraint covering the columns `[learning_map_id,learning_sys_id]` on the table `learning_map_node` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `learning_map_node_learning_map_id_learning_sys_id_key` ON `learning_map_node`(`learning_map_id`, `learning_sys_id`);
