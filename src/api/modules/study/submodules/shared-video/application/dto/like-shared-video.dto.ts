import { IsBoolean, IsNumber } from 'class-validator';

export class LikeSharedVideoDto {
  @IsNumber()
  concept_video_id!: number;

  @IsBoolean()
  like!: boolean;
}
