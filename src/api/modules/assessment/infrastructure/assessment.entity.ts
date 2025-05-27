import { AssessmentType } from '@prisma/client';
import { StudentAssessmentPerformStatus } from './studentAssessmentPerformStatus.entity';
import { ApiProperty } from '@nestjs/swagger';

export class Assessment {
  id!: number;
  begunAt?: Date;
  endAt?: Date;
  type!: EAssessmentType;
  createdAt!: Date;
  @ApiProperty({ nullable: true, enum: StudentAssessmentPerformStatus })
  perfomStatus?: StudentAssessmentPerformStatus | null;
}

export enum EAssessmentType {
  NONE = 'NONE',
  DIAGNOSTIC = 'DIAGNOSTIC',
  UNIT = 'UNIT',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

export enum EAssessmentExist {
  NONE = 'NONE',
  EXIST = 'EXIST',
}

export function toEAssessmentType(type: AssessmentType): EAssessmentType {
  switch (type) {
    case AssessmentType.DIAGNOSTIC:
      return EAssessmentType.DIAGNOSTIC;
    case AssessmentType.UNIT:
      return EAssessmentType.UNIT;
    case AssessmentType.COMPREHENSIVE:
      return EAssessmentType.COMPREHENSIVE;
    default:
      return EAssessmentType.NONE;
  }
}
