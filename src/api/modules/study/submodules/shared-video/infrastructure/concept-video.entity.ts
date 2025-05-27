import { ProblemSolvingScope, VideoProcessingStatus } from '@prisma/client';

export class ConceptVideo {
  id!: number;
  cls_id!: string;
  scope!: EProblemSolvingScope;
  user_uuid!: string;
  video_path!: string;
  status!: EVideoProcessingStatus;
  created_at!: Date;
  deleted_at!: Date | null;
  pinned!: boolean;
  like_count!: number;
  comment_count!: number;
  haveLiked!: boolean;
}

export enum EVideoProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

export function fromDBVideoProcessingStatus(status: VideoProcessingStatus): EVideoProcessingStatus {
  return status as EVideoProcessingStatus;
}

export enum EProblemSolvingScope {
  ME = 'ME',
  ALL = 'ALL',
  CLASS = 'CLASS',
}

export function fromDBProblemSolvingScope(scope: ProblemSolvingScope): EProblemSolvingScope {
  return scope as EProblemSolvingScope;
}
