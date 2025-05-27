import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export class GetSharedSolutionVideoForConceptDto {
  @IsNumber()
  problemId!: number;
  @IsBoolean()
  @Transform((value) => {
    return value.obj.onlyMine === 'true';
  })
  onlyMine!: boolean;
  @IsNumber()
  page = 1;
  @IsNumber()
  pageSize = 10;
}
