import { Assessment } from '../../infrastructure/assessment.entity';
import { AssessmentProblem } from '../../infrastructure/assessmentProblem.entity';

export class GetDiagnosticAssessmentResponseDto {
  assessment!: Assessment;
  problems?: AssessmentProblem[];
}
