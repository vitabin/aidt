import { ApiProperty } from "@nestjs/swagger";

export class BookMarkerDto {
    @ApiProperty()
    learningSysId!: number;
    
    @ApiProperty()
    learningSysName!: string;
    
    @ApiProperty({description: '완료면 DONE 진행중이면 PENDING'})
    status!: string;
}