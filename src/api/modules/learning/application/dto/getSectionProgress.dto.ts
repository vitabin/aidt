import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetSectionProgressDto {
  @ApiProperty({ description: '단원ID' })
  @IsString()
  learningSysId!: string;
}
