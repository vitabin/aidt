import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BucketName } from './bucketName.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetDownloadUrlDto {
  @IsEnum(BucketName)
  @ApiProperty({
    description: '업로드되는 파일의 용도라고 보시면 됩니다. 각각 공유풀이영상, 답변, 참고자료입니다.',
  })
  bucketName!: BucketName;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '파일의 경로입니다. Object Storage에서 파일을 가져올 때 key값으로 쓰입니다.',
  })
  filePath!: string;
}
