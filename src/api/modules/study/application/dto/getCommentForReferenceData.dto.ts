import { IsNumber, IsOptional } from 'class-validator';

export class GetCommentForReferenceDataDto {
  @IsNumber()
  @IsOptional()
  page: number = 1;
  @IsNumber()
  @IsOptional()
  pageSize: number = 10;
}
