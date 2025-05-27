import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AccessToken } from 'src/api/modules/transfer/infrastructure';

export class SendScoreOfCurriculumDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '표준학습체계ID입니다.' })
  curriculumId!: string;
  @ValidateNested()
  accessToken!: AccessToken;
  @IsString()
  @IsNotEmpty()
  partnerId!: string;
}
