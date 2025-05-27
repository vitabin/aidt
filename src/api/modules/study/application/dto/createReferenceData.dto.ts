import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EProblemSolvingScope } from '../../infrastructure';
import { Transform } from 'class-transformer';

export class CreateReferenceDataDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform((v) => {
    if (Array.isArray(v.value)) {
      return v.value;
    }

    return v.value.split(',');
  })
  filePaths!: string[];
  @IsString()
  @ApiProperty({
    description: '확장 소단원에 할당되는 표준학습체계 ID입니다.',
  })
  clsId!: string;
  @IsEnum(EProblemSolvingScope)
  scope!: EProblemSolvingScope;
  @IsString()
  @IsNotEmpty()
  content!: string;
}
