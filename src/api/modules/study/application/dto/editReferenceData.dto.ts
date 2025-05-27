import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class EditReferenceDataDto {
  @IsString()
  content!: string;
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
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Transform((v) => {
    if (Array.isArray(v.value)) {
      return v.value;
    }

    return v.value.split(',');
  })
  filePaths!: string[];
}
