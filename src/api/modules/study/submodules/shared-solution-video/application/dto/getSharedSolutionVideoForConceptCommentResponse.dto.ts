import { CommentEntity } from '../../../shared-video/infrastructure/comment.entity';

export class GetSharedSolutionVideoForConceptCommentResponseDto {
  totalPage!: number;
  page!: number;
  comments!: CommentEntity[];
}
