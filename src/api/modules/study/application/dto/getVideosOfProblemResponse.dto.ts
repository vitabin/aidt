import { ProblemVideo } from '../..';

export class GetVideosOfProblemResponseDto {
  videos!: ProblemVideo[];
  currentPage!: number;
  totalPage!: number;
}
