import { ApiProperty } from '@nestjs/swagger';
import { ProblemSolvingScope } from '@prisma/client';
import { IsNumber, IsString, Min } from 'class-validator';

export class UpdateProblemSolvingVideoDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  problem_id!: number;

  @ApiProperty({ enum: ['CLASS', 'ALL', 'ME'] })
  scope!: ProblemSolvingScope;

  @IsString()
  @ApiProperty()
  video_path!: string;

  private validate(): void {}
}
