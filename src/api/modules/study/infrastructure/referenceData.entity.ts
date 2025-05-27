import { EProblemSolvingScope } from '../submodules/shared-video/infrastructure/concept-video.entity';

export class ReferenceData {
  id!: number;
  scope!: EProblemSolvingScope;
  title!: string;
  content!: string;
  createdAt!: Date;
  viewCount!: number;
  likeCount!: number;
  commentCount!: number;
  userUuid!: string;
  filePaths?: string[];
  haveILiked!: boolean;
}
