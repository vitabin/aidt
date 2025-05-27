import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class GetClassProgressInSection {
  @IsString()
  @Transform(({ value }) => value.split(',').map((uuid: string) => uuid.trim()))
  classUuids!: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  learningSysId!: number;
}
