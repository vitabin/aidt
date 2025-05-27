import { study_chapter_plan } from '@prisma/client';

export class StudyChapterPlanDto {
  current!: study_chapter_plan;

  previous!: study_chapter_plan;

  noData(uuid: string, learningSysId: number) {
    return {
      id: -1,
      semester_id: 0,
      learning_sys_id: learningSysId ?? null,
      uuid: uuid,
      progress_rate: 0,
      achievement_level: 0,
      correct_rate: 0,
      metarecognition_rate: 0,
    };
  }
}
