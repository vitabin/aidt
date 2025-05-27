import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export class CreateAssessmentPerformResponseDto {
  @IsNumber()
  assessment_perform_id!: number;

  @IsBoolean()
  @Transform((value) => {
    return value.obj.already_created === 'true';
  })
  already_created!: boolean;
}
