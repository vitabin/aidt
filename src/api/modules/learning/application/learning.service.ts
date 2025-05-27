/* eslint-disable sonarjs/no-collapsible-if */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable sonarjs/no-duplicate-string */
import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { AdjustLearningLevelOfStudentsDto, BookMarkerDto, ContentTableDto, LearningSystemDto, ProgressInSection, SetBookMarker, UnitObject } from './dto';
import { PrismaService } from 'src/prisma';
import { StudyType, UnitType, learning_sys } from '@prisma/client';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}
  async adjustLearningLevelOfStudents(dto: AdjustLearningLevelOfStudentsDto, classInfo: ClassInfo) {
    const { uuidLevelPairs } = dto;
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) {
      throw new HttpException('주어진 정보에 맞는 학급정보가 DB에 존재하지 않습니다.', 404);
    }

    const learning_map_node = await this.prisma.learning_map_node.findFirst({
      where: {
        learning_sys: { id: dto.learningSysId },
      },
    });

    // Fetch learning levels
    const learningLevels = await this.prisma.learning_level.findMany({
      select: {
        id: true,
        level: true,
      },
      where: {
        learning_level_group: {
          is_default: true,
        },
        // TODO: 일정 상 추가된 default level_group을 사용. 추후에 수정 필요.
      },
    });

    // Map levels to their IDs
    const levelMap = new Map();
    learningLevels.forEach((level) => {
      levelMap.set(level.level, level.id);
    });

    // Create user achievements in batch

    await this.prisma.$transaction(
      uuidLevelPairs.map((pair) => {
        const learningLevelId = levelMap.get(pair.level);
        if (!learningLevelId) {
          throw new HttpException(`레벨 ${pair.level}에 해당하는 학습 레벨을 찾을 수 없습니다.`, 400);
        }

        return this.prisma.user_achievement.create({
          data: {
            user_uuid: pair.uuid,
            is_force_apply: true,
            learning_map_id: learning_map_node?.learning_map_id || 3,
            learning_map_node_id: learning_map_node?.id || null,
            learning_sys_id: learning_map_node?.learning_sys_id || null,
            achievement_type: dto.achievementType,
            learning_level: {
              connect: {
                id: learningLevelId,
              },
            },
          },
        });
      }),
    );
  }

  async getAllContentTable(dto: ContentTableDto, classInfo: ClassInfo, uuid: string) {
    const { grade } = dto;

    const currentUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });

    if (!currentUser || !currentUser.learning_map_id) throw new BadRequestException('유효하지 않은 유저입니다.');

    const currentLearningMap = await this.prisma.learning_map.findFirst({
      where: {
        id: currentUser.learning_map_id,
      },
    });

    if (!currentLearningMap) throw new BadRequestException('유효하지 않은 학습맵입니다.');

    const learningContentTable = await this.prisma.learning_sys.findMany({
      where: {
        grade: parseInt(grade),
        semester: classInfo.semester,
        learning_sys_doc_id: currentLearningMap.learning_sys_doc_id,
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (!learningContentTable) {
      throw new HttpException('주어진 정보에 맞는 학습체계가 DB에 존재하지 않습니다.', 404);
    }
    const allcontentTable: Array<UnitObject> = [];

    learningContentTable.forEach((contentItem) => {
      if (contentItem.parent_id === null) {
        //대단원을 넣는다.
        const unitObject = {
          unit_name: contentItem.name,
          learning_sys_id: contentItem.id,
          chapter: [],
        };
        allcontentTable.push(unitObject);
      } else {
        allcontentTable.forEach((unitItem) => {
          if (unitItem.learning_sys_id == contentItem.parent_id) {
            //중단원을 넣는다.
            const chapterObject = {
              chapter_name: contentItem.name,
              learning_sys_id: contentItem.id,
              section: [],
            };
            unitItem.chapter.push(chapterObject);
          } else {
            //소단원 + 확장소단원
            unitItem.chapter.forEach((chapterItem) => {
              if (chapterItem.learning_sys_id == contentItem.parent_id) {
                const sectionObject = {
                  section_name: contentItem.name,
                  learning_sys_id: contentItem.id,
                  cls_id: contentItem.cls_id ? contentItem.cls_id : '',
                  subsection: [],
                };
                chapterItem.section.push(sectionObject);
              } else {
                chapterItem.section.forEach((sectionItem) => {
                  if (sectionItem.learning_sys_id == contentItem.parent_id) {
                    const subSectionObject = {
                      sub_section_name: contentItem.name,
                      learning_sys_id: contentItem.id,
                      cls_id: contentItem.cls_id ? contentItem.cls_id : '',
                    };
                    sectionItem.subsection.push(subSectionObject);
                  }
                });
              }
            });
          }
        });
      }
    });
    return allcontentTable;
  }
  async getAdditionalLearningSysInfo(learningSysId: number): Promise<LearningSystemDto> {
    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });

    if (!learningSys) throw new BadRequestException('단원 정보를 찾을 수 없습니다.');

    // return LearningSystemDto.create(learningSys);
    // 임시로직 ------------------------------------------------------------------------------------------------
    const subsections = await this.sectionToSubsections(learningSys.id);
    learningSys.achievement_desc = subsections.map((v) => v.achievement_desc)[0];
    return LearningSystemDto.create(learningSys);
    // ----------------------------------------------------------------------------------------------------------------
  }

  async getSectionBelowLearningSys(learningSysId: number) {
    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });

    if (!learningSys) throw new BadRequestException('존재하지 않는 단원ID 입니다.');
    if (learningSys.type === UnitType.SECTION) return [learningSys];
    if (learningSys.type === UnitType.SUBSECTION && learningSys.cls_id) return [learningSys];
    const learningSyses: learning_sys[] = [];

    if (learningSys.type === 'CHAPTER') {
      const section = await this.prisma.learning_sys.findMany({
        where: {
          learning_sys_doc_id: learningSys.learning_sys_doc_id,
          parent_id: learningSys.id,
          deleted_at: null,
        },
      });
      learningSyses.push(...section);
    }
    if (learningSys.type === 'UNIT') {
      const chapters = await this.prisma.learning_sys.findMany({
        where: {
          learning_sys_doc_id: learningSys.learning_sys_doc_id,
          type: 'CHAPTER',
          parent_id: learningSys.id,
          deleted_at: null,
        },
      });
      const chapterIds = chapters.map((v) => v.id);
      const section = await this.prisma.learning_sys.findMany({
        where: {
          learning_sys_doc_id: learningSys.learning_sys_doc_id,
          parent_id: {
            in: chapterIds,
          },
          deleted_at: null,
        },
      });
      learningSyses.push(...section);
    }
    return learningSyses;
  }

  async getLearningSystemInfo(uuid: string): Promise<LearningSystemDto> {
    const userInfo = await this.prisma.user.findFirst({ where: { user_uuid: uuid } });

    if (!userInfo || !userInfo.current_learning_node_id) throw new NotFoundException('현재 진행중인 단원이 없습니다.');

    const learningMapNode = await this.prisma.learning_map_node.findFirst({ where: { id: userInfo.current_learning_node_id } });

    if (!learningMapNode) throw new NotFoundException('단원 ID에대한 learning map이 없습니다.');

    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningMapNode.learning_sys_id } });

    if (!learningSys) throw new NotFoundException('단원 정보를 찾을 수 없습니다.');

    return LearningSystemDto.create(learningSys);
  }

  async getProgressInSectionStudent(learningSysId: number, uuid: string) {
    const progressInSection = new ProgressInSection();

    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });

    if (!learningSys) throw new BadRequestException('유효하지 않은 단원ID 입니다.');

    const subsections = await this.sectionToSubsections(learningSysId);
    const clsIds = subsections.map((v) => v.cls_id!);

    const studies = await this.prisma.study.findMany({
      include: {
        study_problem: true,
      },
      where: {
        learning_sys_id: learningSysId,
      },
    });

    for await (const study of studies) {
      if (study.type === 'ADDITIONAL') continue;
      if (study.type === 'FEEDBACK') continue;

      const studyProblems = study.study_problem;
      const studyProblemIds = studyProblems.map((v) => v.id);
      const studyPerform = await this.prisma.study_perform.findMany({
        where: {
          study_problem_id: {
            in: studyProblemIds,
          },
          user_uuid: uuid,
        },
      });

      const pendingPerform = studyPerform.filter((v) => !v.solving_end);
      if (studyPerform.length && !pendingPerform.length) {
        if (study.type === StudyType.BASIC) progressInSection.basicLearning = 'DONE';
        if (study.type === StudyType.CONFIRM) progressInSection.confirmLearning = 'DONE';
      }
    }

    //피드백 문제 전용
    for await (const study of studies) {
      if (study.type !== 'FEEDBACK') continue;

      //일단 기본문제와 확인문제가 모두 완료되었는지 확인
      if (progressInSection.basicLearning === 'DONE' && progressInSection.confirmLearning === 'DONE') {
        const studyProblems = study.study_problem;
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerform = await this.prisma.study_perform.findMany({
          where: {
            study_problem_id: {
              in: studyProblemIds,
            },
            user_uuid: uuid,
          },
        });

        //studyPerform 4개
        //pendingPerform 안푼거 1개
        const pendingPerform = studyPerform.filter((v) => !v.solving_end);
        if (study.type === StudyType.FEEDBACK) {
          if (studyPerform.length > 0 && pendingPerform.length === 0) {
            //만약 피드백문제가 1개 이상 출제되었고, 안푼 문제가 0개라면
            progressInSection.feedbackLearning = 'DONE';
          } else {
            //만약 피드백 문제가 0개라면 정말 다맞춰서 피드백 문제가 안나온 것인지, 아님 아직 출제 자체가 안된것인지 검증..
            const basicProblem = studies.find((v) => v.type === StudyType.BASIC);
            const confirmProblem = studies.find((v) => v.type === StudyType.CONFIRM);
            const basicPerforms = await this.prisma.study_perform.findMany({
              where: {
                study_problem_id: {
                  in: basicProblem?.study_problem.map((v) => v.id),
                },
                user_uuid: uuid,
              },
            });
            const confirmPerforms = await this.prisma.study_perform.findMany({
              where: {
                study_problem_id: {
                  in: confirmProblem?.study_problem.map((v) => v.id),
                },
                user_uuid: uuid,
              },
            });
            const basicPerformCorrects = basicPerforms.filter((v) => v.is_correct === 1);
            const confirmPerformCorrects = confirmPerforms.filter((v) => v.is_correct === 1);
            if (basicPerformCorrects.length === 4 && confirmPerformCorrects.length === 4) {
              progressInSection.feedbackLearning = 'DONE';
            }
          }
        }
      }
    }
    // if (progressInSection.basicLearning === 'DONE' && progressInSection.confirmLearning === 'DONE') {
    //   const feedback = studies.find((v) => v.type === StudyType.FEEDBACK)!;
    //   const feedbackProblemIds = feedback.study_problem.map((v) => v.id);
    //   const feedbackPerforms = await this.prisma.study_perform.findMany({
    //     where: {
    //       study_problem_id: {
    //         in: feedbackProblemIds,
    //       },
    //     },
    //   });
    //   const isUnsolved = feedbackPerforms.filter((v) => !v.solving_end);
    //   if (!feedbackPerforms.length || !isUnsolved.length) progressInSection.feedbackLearning = 'DONE';
    // }

    const concept = await this.prisma.concept.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
    if (!concept) throw new NotFoundException('단원ID에 해당하는 개념 정보를 찾을 수 없습니다.');

    const conceptIds = concept.map((v) => v.id);
    // const commonCenceptVid = await this.prisma.common_concept_video.findMany({ where: { concept_id: concept.id } });
    // const videoIds = commonCenceptVid.map((v) => v.id);
    // const videoPlay = await this.prisma.common_concept_video_play.groupBy({
    //   by: 'common_concept_video_id',
    //   where: {
    //     common_concept_video_id: {
    //       in: videoIds,
    //     },
    //     user_uuid: uuid,
    //   },
    // });
    const conceptPerform = await this.prisma.concept_perform.findFirst({
      where: {
        user_uuid: uuid,
        concept_id: {
          in: conceptIds,
        },
        learning_sys_id: learningSysId,
      },
    });
    if (conceptPerform) {
      progressInSection.concept = 'DONE';
    } else {
      progressInSection.concept = 'PENDING';
    }
    return progressInSection;
  }

  async getProgressInSectionClass(learningSysId: number, classUuids: string[]) {
    const progressInSection = new ProgressInSection();

    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });
    if (!learningSys) throw new BadRequestException('유효하지 않은 단원ID 입니다.');
    if (!learningSys.cls_id) throw new BadRequestException('소단원만 조회 가능합니다.');
    const studies = await this.prisma.study.findMany({
      include: {
        study_problem: true,
      },
      where: {
        learning_sys_id: learningSysId,
      },
    });

    for await (const uuid of classUuids) {
      for await (const study of studies) {
        if (study.type === 'ADDITIONAL') continue;

        const studyProblems = study.study_problem;
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerform = await this.prisma.study_perform.findMany({
          where: {
            study_problem_id: {
              in: studyProblemIds,
            },
            user_uuid: uuid,
          },
        });
        const pendingPerform = studyPerform.filter((v) => !v.solving_end);
        if (studyPerform.length && pendingPerform.length) {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'PENDING';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'PENDING';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'PENDING';
        } else {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'DONE';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'DONE';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'DONE';
        }
      }

      const concept = await this.prisma.concept.findFirst({ where: { cls_id: learningSys.cls_id } });
      if (!concept) throw new NotFoundException('단원ID에 해당하는 개념 정보를 찾을 수 없습니다.');
      const commonCenceptVid = await this.prisma.common_concept_video.findMany({ where: { concept_id: concept.id } });
      const videoIds = commonCenceptVid.map((v) => v.id);
      const videoPlay = await this.prisma.common_concept_video_play.groupBy({
        by: 'common_concept_video_id',
        where: {
          common_concept_video_id: {
            in: videoIds,
          },
          user_uuid: uuid,
        },
      });
      if (commonCenceptVid.length === videoPlay.length) {
        progressInSection.concept = 'DONE';
      } else {
        progressInSection.concept = 'PENDING';
      }
    }
    return progressInSection;
  }

  async getSectionProgressBelowUnit(unitId: number, uuid: string) {
    const learningSyses = await this.getSectionBelowLearningSys(unitId);
    const clsIds = learningSyses.map((v) => v.cls_id!);
    const concepts = await this.prisma.concept.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
    const concpetIds = concepts.map((v) => v.id);
    const commonConceptVids = await this.prisma.common_concept_video.findMany({
      where: {
        concept_id: {
          in: concpetIds,
        },
      },
    });
  }

  async bookmarkerUnit(learningSysId: number, uuid: string) {
    const bookmarkers: BookMarkerDto[] = [];
    const checkUnit = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });
    if (!checkUnit || checkUnit.type !== 'UNIT') throw new BadRequestException('대단원만 조회 가능합니다.');
    const leaningSyses = await this.getSectionBelowLearningSys(learningSysId);
    for (const learningSys of leaningSyses) {
      const progressInSection = new ProgressInSection();
      if (!learningSys) throw new BadRequestException('유효하지 않은 단원ID 입니다.');
      const studies = await this.prisma.study.findMany({
        include: {
          study_problem: true,
        },
        where: {
          learning_sys_id: learningSys.id,
        },
      });

      for await (const study of studies) {
        if (study.type === 'ADDITIONAL') continue;

        const studyProblems = study.study_problem;
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerform = await this.prisma.study_perform.findMany({
          where: {
            study_problem_id: {
              in: studyProblemIds,
            },
            user_uuid: uuid,
          },
        });
        const pendingPerform = studyPerform.filter((v) => v.is_correct === -1);
        if (studyPerform.length && pendingPerform.length) {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'PENDING';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'PENDING';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'PENDING';
        } else {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'DONE';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'DONE';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'DONE';
        }
      }

      const subsections = await this.sectionToSubsections(learningSys.id);
      const clsIds = subsections.map((v) => v.cls_id!);
      const concept = await this.prisma.concept.findFirst({
        where: {
          cls_id: {
            in: clsIds,
          },
        },
      });

      if (!concept) {
        progressInSection.concept = 'PENDING';
      } else {
        const commonCenceptVid = await this.prisma.common_concept_video.findMany({ where: { concept_id: concept.id } });
        const videoIds = commonCenceptVid.map((v) => v.id);
        const videoPlay = await this.prisma.common_concept_video_play.groupBy({
          by: 'common_concept_video_id',
          where: {
            common_concept_video_id: {
              in: videoIds,
            },
            user_uuid: uuid,
          },
        });
        if (commonCenceptVid.length === videoPlay.length) {
          progressInSection.concept = 'DONE';
        } else {
          progressInSection.concept = 'PENDING';
        }
      }

      const progress = [progressInSection.basicLearning, progressInSection.concept, progressInSection.confirmLearning, progressInSection.feedbackLearning];

      const status = progress.filter((v) => v === 'DONE');
      const bookmarker = {
        learningSysId: learningSys.id,
        learningSysName: learningSys.full_name,
        status: status.length === 4 ? 'DONE' : 'PENDING',
      };
      bookmarkers.push(bookmarker);
    }

    return bookmarkers;
  }

  async bookMarkSemester(uuid: string, classInfo: ClassInfo) {
    const { user_grade, semester } = classInfo;
    const bookmarkers: BookMarkerDto[] = [];
    const user = await this.prisma.user.findFirst({where: {user_uuid: uuid}});
    
    if (!user) throw new NotFoundException('유저 정보가 존재하지 않습니다.');

    const learningMap = await this.prisma.learning_map.findFirst({where: {id: user.learning_map_id!}});
    const learningSyses = await this.prisma.learning_sys.findMany({
      where: {
        learning_sys_doc_id: learningMap?.learning_sys_doc_id,
        grade: parseInt(user_grade),
        semester: semester,
        type: UnitType.SECTION,
      },
    });

    for await (const learningSys of learningSyses) {
      const progressInSection = new ProgressInSection();
      const studies = await this.prisma.study.findMany({
        include: {
          study_problem: true,
        },
        where: {
          learning_sys_id: learningSys.id,
        },
      });

      for await (const study of studies) {
        if (study.type === 'ADDITIONAL') continue;

        const studyProblems = study.study_problem;
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerform = await this.prisma.study_perform.findMany({
          where: {
            study_problem_id: {
              in: studyProblemIds,
            },
            user_uuid: uuid,
          },
        });
        const pendingPerform = studyPerform.filter((v) => !v.solving_end);
        if (studyPerform.length && pendingPerform.length) {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'PENDING';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'PENDING';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'PENDING';
        } else {
          if (study.type === 'BASIC') progressInSection.basicLearning = 'DONE';
          if (study.type === 'CONFIRM') progressInSection.confirmLearning = 'DONE';
          if (study.type === 'FEEDBACK') progressInSection.feedbackLearning = 'DONE';
        }
      }

      const subsections = await this.sectionToSubsections(learningSys.id);
      const clsIds = subsections.map((v) => v.cls_id!);
      const concept = await this.prisma.concept.findFirst({
        where: {
          cls_id: {
            in: clsIds,
          },
        },
      });

      if (!concept) {
        progressInSection.concept = 'PENDING';
      } else {
        const commonCenceptVid = await this.prisma.common_concept_video.findMany({ where: { concept_id: concept.id } });
        const videoIds = commonCenceptVid.map((v) => v.id);
        const videoPlay = await this.prisma.common_concept_video_play.groupBy({
          by: 'common_concept_video_id',
          where: {
            common_concept_video_id: {
              in: videoIds,
            },
            user_uuid: uuid,
          },
        });
        if (commonCenceptVid.length === videoPlay.length) {
          progressInSection.concept = 'DONE';
        } else {
          progressInSection.concept = 'PENDING';
        }
      }

      const progress = [progressInSection.basicLearning, progressInSection.concept, progressInSection.confirmLearning, progressInSection.feedbackLearning];

      const status = progress.filter((v) => v === 'DONE');
      const bookmarker = {
        learningSysId: learningSys.id,
        learningSysName: learningSys.full_name,
        status: status.length === 4 ? 'DONE' : 'PENDING',
      };
      bookmarkers.push(bookmarker);
    }

    return bookmarkers;
  }

  async setBookMarker(uuid: string, setBookMarker: SetBookMarker) {
    const isExist = await this.prisma.book_marker.findFirst({
      where: {
        user_uuid: uuid,
        learning_sys_id: setBookMarker.learningSysId,
      },
    });
    const learningSys = await this.prisma.learning_sys.findFirst({ where: { id: setBookMarker.learningSysId } });
    if (!learningSys) throw new BadRequestException('유효하지 않은 단원ID입니다.');

    if (!isExist) {
      return await this.prisma.book_marker.create({
        data: {
          user_uuid: uuid,
          learning_sys_id: learningSys.id,
          semester: learningSys.semester,
          status: setBookMarker.status,
        },
      });
    }

    return await this.prisma.book_marker.update({
      where: {
        id: isExist.id,
      },
      data: {
        user_uuid: uuid,
        learning_sys_id: learningSys.id,
        semester: learningSys.semester,
        status: setBookMarker.status,
      },
    });
  }

  async getCheckedBookmarker(uuid: string, classInfo: ClassInfo) {
    return await this.prisma.book_marker.findMany({
      where: {
        user_uuid: uuid,
        semester: classInfo.semester,
        status: 1,
      },
    });
  }

  async sectionToSubsections(learningSysId: number) {
    return await this.prisma.learning_sys.findMany({
      where: {
        parent_id: learningSysId,
        type: UnitType.SUBSECTION,
        // is_deleted: false, //TODO DB에는 is_deleted가 true인 값들이 존재하여 일시적으로 비활성화
      },
      orderBy: {
        id: 'desc',
      },
    });
  }
}
