import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BucketName } from './bucketName.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetUploadUrlDto {
  @IsEnum(BucketName)
  @ApiProperty({
    description: '업로드되는 파일의 용도라고 보시면 됩니다. 각각 공유풀이영상, 답변, 참고자료입니다.',
  })
  bucketName!: BucketName;
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    description: '소단원의 표준학습체계 ID입니다.',
    example: 'M2MATA01B01C01',
  })
  curriculumId?: string;
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '문제에 대한 답변 영상을 올리거나 공유풀이영상을 올릴 때 문제의 ID입니다.',
  })
  problemId?: string;
  @IsString()
  @IsNotEmpty()
  fileName!: string;
}
