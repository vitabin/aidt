import { ArrayMinSize, IsArray, IsNumber, IsString } from 'class-validator';

export class StudentWeakChaptersDto {
  @IsString()
  chapterName!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  HIGHEST: number[] = [0, 0];

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  HIGH: number[] = [0, 0];

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  MIDDLE: number[] = [0, 0];

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  LOW: number[] = [0, 0];

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  SUM: number[] = [0, 0];

  private validate(): void {}
}
