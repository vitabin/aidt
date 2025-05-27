import { IsNumber, IsString } from 'class-validator';

export class UserPlanNoteDto {
  @IsNumber()
  id!: number;

  @IsString()
  uuid!: string;

  @IsNumber()
  semester_id?: number | null;

  @IsNumber()
  progress_rate!: number;

  @IsNumber()
  achievement_level!: number;

  @IsNumber()
  correct_rate!: number;

  @IsNumber()
  metarecognition_rate!: number;

  dream?: {
    id: number;
    user_uuid: string;
    dream_jobs: string | null;
    dream_reason: string | null;
    created_at: Date | null;
  } | null;
}
