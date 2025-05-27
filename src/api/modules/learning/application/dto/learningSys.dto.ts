import { ApiProperty } from "@nestjs/swagger";
import { UnitType, learning_sys } from "@prisma/client";

export class LearningSystemDto {
    @ApiProperty({description: '학년 정보'})
    grade!: number;
    
    @ApiProperty({description: '학기 정보'})
    semester!: number;
    
    @ApiProperty({description: '단원 ID'})
    learningSysId!: number;
    
    @ApiProperty({description: '표준학습체계 Id', nullable: true})
    clsId?: string;

    @ApiProperty({description: '단원 구분', examples: ['UNIT', 'CHAPTER', 'SECTION', 'SUBSECTION']})
    type!: UnitType;

    @ApiProperty({description: '단원 이름'})
    name!: string;

    @ApiProperty({description: '단원 전체 이름'})
    fullName!: string;

    @ApiProperty({description: '단원 목표'})
    achievementDesc!: string | null;

    static create(learningSys: learning_sys){
        const dto = new LearningSystemDto();
        dto.grade = learningSys.grade;
        dto.semester = learningSys.semester;
        dto.learningSysId = learningSys.id;
        dto.type = learningSys.type;
        dto.name = learningSys.name;
        dto.fullName = learningSys.full_name;
        dto.achievementDesc = learningSys.achievement_desc;
        return dto
    }
}