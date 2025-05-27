import { LearningMapNode } from '../../infrastructure/entity';

export class GetLearningSystemsResponseDto {
  learningSystemId!: number;
  name!: string;
  fullName!: string;
  preLearningMapId?: number | null;
  parentLearningSystemId?: number | null;
  learningMapNodes!: LearningMapNode[];
}
