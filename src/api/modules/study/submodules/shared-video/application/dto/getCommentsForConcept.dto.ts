import { IsNumber } from 'class-validator';

export class GetCommentsForConceptDto {
  @IsNumber()
  page: number = 1;

  @IsNumber()
  pageSize: number = 20;
}
