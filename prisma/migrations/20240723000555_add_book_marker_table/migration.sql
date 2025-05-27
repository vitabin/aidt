-- CreateTable
CREATE TABLE `book_marker` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(36) NOT NULL,
    `learning_sys_id` INTEGER UNSIGNED NOT NULL,
    `semester` TINYINT NOT NULL,
    `status` TINYINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
