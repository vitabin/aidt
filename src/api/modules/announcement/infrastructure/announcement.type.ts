import { AnnouncementType } from "@prisma/client";

export type Announcement = {
  id: number;

  uuid: string;

  title: string;

  content: string;

  file_path: string | null;

  created_at: Date;

  deleted_at: Date | null;

  updated_at: Date;

  view_count: number;

  type: AnnouncementType | null;

  _count: {
    announcement_content_like: number;
  };
};
