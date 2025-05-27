/*
  Warnings:

  - You are about to drop the column `study_problem_id` on the `study_perform` table. All the data in the column will be lost.

*/
-- CreateIndex
CREATE INDEX `learning_map_node_learning_map_id_fkey` ON `learning_map_node`(`learning_map_id`);
