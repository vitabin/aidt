import { IsNumber, IsString, Max, Min } from 'class-validator';

export class PostUserStatusDto {
  @IsString()
  statusMessage!: string;
  @Min(1)
  @Max(5)
  @IsNumber()
  physicalState!: number;
  @Min(1)
  @Max(5)
  @IsNumber()
  mentalState!: number;
}
