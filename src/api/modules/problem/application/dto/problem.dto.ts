import { ApiProperty } from '@nestjs/swagger';
import { AnswerType, assignment_perform, learning_sys, problem, study_perform } from '@prisma/client';

export class ProblemDto {
  @ApiProperty()
  problem_id!: number;

  @ApiProperty()
  cls_id!: string | null;

  @ApiProperty()
  difficulty!: string;

  @ApiProperty()
  latex_data!: string;

  @ApiProperty()
  answer_type!: AnswerType;

  @ApiProperty()
  ai_hint?: string | null;

  // @IsObject()
  // @ApiProperty()
  // problem_solving?: problem_solving;

  // @IsObject()
  // @ApiProperty()
  // problem_solving_meta?: problem_solving_meta;

  @ApiProperty()
  study_id?: number;

  @ApiProperty({ description: 'optioanl' })
  study_perform?: study_perform | null;

  @ApiProperty()
  assignment_id?: number;

  @ApiProperty({ description: 'optioanl' })
  assignment_perform?: assignment_perform | null;

  @ApiProperty()
  learning_sys!: learning_sys;

  @ApiProperty()
  explanation!: string | null;

  //TODO: unit_id를 learning_sys_id로 변경했는데 확인 부탁드립니다.
  static from(problem: problem): ProblemDto {
    const problemDto = new ProblemDto();
    problemDto.problem_id = problem.id;
    problemDto.cls_id = problem.cls_id;
    problemDto.ai_hint = problem.ai_hint;
    problemDto.difficulty = problem.difficulty;
    problemDto.latex_data = problem.latex_data;
    problemDto.answer_type = problem.answer_type;
    problemDto.explanation = problem.explanation;
    return problemDto;
  }

  private validate(): void {}
}
