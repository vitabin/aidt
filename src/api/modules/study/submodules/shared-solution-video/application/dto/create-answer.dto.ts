import { ApiProperty } from '@nestjs/swagger';
import { ProblemSolvingScope } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnswerDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '질문에 대한 답변으로서 공유풀이영상을 올릴 경우에 담아서 보내주시면 됩니다.' })
  questionId?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '문제에 바로 전자칠판을 통해서 영상을 올릴 경우에 담아서 보내주시면 됩니다.' })
  problemId?: number;

  @IsString()
  @IsNotEmpty()
  videoPath!: string;

  @ApiProperty({ description: '풀이영상의 공유범위입니다.' })
  @IsEnum(ProblemSolvingScope)
  scope!: ProblemSolvingScope;

  private validate(): void {}
}
