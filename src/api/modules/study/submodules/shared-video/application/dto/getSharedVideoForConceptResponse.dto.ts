import { ConceptVideo } from '../../infrastructure/concept-video.entity';

export class GetSharedVideoForConceptResponseDto {
  videos!: ConceptVideo[];
  totalPage!: number;
}
