export class CommentEntity {
  id!: number;
  uuid!: string;
  content!: string;
  created_at!: Date;
  updated_at?: Date | null;
}
