import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class SetBookMarker {
    @ApiProperty({description: '단원ID'})
    @IsNumber()
    learningSysId!: number;

    @ApiProperty({description: '체크 유무', enum: [0, 1]})
    @IsNumber()
    status!: number;
}