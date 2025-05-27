import { EAssessmentType } from './assessment.entity';

export class AssessmentStatus {
  assessmentId!: number;
  type!: EAssessmentType;
  begunAt!: Date;
  durationInSecond!: number;
  curriculumId?: string;
  status!: string;
  learning_sys_id!: number;
}
