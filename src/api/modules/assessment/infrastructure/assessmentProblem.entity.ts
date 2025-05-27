import { StudyType } from '@prisma/client';
import { EDifficulty } from '../../problem';

export class AssessmentProblem {
  id!: number;
  originalProblemId!: number;
  difficulty!: EDifficulty;
  problemType!: EProblemType;
  curriculumId!: string;
  createdAt!: Date;
  explanation?: string;
  aiHint?: string;
  solutionDetail?: string;
  correctAnswer!: string;
  latexData!: string;
  answerType!: EAnswerType;
}

export enum EProblemType {
  GENERAL = 'GENERAL',
  DIAGNOSTIC = 'DIAGNOSTIC',
  UNIT_PROGRESS = 'UNIT_PROGRESS',
  UNIT_END = 'UNIT_END',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

export function toEProblemType(type: string): EProblemType {
  switch (type) {
    case 'GENERAL':
      return EProblemType.GENERAL;
    case 'DIAGNOSTIC':
      return EProblemType.DIAGNOSTIC;
    case 'UNIT_PROGRESS':
      return EProblemType.UNIT_PROGRESS;
    case 'UNIT_END':
      return EProblemType.UNIT_END;
    case 'COMPREHENSIVE':
      return EProblemType.COMPREHENSIVE;
    default:
      return EProblemType.GENERAL;
  }
}

export enum EAnswerType {
  SHORT = 'SHORT',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
}

export function toEAnswerType(type: string): EAnswerType {
  switch (type) {
    case 'SHORT':
      return EAnswerType.SHORT;
    case 'SELECT':
      return EAnswerType.SELECT;
    case 'MULTISELECT':
      return EAnswerType.MULTISELECT;
    default:
      return EAnswerType.SHORT;
  }
}

export function toStudyType(type: string) {
  switch (type) {
    case 'BASIC':
      return StudyType.BASIC;
    case 'CONFIRM':
      return StudyType.CONFIRM;
    case 'FEEDBACK':
      return StudyType.FEEDBACK;
    case 'ADDITIONAL':
      return StudyType.ADDITIONAL;
    default:
      return StudyType.BASIC;
  }
}
