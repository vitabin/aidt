import {
  AchievementType,
  AssignmentStatus,
  ConceptType,
  ContentStatus,
  VideoProcessingStatus,
  assignment_perform,
  common_concept_video_play,
  concept_video,
  learning_level,
  study_perform,
} from '@prisma/client';

export type CurrentAchievement = {
  id: number;
  user_uuid: string;
  is_force_apply: boolean;
  learning_map_id: number;
  learning_map_node_id: number | null;
  learning_sys_id: number | null;
  learning_level_group_id: number | null;
  learning_level_id: number;
  achievement_type: AchievementType;
  achievement_score: number | null;
  created_at: Date;
  learning_level: learning_level;
};

export type ConceptWithSolving = {
  id: number;
  cls_id: string;
  type: ConceptType;
  order_no: number;
  type_name: string;
  latex_data: string;
  content_status: ContentStatus;
  is_algeomath: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date | null;
  concept_video_id: concept_video[];
};

export type StudyProblemWithPerforms = {
  id: number;
  study_id: number;
  problem_id: number;
  created_at: Date;
  study_perform: study_perform[];
};

export type AssignmentProbWithPerform = {
  id: number;
  assignment_gave_user_id: number;
  problem_id: number;
  status: AssignmentStatus;
  created_at: Date;
  assignment_perform: assignment_perform | null;
};

export type CommonConceptVideoWithPlay = {
  id: number;
  concept_id: number;
  title?: string | null;
  commentary?: string | null;
  video_path?: string | null;
  subtitle_path?: string | null;
  sign_video_path?: string | null;
  status?: VideoProcessingStatus | null;
  created_by?: number | null;
  created_at: Date;
  deleted_at?: Date | null;
  common_concept_video_play: common_concept_video_play[];
};
