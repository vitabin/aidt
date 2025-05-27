export interface StudyPerform {
    user_uuid: string;
    is_correct: number;
    study_problem: {
      study: {
        id: number;
        learning_sys_id: number;
        type: string; // replace with the appropriate enum or type
        basic_video: string;
        created_at: Date;
      };
      id: number;
      study_id: number;
      problem_id: number;
      created_at: Date;
    };
  }