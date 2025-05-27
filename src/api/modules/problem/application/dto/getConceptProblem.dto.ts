import { IsEnum, IsNumber, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";

export class GetConceptProblemDto {
    @ApiProperty({description: 'BASIC | CONFIRM | FEEDBACK | ADDITIONAL | METACOGNITION'})
    @IsString()
    type!: string

    @IsNumber()
    @Transform(({value}) => Number(value))
    learningSysId!: number;
}