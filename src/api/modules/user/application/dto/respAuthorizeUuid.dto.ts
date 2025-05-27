import { ApiProperty } from '@nestjs/swagger';
import { learning_map, user } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class RespAuthorizeUuidDto {
  @IsBoolean()
  @Transform((value) => {
    return value.obj.created === 'true';
  })
  @ApiProperty()
  created!: boolean;

  @ApiProperty()
  user?: user;

  @ApiProperty()
  learning_map?: learning_map;
}
