import { CommentEntity } from '../../infrastructure';

export class GetCommentsOfVideoResponseDto {
  comments!: CommentEntity[];
  currentPage!: number;
  totalPage!: number;
}
