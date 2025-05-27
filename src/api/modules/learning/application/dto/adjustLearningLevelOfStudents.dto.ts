import { ApiProperty } from '@nestjs/swagger';
import { AchievementType } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, Length, Max, Min, ValidateNested } from 'class-validator';

export class AdjustLearningLevelOfStudentsDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @IsArray()
  uuidLevelPairs!: UuidLevelPair[];

  @IsNumber()
  @ApiProperty({ description: '소단원의 learning_sys_id입니다.' })
  learningSysId!: number;

  @ApiProperty()
  @IsEnum(AchievementType)
  achievementType!: AchievementType;
}

export class UuidLevelPair {
  @IsNotEmpty()
  @IsString()
  @Length(36, 36)
  uuid!: string;
  @IsNumber()
  @Min(1)
  @Max(10)
  level!: number;
}
