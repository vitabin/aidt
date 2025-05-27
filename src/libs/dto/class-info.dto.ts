import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class ClassInfo {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  school_id!: string;
  @IsString()
  @IsNotEmpty()
  @Length(1, 1)
  user_grade!: string;
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  user_class!: string;
  @IsNumber()
  @Min(1)
  semester!: number;
}
