import { ApiProperty } from '@nestjs/swagger';
import { Difficulty, study_perform } from '@prisma/client';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';

export class StudyHistory {
  @IsNumber()
  problem_id?: number;

  @IsNumber()
  isCorrect?: number;

  @IsNumber()
  confidence?: number;

  @IsEnum(Difficulty)
  @ApiProperty({ enum: ['LOW', 'MIDDLE', 'HIGH', 'HIGHEST'] })
  difficulty?: Difficulty;

  static create(study_perform: study_perform, difficulty: Difficulty, problem_id: number): StudyHistory {
    const studyHistory = new StudyHistory();
    studyHistory.problem_id = problem_id;
    studyHistory.isCorrect = study_perform.is_correct;
    studyHistory.confidence = study_perform.is_correct === study_perform.confidence ? 1 : 0;
    studyHistory.difficulty = difficulty;
    return studyHistory;
  }
}

export class ClassStudyHistoryDto {
  @IsString()
  userUuid?: string;

  @IsObject()
  studyHistory?: StudyHistory[];

  @IsNumber()
  correctRate?: number;

  @IsNumber()
  progressRate?: number;

  static caculateCorrectRate(studyHistory: StudyHistory[]) {
    const numCorrect = studyHistory.filter((v) => v.isCorrect === 1).length;
    return (numCorrect / studyHistory.length) * 100;
  }

  static create(userUuid: string, studyHistory: StudyHistory[]): ClassStudyHistoryDto {
    const classStudyHistoryDto = new ClassStudyHistoryDto();
    classStudyHistoryDto.userUuid = userUuid;
    classStudyHistoryDto.studyHistory = studyHistory;
    classStudyHistoryDto.correctRate = this.caculateCorrectRate(studyHistory);
    classStudyHistoryDto.progressRate = (studyHistory.length / 4) * 100;
    if (Number.isNaN(classStudyHistoryDto.correctRate)) classStudyHistoryDto.correctRate = 0;
    return classStudyHistoryDto;
  }
}
