-- CreateTable
CREATE TABLE `shared_solution_video` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `study_problem_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `video_path` TEXT NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_solution_video_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `like_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `view_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shared_solution_video_id` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `shared_solution_video_data_shared_solution_video_id_key`(`shared_solution_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_solution_video_like` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `shared_solution_video_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_solution_video_comment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `content` TEXT NOT NULL,
    `deleted_at` DATETIME(0) NULL,
    `shared_solution_video_id` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_solution_video_share` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `shared_solution_video_id` INTEGER UNSIGNED NOT NULL,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `pinned` BOOLEAN NOT NULL,
    `school_class_id` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `shared_solution_video_share_shared_solution_video_id_key`(`shared_solution_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shared_solution_video` ADD CONSTRAINT `shared_solution_video_study_problem_id_fkey` FOREIGN KEY (`study_problem_id`) REFERENCES `study_problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_solution_video_data` ADD CONSTRAINT `shared_solution_video_data_shared_solution_video_id_fkey` FOREIGN KEY (`shared_solution_video_id`) REFERENCES `shared_solution_video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_solution_video_like` ADD CONSTRAINT `shared_solution_video_like_shared_solution_video_id_fkey` FOREIGN KEY (`shared_solution_video_id`) REFERENCES `shared_solution_video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_solution_video_comment` ADD CONSTRAINT `shared_solution_video_comment_shared_solution_video_id_fkey` FOREIGN KEY (`shared_solution_video_id`) REFERENCES `shared_solution_video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_solution_video_share` ADD CONSTRAINT `shared_solution_video_share_school_class_id_fkey` FOREIGN KEY (`school_class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_solution_video_share` ADD CONSTRAINT `shared_solution_video_share_shared_solution_video_id_fkey` FOREIGN KEY (`shared_solution_video_id`) REFERENCES `shared_solution_video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
