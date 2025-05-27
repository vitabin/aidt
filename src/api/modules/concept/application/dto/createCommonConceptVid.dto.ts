import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber } from "class-validator";

export class CreateCommonConcpetVidPlayDto{
    @ApiProperty({description: '영상 시청 시작 시간'})
    @IsDateString()
    playAt!: string;

    @ApiProperty({description: '조회 공유 인강 ID'})
    @IsNumber()
    videoId!: number;
}

export class UpdateCommonConcpetVidPlayDto{
    @ApiProperty({description: '영상 시청 종료 시간'})
    @IsDateString()
    endedAt!: string;
    
    @ApiProperty({description: '조회 공유 인강 ID'})
    @IsNumber()
    videoId!: number;
    
}