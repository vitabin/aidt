import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { EProblemSolvingScope } from '../../infrastructure/concept-video.entity';

export class CreateSharedVideoForConceptDto {
  @IsNumber()
  @ApiProperty({
    description: '소단원의 learning_sys_id입니다.',
  })
  learningSysId!: number;
  @IsString()
  @IsNotEmpty()
  videoPath!: string;
  @IsEnum(EProblemSolvingScope)
  scope!: EProblemSolvingScope;
}
