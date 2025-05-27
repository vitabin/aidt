import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { AssessmentResultTableRowProblem } from './assessmentResultTableRowProblem';

export class AssessmentResultTableRowDto {
  @ApiProperty()
  @IsString()
  user_uuid!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  correction_rate!: number;

  @ApiProperty({ type: [AssessmentResultTableRowProblem] })
  @ValidateNested({ each: true })
  @Type(() => AssessmentResultTableRowProblem)
  assessment_problems!: Array<AssessmentResultTableRowProblem>;

  //TODO: 진도율 추가

  private validate(): void {}
}
