/*
  Warnings:

  - A unique constraint covering the columns `[common_concept_id]` on the table `common_concept_video` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `common_concept_video_common_concept_id_key` ON `common_concept_video`(`common_concept_id`);
