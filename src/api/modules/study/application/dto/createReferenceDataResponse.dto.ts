import { EProblemSolvingScope } from '../../infrastructure';

export class CreateReferenceDataResponseDto {
  id!: number;
  title!: string;
  content!: string;
  filePaths!: string[];
  scope!: EProblemSolvingScope;
}
