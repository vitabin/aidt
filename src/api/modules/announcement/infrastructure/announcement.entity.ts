import { AnnouncementScope, AnnouncementType, announcement_comment, announcement_content_like, school_class } from "@prisma/client";

export class AnnouncementEntity {
    id!: number;
    uuid!: string;
    school_class_id!: number | null;
    grade!:string | null;
    scope!: AnnouncementScope
    type!: AnnouncementType | null
    title!: string
    content!: string
    publish_start!: Date | null;
    publish_end!: Date | null;
    created_at!: Date;
    updated_at!: Date;
    deleted_at!: Date | null;
}