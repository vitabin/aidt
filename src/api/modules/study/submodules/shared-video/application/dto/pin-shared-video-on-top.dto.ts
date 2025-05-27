import { ValidationError } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, validate } from 'class-validator';

export class PinSharedVideoOnTopDto {
  @IsBoolean()
  @Transform((value) => {
    return value.obj.pin === 'true';
  })
  pin!: boolean;

  validate(): Promise<ValidationError[]> {
    return validate(this);
  }
}
