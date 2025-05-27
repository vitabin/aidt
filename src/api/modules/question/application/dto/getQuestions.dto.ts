import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetQuestionsDto {
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsNumber()
  @Min(1)
  pageSize: number = 1;

  @ApiProperty({ description: '나의 질문만 받아오고 싶을 때 true를 넣으시면 됩니다. 이때 authorUuids는 무시됩니다.' })
  @IsBoolean()
  @Transform((value) => {
    return value.obj.onlyMine === 'true';
  })
  onlyMine: boolean = false;

  @ApiProperty({ description: '제목으로 검색을 할 때 쓰는 키워드입니다.' })
  @IsOptional()
  @IsString()
  titleKeyword?: string;

  @ApiProperty({ description: '단원명으로 검색을 할 때 쓰는 키워드입니다.' })
  @IsOptional()
  @IsString()
  unitNameKeyword?: string;
}
