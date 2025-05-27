import { CommentEntity } from '../../infrastructure';

export class GetCommentsForReferenceDataResponseDto {
  comments!: CommentEntity[];
  currentPage!: number;
  totalPage!: number;
}
