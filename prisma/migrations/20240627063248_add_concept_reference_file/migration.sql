-- CreateTable
CREATE TABLE `concept_reference_file` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `path` VARCHAR(191) NOT NULL,
    `concept_reference_data_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `concept_reference_file` ADD CONSTRAINT `concept_reference_file_concept_reference_data_id_fkey` FOREIGN KEY (`concept_reference_data_id`) REFERENCES `concept_reference_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
