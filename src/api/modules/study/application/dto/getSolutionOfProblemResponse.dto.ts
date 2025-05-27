export class GetSolutionOfProblemResponseDto {
  problemId!: number;
  studyId!: number;
  correctRate!: number;
  solution!: string;
  correctAnswer!: string;
  submittedAnswer!: string;
}
