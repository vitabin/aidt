import { ApiProperty } from "@nestjs/swagger";

export class ProgressInSection{
    @ApiProperty({description: '개념학습 완료 여부' , examples: ['DONE', 'PENDING']})
    concept: string = 'PENDING';
    
    @ApiProperty({description: '기본문제 완료 여부' , examples: ['DONE', 'PENDING']})
    basicLearning: string = 'PENDING';
    
    @ApiProperty({description: '확인문제 완료 여부' , examples: ['DONE', 'PENDING']})
    confirmLearning: string = 'PENDING';
    
    @ApiProperty({description: '피드백문제 완료 여부' , examples: ['DONE', 'PENDING']})
    feedbackLearning: string = 'PENDING';
}