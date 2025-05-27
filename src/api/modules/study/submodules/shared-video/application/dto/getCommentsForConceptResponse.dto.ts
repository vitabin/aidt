import { CommentEntity } from '../../infrastructure/comment.entity';

export class GetCommentsForConceptResponseDto {
  totalPage!: number;
  currentPage!: number;
  comments!: CommentEntity[];
}
