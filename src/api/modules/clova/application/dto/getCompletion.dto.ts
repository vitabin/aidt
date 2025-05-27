import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ClovaMessageDto } from '.';
import { ApiProperty } from '@nestjs/swagger';

export enum BotType {
  MATH_TUTOR = 'MATH_TUTOR',
  JOB_ADVISOR = 'JOB_ADVISOR',
}

export class GetCompletionDto {
  @ValidateNested()
  @ApiProperty({
    description: '지금까지 주고 받은 모든 메시지입니다.',
  })
  messages!: ClovaMessageDto[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '첫 응답을 받은 뒤 받은 requestId입니다.',
  })
  requestId?: string;
  @ApiProperty({
    description: '챗봇의 종류입니다. MATH_TUTOR는 수학 특화이고, JOB_ADVISOR는 장래희망 직업 특화입니다.',
  })
  @IsEnum(BotType)
  type!: BotType;
}
