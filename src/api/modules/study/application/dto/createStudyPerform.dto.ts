export class CreateStudyPerform {
  study_problem_id!: number;
  user_uuid!: string;
  confidence = -1;
  is_correct = -1;

  static create(studyProblemId: number, uuid: string){
    const dto = new CreateStudyPerform();
    dto.study_problem_id = studyProblemId;
    dto.user_uuid = uuid;
    return dto
  }
}
