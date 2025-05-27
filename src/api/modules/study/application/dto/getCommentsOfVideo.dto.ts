import { IsNumber, IsOptional } from 'class-validator';

export class GetCommentsOfVideoDto {
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @IsOptional()
  pageSize: number = 10;
}
