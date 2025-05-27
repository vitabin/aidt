-- CreateTable
CREATE TABLE `problem` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `difficulty` ENUM('LOW', 'MIDDLE', 'HIGH', 'HIGHEST') NOT NULL DEFAULT 'LOW',
    `latex_data` VARCHAR(256) NOT NULL,
    `answer_data` VARCHAR(256) NOT NULL,
    `answer_type` VARCHAR(11) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,
    `curriculum` VARCHAR(11) NOT NULL,

    INDEX `problem_learning_sys_id_fkey`(`learning_sys_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_id` INTEGER NOT NULL,
    `type` ENUM('BASIC', 'CONFIRM', 'FEEDBACK', 'ADDITIONAL') NOT NULL,
    `basic_video` VARCHAR(256) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_problem` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `study_id` INTEGER UNSIGNED NOT NULL,
    `problem_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `study_problem_problem_id_fkey`(`problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_perform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `study_problem_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `solving_start` DATETIME(6) NOT NULL,
    `solving_end` DATETIME(6) NULL,
    `confidence` TINYINT NOT NULL,
    `submission_answer` TEXT NULL,
    `is_correct` TINYINT NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `study_perform_study_problem_id_key`(`study_problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_video` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `video_path` TEXT NOT NULL,
    `status` ENUM('IDLE', 'PROCESSING', 'DONE', 'ERROR') NOT NULL,
    `concept_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `concept_video_learning_sys_id_fkey`(`learning_sys_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_video_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `like_count` INTEGER NOT NULL,
    `view_count` INTEGER NOT NULL,
    `concept_video_id` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `concept_video_data_concept_video_id_key`(`concept_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_video_like` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_video_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `concept_video_like_concept_video_id_fkey`(`concept_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_video_comment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_video_data_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `content` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,

    INDEX `concept_video_comment_concept_video_data_id_fkey`(`concept_video_data_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_video_share` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_video_id` INTEGER UNSIGNED NOT NULL,
    `class_table_id` INTEGER UNSIGNED NOT NULL,
    `pinned` BOOLEAN NOT NULL,

    UNIQUE INDEX `concept_video_share_concept_video_id_key`(`concept_video_id`),
    INDEX `concept_video_share_class_table_id_fkey`(`class_table_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(1) NOT NULL,
    `learning_map_id` INTEGER NULL,
    `node_ids` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `begun_at` DATETIME(0) NULL,
    `ended_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `user_uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',
    `learning_map_id` INTEGER UNSIGNED NULL,
    `current_learning_node_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievement` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `is_force_apply` BOOLEAN NOT NULL,
    `achievement_level` TINYINT NOT NULL,
    `learning_map_id` INTEGER UNSIGNED NOT NULL,
    `learning_map_node_id` INTEGER UNSIGNED NULL,
    `learning_sys_id` INTEGER UNSIGNED NULL,
    `learning_level_group_id` INTEGER UNSIGNED NULL,
    `learning_level_id` INTEGER UNSIGNED NULL,
    `achievement_type` ENUM('NONE', 'DIAGNOSTIC', 'UNIT_PROGRESS', 'UNIT_END', 'COMPREHENSIVE') NOT NULL DEFAULT 'NONE',
    `achievement_score` TINYINT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_group` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(1) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `study_id` INTEGER UNSIGNED NOT NULL,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `class_table_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_content_class_table_id_fkey`(`class_table_id`),
    INDEX `user_content_learning_sys_id_fkey`(`learning_sys_id`),
    INDEX `user_content_study_id_fkey`(`study_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_content_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_content_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NOT NULL,
    `content_title` VARCHAR(191) NOT NULL,
    `content_data` VARCHAR(191) NOT NULL,
    `content_extra` VARCHAR(191) NOT NULL,
    `content_extra_path` VARCHAR(191) NOT NULL,
    `like_count` INTEGER NOT NULL,
    `view_count` INTEGER NOT NULL,

    UNIQUE INDEX `user_content_data_user_content_id_key`(`user_content_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_content_like` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_content_id` INTEGER NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_content_like_user_content_id_fkey`(`user_content_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_content_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_content_id` INTEGER NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_content_comment_user_content_id_fkey`(`user_content_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL,
    `class_table_id` INTEGER UNSIGNED NULL,
    `grade` CHAR(2) NULL,
    `scope` ENUM('ALL', 'STUDENTS', 'PARENTS') NOT NULL,
    `type` ENUM('MAINTENANCE', 'EMERGENCY', 'ETC') NULL,
    `title` TEXT NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `publish_start` DATETIME(3) NULL,
    `publish_end` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `announcement_content_class_table_id_fkey`(`class_table_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `comment_data` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `announcement_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_content_like` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `announcement_commentId` INTEGER NULL,
    `announcement_content_id` INTEGER NOT NULL,

    INDEX `announcement_content_like_announcement_commentId_fkey`(`announcement_commentId`),
    INDEX `announcement_content_like_announcement_content_id_fkey`(`announcement_content_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_level` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `level` TINYINT NOT NULL,
    `level_group` INTEGER UNSIGNED NOT NULL,
    `achievement_score_from` TINYINT NOT NULL,
    `achievement_score_to` TINYINT NOT NULL,
    `total_quest_count` TINYINT NOT NULL,
    `lv_0_count` TINYINT NOT NULL,
    `lv_0_difficulty` TINYINT NOT NULL,
    `lv_1_count` TINYINT NOT NULL,
    `lv_1_difficulty` TINYINT NOT NULL,
    `lv_2_count` TINYINT NOT NULL,
    `lv_2_difficulty` TINYINT NOT NULL,
    `lv_3_count` TINYINT NOT NULL,
    `lv_3_difficulty` TINYINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_level_group` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_map_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_solving` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `problem_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `video_path` TEXT NULL,
    `status` ENUM('IDLE', 'SAVED', 'DELETED') NOT NULL DEFAULT 'IDLE',
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL DEFAULT 'CLASS',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `problem_solving_problem_id_fkey`(`problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_solving_meta` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `problem_solving_id` INTEGER UNSIGNED NOT NULL,
    `play_count` INTEGER UNSIGNED NULL DEFAULT 0,
    `pause_count` INTEGER UNSIGNED NULL DEFAULT 0,
    `watching_time` INTEGER UNSIGNED NULL DEFAULT 0,

    UNIQUE INDEX `problem_solving_meta_problem_solving_id_key`(`problem_solving_id`),
    INDEX `problem_solving_meta_problem_solving_id_fkey`(`problem_solving_id`),
    INDEX `problem_solving_meta_user_uuid_fkey`(`user_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `problem_id` INTEGER UNSIGNED NOT NULL,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('IDLE', 'QUESTION', 'SOLVING') NOT NULL DEFAULT 'IDLE',
    `solving_video_id` INTEGER NULL,
    `question_user_uuid` VARCHAR(36) NOT NULL,
    `solving_user_uuid` VARCHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,
    `title` TEXT NOT NULL,
    `problem_solving_id` INTEGER UNSIGNED NULL,

    INDEX `question_problem_id_fkey`(`problem_id`),
    INDEX `question_learning_sys_id_fkey`(`learning_sys_id`),
    INDEX `question_problem_solving_id_fkey`(`problem_solving_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `std_learning_sys_pack` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cls_id` VARCHAR(20) NULL,
    `name` VARCHAR(255) NOT NULL,
    `publish_at` DATETIME(0) NOT NULL,
    `desc` VARCHAR(255) NULL,
    `is_activate` BOOLEAN NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `std_learning_sys_pack_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `std_learning_sys_doc` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `std_learning_sys_pack_id` INTEGER UNSIGNED NOT NULL,
    `cls_id` VARCHAR(20) NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `careted_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `std_learning_sys_doc_std_learning_sys_pack_id_name_key`(`std_learning_sys_pack_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `std_learning_sys` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `std_learning_sys_doc_id` INTEGER UNSIGNED NOT NULL,
    `cls_id` VARCHAR(20) NULL,
    `type` TINYINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `achievement_id` VARCHAR(20) NULL,
    `achievement_desc` VARCHAR(255) NULL,
    `grade` CHAR(2) NOT NULL,
    `std_learning_sys_id` INTEGER UNSIGNED NULL,
    `subject_main` VARCHAR(255) NOT NULL,
    `subject_sub` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `std_learning_sys_std_learning_sys_id_fkey`(`std_learning_sys_id`),
    UNIQUE INDEX `std_learning_sys_std_learning_sys_doc_id_type_name_key`(`std_learning_sys_doc_id`, `type`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_sys_pack` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `std_learning_sys_pack_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `desc` VARCHAR(255) NULL,
    `is_activate` BOOLEAN NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `learning_sys_pack_name_key`(`name`),
    INDEX `learning_sys_pack_std_learning_sys_pack_id_fkey`(`std_learning_sys_pack_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_sys_doc` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_pack_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `desc` VARCHAR(255) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `learning_sys_doc_learning_sys_pack_id_name_key`(`learning_sys_pack_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_sys` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_doc_id` INTEGER UNSIGNED NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `cls_id` VARCHAR(20) NULL,
    `type` ENUM('UNIT', 'CHAPTER', 'SECTION', 'SUBSECTION') NOT NULL DEFAULT 'UNIT',
    `index` TINYINT NULL,
    `name` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `achievement_desc` VARCHAR(255) NULL,
    `achievement_id` VARCHAR(20) NULL,
    `learning_sys_id` INTEGER UNSIGNED NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `learning_sys_full_name_key`(`full_name`),
    INDEX `learning_sys_learning_sys_id_fkey`(`learning_sys_id`),
    UNIQUE INDEX `learning_sys_learning_sys_doc_id_full_name_key`(`learning_sys_doc_id`, `full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pre_learning_map` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `cls_id` VARCHAR(20) NULL,
    `lv1_cls_id` VARCHAR(20) NULL,
    `lv2_cls_id` VARCHAR(20) NULL,
    `lv3_cls_id` VARCHAR(20) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `pre_learning_map_learning_sys_id_key`(`learning_sys_id`),
    INDEX `pre_learning_map_learning_sys_id_fkey`(`learning_sys_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_map` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_doc_id` INTEGER UNSIGNED NOT NULL,
    `semester_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `subject` CHAR(128) NOT NULL,
    `desc` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `learning_map_semester_id_fkey`(`semester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_map_node` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_map_id` INTEGER UNSIGNED NOT NULL,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `pre_learning_map_id` INTEGER UNSIGNED NOT NULL,
    `link_prev` INTEGER NULL,
    `link_next` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `learning_map_node_learning_sys_id_fkey`(`learning_sys_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `year` CHAR(4) NOT NULL,
    `grade` CHAR(2) NOT NULL,
    `semester` CHAR(1) NOT NULL,
    `begin_date` DATETIME(0) NOT NULL,
    `end_date` DATETIME(0) NOT NULL,
    `desc` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `school_id` INTEGER UNSIGNED NOT NULL,
    `grade` CHAR(2) NULL,
    `class` VARCHAR(128) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `class_school_id_fkey`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_schedule` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER UNSIGNED NOT NULL,
    `day_week` VARCHAR(1) NULL,
    `class_period` VARCHAR(2) NULL,
    `subject_name` VARCHAR(128) NULL,
    `classroom_name` VARCHAR(128) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `class_schedule_class_id_fkey`(`class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `school_id` VARCHAR(10) NULL,
    `school_name` VARCHAR(128) NULL,
    `division_type` VARCHAR(10) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_finish` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `assignment_gave_id` INTEGER UNSIGNED NOT NULL,
    `finished_at` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `assignment_finish_user_uuid_fkey`(`user_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_gave` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `learning_map_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `given_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `assignment_gave_learning_sys_id_fkey`(`learning_sys_id`),
    INDEX `assignment_gave_user_uuid_fkey`(`user_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_gave_node` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_gave_id` INTEGER UNSIGNED NOT NULL,
    `node_id` INTEGER UNSIGNED NOT NULL,

    INDEX `assignment_gave_id`(`assignment_gave_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_gave_user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_gave_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',

    INDEX `assignment_gave_id`(`assignment_gave_id`),
    INDEX `assignment_gave_user_user_uuid_fkey`(`user_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_perform` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `assessment_problem_id` INTEGER UNSIGNED NOT NULL,
    `solving_start` DATETIME(0) NULL,
    `solving_end` DATETIME(0) NULL,
    `submission_answer` TEXT NOT NULL,
    `is_correct` TINYINT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_problem` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assessment_id` INTEGER UNSIGNED NOT NULL,
    `problem_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `pid` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `email` VARCHAR(64) NOT NULL,
    `password` VARCHAR(128) NOT NULL,
    `division` VARCHAR(64) NOT NULL,
    `admin_group_id` INTEGER NOT NULL,
    `period_start` DATETIME(0) NOT NULL,
    `period_end` DATETIME(0) NOT NULL,
    `is_delete` BOOLEAN NOT NULL DEFAULT false,
    `delete_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `login_fail_cnt` TINYINT NOT NULL DEFAULT 0,

    UNIQUE INDEX `email`(`email`),
    INDEX `admin_admin_group_pid_fk`(`admin_group_id`),
    PRIMARY KEY (`pid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_create_history` (
    `pid` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `password` VARCHAR(128) NULL,
    `email` VARCHAR(64) NOT NULL,
    `division` VARCHAR(64) NOT NULL,
    `admin_id` INTEGER NULL,
    `admin_group_id` INTEGER NOT NULL,
    `proc_type` TINYINT NOT NULL,
    `proc_status` TINYINT NOT NULL,
    `proc_datetime` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `admin_create_history_admin_group_pid_fk`(`admin_group_id`),
    INDEX `admin_create_history_admin_pid_fk`(`admin_id`),
    PRIMARY KEY (`pid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_function` (
    `pid` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `desc` VARCHAR(256) NULL,
    `is_delete` BOOLEAN NOT NULL DEFAULT false,
    `delete_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`pid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_function_on_admin_group` (
    `admin_group_id` INTEGER NOT NULL,
    `admin_function_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_function_on_admin_group_admin_function_id_fkey`(`admin_function_id`),
    PRIMARY KEY (`admin_group_id`, `admin_function_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_group` (
    `pid` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(63) NOT NULL,
    `is_delete` BOOLEAN NOT NULL DEFAULT false,
    `delete_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`pid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_plan_note` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',
    `dream_jobs` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_uuid`(`user_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('BASIC', 'ADVANCED') NOT NULL,
    `type_name` VARCHAR(128) NOT NULL,
    `latex_data` TEXT NOT NULL,
    `concept_status` ENUM('ACTIVED', 'TEMPSAVE', 'TEMPDELETE', 'DELETED') NOT NULL,
    `algeomath` TINYINT NOT NULL,
    `created_by` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `concept_learning_sys_id_fkey`(`learning_sys_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_perform` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `concept_perform_concept_id_fkey`(`concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_solving` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `video_path` TEXT NOT NULL,
    `status` ENUM('IDLE', 'PROCESSING', 'DONE', 'ERROR') NOT NULL DEFAULT 'IDLE',
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(3) NOT NULL,

    INDEX `concept_solving_concept_id_fkey`(`concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_solving_share` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_video_id` INTEGER UNSIGNED NOT NULL,
    `class_table_id` INTEGER UNSIGNED NOT NULL,

    INDEX `concept_solving_share_concept_solving_id_fkey`(`concept_video_id`),
    INDEX `concept_solving_share_school_class_id_fkey`(`class_table_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_reference` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NOT NULL DEFAULT 'UUID',
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `concept_id` INTEGER UNSIGNED NOT NULL,
    `scope` ENUM('ME', 'CLASS', 'ALL') NOT NULL,
    `class_table_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `concept_reference_class_table_id_fkey`(`class_table_id`),
    INDEX `concept_reference_learning_sys_id_fkey`(`learning_sys_id`),
    INDEX `concept_reference_study_id_fkey`(`concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_reference_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_reference_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NOT NULL,
    `content_title` VARCHAR(191) NOT NULL,
    `content_data` VARCHAR(191) NOT NULL,
    `content_extra` VARCHAR(191) NOT NULL,
    `content_extra_path` VARCHAR(191) NOT NULL,
    `like_count` INTEGER NOT NULL,
    `view_count` INTEGER NOT NULL,

    UNIQUE INDEX `concept_reference_data_concept_reference_id_key`(`concept_reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_reference_like` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_reference_id` INTEGER UNSIGNED NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `concept_reference_like_concept_reference_id_fkey`(`concept_reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concept_reference_comment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `concept_reference_id` INTEGER UNSIGNED NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `user_uuid` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `concept_reference_comment_concept_reference_id_fkey`(`concept_reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `problem` ADD CONSTRAINT `problem_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_problem` ADD CONSTRAINT `study_problem_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_problem` ADD CONSTRAINT `study_problem_study_id_fkey` FOREIGN KEY (`study_id`) REFERENCES `study`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_perform` ADD CONSTRAINT `study_perform_study_problem_id_fkey` FOREIGN KEY (`study_problem_id`) REFERENCES `study_problem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video` ADD CONSTRAINT `concept_video_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video` ADD CONSTRAINT `concept_video_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video_data` ADD CONSTRAINT `concept_video_data_concept_video_id_fkey` FOREIGN KEY (`concept_video_id`) REFERENCES `concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video_like` ADD CONSTRAINT `concept_video_like_concept_video_id_fkey` FOREIGN KEY (`concept_video_id`) REFERENCES `concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video_comment` ADD CONSTRAINT `concept_video_comment_concept_video_data_id_fkey` FOREIGN KEY (`concept_video_data_id`) REFERENCES `concept_video_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video_share` ADD CONSTRAINT `concept_video_share_class_table_id_fkey` FOREIGN KEY (`class_table_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_video_share` ADD CONSTRAINT `concept_video_share_concept_video_id_fkey` FOREIGN KEY (`concept_video_id`) REFERENCES `concept_video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content` ADD CONSTRAINT `user_content_class_table_id_fkey` FOREIGN KEY (`class_table_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content` ADD CONSTRAINT `user_content_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content` ADD CONSTRAINT `user_content_study_id_fkey` FOREIGN KEY (`study_id`) REFERENCES `study`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content_data` ADD CONSTRAINT `user_content_data_user_content_id_fkey` FOREIGN KEY (`user_content_id`) REFERENCES `user_content`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content_like` ADD CONSTRAINT `user_content_like_user_content_id_fkey` FOREIGN KEY (`user_content_id`) REFERENCES `user_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_content_comment` ADD CONSTRAINT `user_content_comment_user_content_id_fkey` FOREIGN KEY (`user_content_id`) REFERENCES `user_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_content` ADD CONSTRAINT `announcement_content_class_table_id_fkey` FOREIGN KEY (`class_table_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_comment` ADD CONSTRAINT `announcement_comment_id_fkey` FOREIGN KEY (`id`) REFERENCES `announcement_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_content_like` ADD CONSTRAINT `announcement_content_like_announcement_commentId_fkey` FOREIGN KEY (`announcement_commentId`) REFERENCES `announcement_comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_content_like` ADD CONSTRAINT `announcement_content_like_announcement_content_id_fkey` FOREIGN KEY (`announcement_content_id`) REFERENCES `announcement_content`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_solving` ADD CONSTRAINT `problem_solving_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_solving_meta` ADD CONSTRAINT `problem_solving_meta_problem_solving_id_fkey` FOREIGN KEY (`problem_solving_id`) REFERENCES `problem_solving`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_solving_meta` ADD CONSTRAINT `problem_solving_meta_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`user_uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_problem_solving_id_fkey` FOREIGN KEY (`problem_solving_id`) REFERENCES `problem_solving`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `std_learning_sys_doc` ADD CONSTRAINT `std_learning_sys_doc_std_learning_sys_pack_id_fkey` FOREIGN KEY (`std_learning_sys_pack_id`) REFERENCES `std_learning_sys_pack`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `std_learning_sys` ADD CONSTRAINT `std_learning_sys_std_learning_sys_doc_id_fkey` FOREIGN KEY (`std_learning_sys_doc_id`) REFERENCES `std_learning_sys_doc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `std_learning_sys` ADD CONSTRAINT `std_learning_sys_std_learning_sys_id_fkey` FOREIGN KEY (`std_learning_sys_id`) REFERENCES `std_learning_sys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_sys_pack` ADD CONSTRAINT `learning_sys_pack_std_learning_sys_pack_id_fkey` FOREIGN KEY (`std_learning_sys_pack_id`) REFERENCES `std_learning_sys_pack`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_sys_doc` ADD CONSTRAINT `learning_sys_doc_learning_sys_pack_id_fkey` FOREIGN KEY (`learning_sys_pack_id`) REFERENCES `learning_sys_pack`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_sys` ADD CONSTRAINT `learning_sys_learning_sys_doc_id_fkey` FOREIGN KEY (`learning_sys_doc_id`) REFERENCES `learning_sys_doc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_sys` ADD CONSTRAINT `learning_sys_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_learning_map` ADD CONSTRAINT `pre_learning_map_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map` ADD CONSTRAINT `learning_map_learning_sys_doc_id_fkey` FOREIGN KEY (`learning_sys_doc_id`) REFERENCES `learning_sys_doc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map` ADD CONSTRAINT `learning_map_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map_node` ADD CONSTRAINT `learning_map_node_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map_node` ADD CONSTRAINT `learning_map_node_learning_map_id_fkey` FOREIGN KEY (`learning_map_id`) REFERENCES `learning_map`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_map_node` ADD CONSTRAINT `learning_map_node_pre_learning_map_id_fkey` FOREIGN KEY (`pre_learning_map_id`) REFERENCES `pre_learning_map`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `school`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_schedule` ADD CONSTRAINT `class_schedule_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_finish` ADD CONSTRAINT `assignment_finish_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`user_uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_gave` ADD CONSTRAINT `assignment_gave_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_gave` ADD CONSTRAINT `assignment_gave_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`user_uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_gave_node` ADD CONSTRAINT `assignment_gave_node_assignment_gave_id_fkey` FOREIGN KEY (`assignment_gave_id`) REFERENCES `assignment_gave`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_gave_user` ADD CONSTRAINT `assignment_gave_user_assignment_gave_id_fkey` FOREIGN KEY (`assignment_gave_id`) REFERENCES `assignment_gave`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_gave_user` ADD CONSTRAINT `assignment_gave_user_user_uuid_fkey` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`user_uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_perform` ADD CONSTRAINT `assessment_perform_assessment_problem_id_fkey` FOREIGN KEY (`assessment_problem_id`) REFERENCES `assessment_problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_problem` ADD CONSTRAINT `assessment_problem_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_admin_group_pid_fk` FOREIGN KEY (`admin_group_id`) REFERENCES `admin_group`(`pid`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `admin_create_history` ADD CONSTRAINT `admin_create_history_admin_group_pid_fk` FOREIGN KEY (`admin_group_id`) REFERENCES `admin_group`(`pid`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `admin_create_history` ADD CONSTRAINT `admin_create_history_admin_pid_fk` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`pid`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `admin_function_on_admin_group` ADD CONSTRAINT `admin_function_on_admin_group_admin_function_id_fkey` FOREIGN KEY (`admin_function_id`) REFERENCES `admin_function`(`pid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_function_on_admin_group` ADD CONSTRAINT `admin_function_on_admin_group_admin_group_id_fkey` FOREIGN KEY (`admin_group_id`) REFERENCES `admin_group`(`pid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_plan_note` ADD CONSTRAINT `user_plan_note_ibfk_1` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`user_uuid`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `concept` ADD CONSTRAINT `concept_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_perform` ADD CONSTRAINT `concept_perform_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_solving` ADD CONSTRAINT `concept_solving_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference` ADD CONSTRAINT `concept_reference_class_table_id_fkey` FOREIGN KEY (`class_table_id`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference` ADD CONSTRAINT `concept_reference_learning_sys_id_fkey` FOREIGN KEY (`learning_sys_id`) REFERENCES `learning_sys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference` ADD CONSTRAINT `concept_reference_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference_data` ADD CONSTRAINT `concept_reference_data_concept_reference_id_fkey` FOREIGN KEY (`concept_reference_id`) REFERENCES `concept_reference`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference_like` ADD CONSTRAINT `concept_reference_like_concept_reference_id_fkey` FOREIGN KEY (`concept_reference_id`) REFERENCES `concept_reference`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_reference_comment` ADD CONSTRAINT `concept_reference_comment_concept_reference_id_fkey` FOREIGN KEY (`concept_reference_id`) REFERENCES `concept_reference`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
