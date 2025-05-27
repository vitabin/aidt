import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EProblemDifficulty } from '../../infrastructure/problem.difficulty.enum';
import { Transform } from 'class-transformer';

export class GetProblemsFilterDto {
  @IsString()
  user_uuid!: string;

  @IsString()
  @IsOptional()
  curriculum!: string;

  @IsString()
  @IsOptional()
  unit_id!: string;

  @IsEnum(['LOW', 'MIDDLE', 'HIGH', 'HIGHEST'])
  @IsOptional()
  difficulty!: EProblemDifficulty;

  @IsString()
  @IsOptional()
  answer_type!: string;

  @IsOptional()
  @IsBoolean()
  @Transform((value) => {
    return value.obj.include_deleted === 'true';
  })
  include_deleted!: string;

  @IsOptional()
  @IsNumber()
  page: number = 1;

  @IsNumber()
  take: number = 20;

  @IsBoolean()
  @Transform((value) => {
    return value.obj.include_study === 'true';
  })
  @IsOptional()
  include_study: string = 'false';

  private validate(): void {}
}
