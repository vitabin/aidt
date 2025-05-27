import { ApiProperty } from "@nestjs/swagger";
import { AnnouncementScope, AnnouncementType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateAnnouncement {
    @ApiProperty({description: '공개범위', enum: AnnouncementScope})
    @IsEnum(AnnouncementScope)
    scope!: AnnouncementScope;
    
    @ApiProperty({description: '공지사항 타입', enum: AnnouncementType})
    @IsEnum(AnnouncementType)
    @IsOptional()
    type?: AnnouncementType;

    @ApiProperty({description: 'S3 파일 경로'})
    @IsString({each: true})
    @IsOptional()
    filePath?: string[]

    @ApiProperty({description: '공지사항 제목'})
    @IsString()
    title!: string;
    
    @ApiProperty({description: '공지사항 내용'})
    @IsString()
    content!: string;
}