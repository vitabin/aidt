import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNumber, IsString } from "class-validator";

export class AssignmentCheckDto {
    @ApiProperty({description: '학급 전체 uuid'})
    @IsString({each: true})
    @IsArray()
    @Transform(({ value }) => value.split(',').map((type: string) => type.trim()))
    classUuids!: string[];

    @ApiProperty({description: '단원ID'})
    @IsNumber()
    @Transform(({value}) => Number(value))
    learningSysId!: number;
}