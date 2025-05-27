import { EProblemSolvingScope } from '../submodules/shared-video/infrastructure/concept-video.entity';

export class ReferenceDataSummary {
  id!: number;
  scope!: EProblemSolvingScope;
  title!: string;
  viewCount!: number;
  createdAt!: Date;
}
