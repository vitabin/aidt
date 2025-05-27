import { ReportType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsNumber()
  @Min(1)
  target_id!: number;

  @IsString()
  @Length(1, 255)
  reason!: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  reason_detail?: string | undefined;
}
