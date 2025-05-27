import { IsInt, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentStatus, assignment_perform, problem } from '@prisma/client';

export class AssignmentPerformWithProblemDto {
  @IsOptional()
  assignment_perform?: assignment_perform | null;

  @IsInt()
  id!: number;

  @IsInt()
  assignment_gave_user_id!: number;

  @IsInt()
  problem_id!: number;

  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;

  @IsDate()
  @Type(() => Date)
  created_at!: Date;

  @IsOptional()
  problem?: problem | null;

  @IsOptional()
  learning_sys_fullname?: string | null;
}
