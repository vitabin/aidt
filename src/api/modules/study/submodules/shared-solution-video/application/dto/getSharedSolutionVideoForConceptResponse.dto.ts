import { SharedSolutionVideo } from '../../infrastructure/sharedSolutionVideo.entity';

export class GetSharedSolutionVideoForConceptResponseDto {
  totalPage!: number;
  page!: number;
  videos!: SharedSolutionVideo[];
}
