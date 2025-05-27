import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { AnalysisTableRowProblem } from './analysis-table-row-problem';

export class AnalysisTableRowDto {
  @IsString()
  uuid!: string;

  @IsNumber()
  @Min(0)
  correction_rate!: number;

  @IsNumber()
  @Min(0)
  progress_rate!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisTableRowProblem)
  problems: Array<AnalysisTableRowProblem> = [];

  private validate(): void {}
}
