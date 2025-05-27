import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { AccessToken } from 'src/api/modules/transfer/infrastructure';

interface ISchedule {
  class_period: number;
  classroom_name: string;
  day_week: string;
  lecture_code: string;
  school_name: string;
  subject_name: string;
}
export class AuthorizeDto {
  @IsNotEmpty()
  accessToken!: AccessToken;

  @IsString()
  @IsNotEmpty()
  partnerId!: string;

  @IsString()
  @IsOptional()
  school_name?: string;

  @IsNumber()
  @Min(1)
  @Max(2)
  @IsOptional()
  semester?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  schedule_info?: Array<ISchedule>;
}
