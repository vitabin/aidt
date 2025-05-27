import { ProblemSolving } from '../../problem';

export class Question {
  id!: number;
  problemId!: number;
  title!: string;
  questionUserUuid!: string;
  solvingUserUuid?: string | null;
  curriculumId!: string;
  createdAt!: Date;
  problemSolving?: ProblemSolving | null;
  learningSysId!: number;
  problemType!: EAnswerType;
  latexData!: string;
}

export enum EAnswerType {
  SHORT = 'SHORT',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
}
