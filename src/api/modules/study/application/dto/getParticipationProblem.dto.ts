import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class GetParticipationProblemDto {
  @IsString()
  @ApiProperty()
  user_uuid!: string;

  @IsNumber()
  @ApiProperty({ description: '해당 단원 ID' })
  @Transform(({ value }) => Number(value))
  learning_sys_id!: number;
}
