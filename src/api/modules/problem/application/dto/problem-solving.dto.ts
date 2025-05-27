import { EProblemSolvingScope } from 'src/api/modules/study';

export class ProblemSolving {
  id!: number;
  problemId!: number;
  userUuid!: string;
  scope!: EProblemSolvingScope;
  createdAt!: Date;
  videoPath!: string;
}

export enum EProblemSolvingStatus {
  IDLE = 'IDLE',
  SAVED = 'SAVED',
  DELETED = 'DELETED',
}
