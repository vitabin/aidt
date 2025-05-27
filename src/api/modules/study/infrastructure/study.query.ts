import { ContentStatus, StudyType, problem, study_perform } from '@prisma/client';
import { ProblemSolvingScope, VideoProcessingStatus, study } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateCommentForConceptDto,
  CreateReferenceDataDto,
  EditReferenceDataDto,
  GetReferenceDataDto,
  GetSharedVideoForConceptDto,
  PinSharedVideoOnTopDto,
  UpdateCommentForConceptDto,
} from '../application';
import { LikeSharedVideoDto } from '../submodules/shared-video/application/dto/like-shared-video.dto';
import { BaseRepository } from 'src/libs/base';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { CreateSharedVideoForConceptDto } from '../submodules/shared-video/application/dto';
import { CreateStudyPerform } from '../application/dto';
import { orderBy } from 'lodash';
// import { EDifficulty, EDifficultyProps } from './problem.enum';

const noClassFoundMessage = 'no class found';

const noLearningSysWarning = '해당 표준학습체계 ID에 대응하는 개념이 없습니다.';
const noClassErrorMessage = '해당 학급이 DB에 존재하지 않습니다.';
const noRefDataError = '해당 참고자료가 존재하지 않습니다.';
@Injectable()
export class StudyQueryRepository extends BaseRepository<study> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }
  async getStudyById(id: number) {
    return await this.prisma.study.findUnique({
      where: { id },
    });
  }

  async getStudyByProblemId(problem_id: number) {
    return await this.prisma.study.findFirst({
      include: {
        study_problem: {
          where: {
            problem_id: problem_id,
          },
        },
      },
    });
  }

  async getStudyPerformByUuids(uuids: string[]): Promise<study_perform[]> {
    return await this.prisma.study_perform.findMany({
      where: {
        user_uuid: {
          in: uuids,
        },
      },
    });
  }

  /**
   *
   * @param uuids
   * @param learning_sys_id
   * @returns
   */
  async getStudyWithAllRelation(uuids: string[], learning_sys_id: number, type: StudyType) {
    return await this.prisma.study.findFirst({
      include: {
        study_problem: {
          include: {
            study_perform: {
              where: {
                user_uuid: {
                  in: uuids,
                },
              },
            },
          },
        },
      },
      where: {
        learning_sys_id: learning_sys_id,
        type: type,
      },
    });
  }

  async getStudyWithStudyProblemByLearningSysId(learning_sys_id: number) {
    return await this.prisma.study.findMany({
      include: {
        study_problem: true,
      },
      where: {
        learning_sys_id: learning_sys_id,
      },
    });
  }

  async createCommentForConcept(dto: CreateCommentForConceptDto, uuid: string, videoId: number) {
    const video_data = await this.prisma.concept_video.findUnique({
      where: {
        id: videoId,
        deleted_at: null,
      },
      include: {
        concept_video_data: true,
      },
    });

    if (!video_data) throw new HttpException('no concept_video found', 404);
    if (!video_data.concept_video_data) throw new HttpException('no concept_video_data found', 404);

    return await this.prisma.concept_video_comment.create({
      data: {
        content: dto.content,
        concept_video_data_id: video_data.concept_video_data!.id,
        user_uuid: uuid,
      },
    });
  }

  async getSharedVideoForConcept(dto: GetSharedVideoForConceptDto, uuid: string, classInfo: ClassInfo) {
    const clazz = await this.prisma.school_class.findFirst({
      where: {
        school: {
          school_id: classInfo.school_id,
        },
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
      select: { id: true },
    });

    if (!clazz) throw new HttpException(noClassFoundMessage, 404);

    const class_id = clazz.id;
    const { learningSysId, page, pageSize, onlyMine } = dto;

    const skip = (page - 1) * pageSize;

    const learningSys = await this.prisma.learning_sys.findUnique({
      where: {
        id: learningSysId,
      },
    });
    if (!learningSys) throw new HttpException(noLearningSysWarning, 404);

    if (onlyMine) {
      const totalCount = await this.prisma.concept_video.count({
        where: {
          concept: {
            cls_id: learningSys.cls_id!,
          },
          user_uuid: uuid,
          deleted_at: null,
        },
      });

      const videos = await this.prisma.concept_video.findMany({
        where: {
          concept: {
            cls_id: learningSys.cls_id!,
          },
          user_uuid: uuid,
          deleted_at: null,
        },
        include: {
          concept_video_share: true,
          concept_video_data: {
            include: {
              _count: { select: { concept_video_comment: true } },
            },
          },
          concept_video_like: { where: { user_uuid: uuid } },
          concept: {
            select: {
              cls_id: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: pageSize,
      });
      return {
        videos,
        totalPage: Math.ceil(totalCount / pageSize),
      };
    }

    // Fetch pinned videos
    const pinnedVideos = await this.prisma.concept_video.findMany({
      where: {
        concept: {
          cls_id: learningSys.cls_id!,
        },
        deleted_at: null,
        concept_video_share: {
          pinned: true,
          class_table_id: class_id,
        },
        OR: [
          { scope: ProblemSolvingScope.ALL },
          { scope: ProblemSolvingScope.CLASS, concept_video_share: { class_table_id: class_id } },
          { user_uuid: uuid, scope: 'ME' },
        ],
      },
      include: {
        concept_video_share: true,
        concept_video_data: {
          include: {
            _count: { select: { concept_video_comment: true } },
          },
        },
        concept_video_like: { where: { user_uuid: uuid } },
        concept: {
          select: {
            cls_id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Fetch 'my' videos (excluding pinned videos)
    const myVideos = await this.prisma.concept_video.findMany({
      where: {
        user_uuid: uuid,
        concept: {
          cls_id: learningSys.cls_id!,
        },
        deleted_at: null,
        concept_video_share: {
          class_table_id: class_id,
          pinned: false,
        },
      },
      include: {
        concept_video_share: true,
        concept_video_data: {
          include: {
            _count: { select: { concept_video_comment: true } },
          },
        },
        concept_video_like: { where: { user_uuid: uuid } },
        concept: {
          select: {
            cls_id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Merge pinned and 'my' videos
    let combinedVideos = [...pinnedVideos, ...myVideos];

    let otherVideos = [];

    if (!onlyMine && combinedVideos.length < skip + pageSize) {
      // Fetch other videos only if needed
      const remainingSkip = Math.max(0, skip - combinedVideos.length);
      const remainingTake = pageSize - Math.max(0, combinedVideos.length - skip);

      otherVideos = await this.prisma.concept_video.findMany({
        where: {
          OR: [{ scope: ProblemSolvingScope.ALL }, { scope: ProblemSolvingScope.CLASS, concept_video_share: { class_table_id: class_id } }],
          concept: {
            cls_id: learningSys.cls_id!,
          },
          deleted_at: null,
          NOT: {
            user_uuid: uuid,
            concept_video_share: {
              class_table_id: class_id,
            },
          },
        },
        include: {
          concept_video_share: true,
          concept_video_data: {
            include: {
              _count: { select: { concept_video_comment: true } },
            },
          },
          concept_video_like: { where: { user_uuid: uuid } },
          concept: {
            select: {
              cls_id: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: remainingSkip,
        take: remainingTake,
      });

      combinedVideos = [...combinedVideos, ...otherVideos];
    }

    // Apply global pagination
    const paginatedVideos = combinedVideos.slice(skip, skip + pageSize);

    // Calculate total pages based on combined video count
    const totalVideoCount = await this.prisma.concept_video.count({
      where: {
        OR: [
          { scope: ProblemSolvingScope.ALL },
          { scope: ProblemSolvingScope.CLASS, concept_video_share: { class_table_id: class_id } },
          { user_uuid: uuid, scope: 'ME' },
        ],
        concept: {
          cls_id: learningSys.cls_id!,
        },
        deleted_at: null,
      },
    });
    const totalPage = Math.ceil(totalVideoCount / pageSize);

    return { totalPage, videos: paginatedVideos };
  }

  async pinSharedVideoOnTop(dto: PinSharedVideoOnTopDto, classInfo: ClassInfo, concept_video_id: number) {
    const { pin } = dto;

    const clazz = await this.prisma.school_class.findFirst({
      where: {
        school: { school_id: classInfo.school_id },
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
      select: { id: true },
    });

    if (!clazz) throw new HttpException(noClassFoundMessage, 404);

    const class_id = clazz.id;

    // 영상이 있는지 먼저 체크합니다.
    const concept_video = await this.prisma.concept_video.findUnique({
      where: {
        id: concept_video_id,
        deleted_at: null,
      },
    });

    if (!concept_video) {
      throw new HttpException('concept_video not found', 404);
    }

    // 영상 공유가 잘 되었는지 체크합니다.
    const share = await this.prisma.concept_video_share.findFirst({
      where: {
        concept_video_id: concept_video_id,
        class_table_id: class_id,
      },
    });

    if (!share) {
      throw new HttpException('concept_video_share not found', 404);
    }

    // 이미 같은 학급 같은 소단원에 상단 고정이 된 영상이 있는지 확인합니다.

    const alreadyPinned = await this.prisma.concept_video_share.findFirst({
      where: {
        class_table_id: class_id,
        concept_video: {
          id: concept_video_id,
          deleted_at: null,
        },
        pinned: true,
      },
    });

    // 이미 같은 학급, 같은 소단원에 상단 고정된 영상이 있고, 그게 이 영상이 아니라면 해당 영상의 상단 고정을 해제하고
    // 고정 여부를 업데이트 합니다.
    if (alreadyPinned && alreadyPinned.concept_video_id !== concept_video_id) {
      return (
        await this.prisma.$transaction([
          this.prisma.concept_video_share.update({
            where: {
              id: alreadyPinned.id,
            },
            data: {
              pinned: false,
            },
          }),
          this.prisma.concept_video_share.update({
            where: {
              id: share.id,
            },
            data: {
              pinned: pin,
            },
          }),
        ])
      )[1];
    }
    // 상단 고정 여부를 업데이트 합니다.
    return await this.prisma.concept_video_share.update({
      where: {
        id: share.id,
      },
      data: {
        pinned: pin,
      },
    });
  }

  async createSharedVideoForConcept(dto: CreateSharedVideoForConceptDto, uuid: string, classInfo: ClassInfo) {
    const { videoPath, scope, learningSysId } = dto;

    const { concept, learning_sys } = await this.getConceptAndSysFromLearningSysId(learningSysId);

    if (!concept) throw new HttpException('해당 표준학습체계 ID에 대응되는 매튜 학습체계가 없습니다.', 404);

    const clazz = await this.prisma.school_class.findFirst({
      where: {
        school: { school_id: classInfo.school_id },
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
      select: { id: true },
    });

    if (!clazz) throw new HttpException(noClassFoundMessage, 404);

    const class_id = clazz.id;

    if (!learning_sys) throw new HttpException(noLearningSysWarning, 404);

    return await this.prisma.concept_video.create({
      data: {
        concept_id: concept.id,
        scope: scope,
        user_uuid: uuid,
        video_path: videoPath,
        status: VideoProcessingStatus.IDLE,
        concept_video_share: {
          create: {
            class_table_id: class_id,
            pinned: false,
          },
        },
        concept_video_data: {
          create: {
            like_count: 0,
            view_count: 0,
          },
        },
      },
      include: {
        concept_video_share: true,
        concept: {
          select: {
            cls_id: true,
          },
        },
      },
    });
  }

  async getLearningSysIdByCurriculumId(curriculumId: string) {
    return (
      await this.prisma.learning_sys.findFirst({
        where: {
          cls_id: curriculumId,
        },
        select: {
          id: true,
        },
      })
    )?.id;
  }

  async updateCommentForConcept(dto: UpdateCommentForConceptDto, uuid: string, commentId: number) {
    const originalComment = await this.prisma.concept_video_comment.findUnique({
      where: {
        id: commentId,
        deleted_at: null,
      },
    });

    if (!originalComment) {
      throw new HttpException('comment not found', 404);
    }

    if (originalComment.user_uuid !== uuid) {
      throw new HttpException('permission denied. only either admin or creator can update', 403);
    }

    return await this.prisma.concept_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: dto.content,
        updated_at: new Date(),
      },
    });
  }

  async likeSharedVideo(dto: LikeSharedVideoDto, uuid: string) {
    // 먼저 해당 영상이 존재하는지 점검합니다.

    const exist = await this.prisma.concept_video.findUnique({
      where: {
        id: dto.concept_video_id,
        deleted_at: null,
      },
    });

    if (!exist) {
      throw new HttpException('concept_video not found', 404);
    }

    // 좋아요 여부에 대해서 데이터를 탐색해봅니다.

    const likeData = await this.prisma.concept_video_like.findFirst({
      where: {
        concept_video_id: dto.concept_video_id,
        user_uuid: uuid,
      },
    });

    if (likeData && dto.like) {
      throw new HttpException('이미 좋아요를 누른 영상입니다.', 400);
    }

    if (!likeData && !dto.like) {
      throw new HttpException('좋아요를 하지 않은 영상입니다.', 400);
    }

    if (likeData && !dto.like) {
      return await this.prisma.$transaction([
        this.prisma.concept_video_like.delete({
          where: {
            id: likeData.id,
          },
          select: {
            concept_video_id: true,
          },
        }),
        this.prisma.concept_video_data.update({
          where: {
            concept_video_id: dto.concept_video_id,
          },
          data: {
            like_count: {
              decrement: 1,
            },
          },
          select: {
            like_count: true,
          },
        }),
      ]);
    }

    return await this.prisma.$transaction([
      this.prisma.concept_video_like.create({
        data: {
          concept_video_id: dto.concept_video_id,
          user_uuid: uuid,
        },
        select: {
          concept_video_id: true,
        },
      }),
      this.prisma.concept_video_data.update({
        where: {
          concept_video_id: dto.concept_video_id,
        },
        data: {
          like_count: {
            increment: 1,
          },
        },
        select: {
          like_count: true,
        },
      }),
    ]);
  }

  async deleteCommentForConcept(uuid: string, commentId: number) {
    const originalComment = await this.prisma.concept_video_comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!originalComment) {
      throw new HttpException('comment not found', 404);
    }

    if (originalComment.deleted_at !== null) {
      throw new HttpException('comment already deleted', 400);
    }

    if (originalComment.user_uuid !== uuid) {
      throw new HttpException('permission denied. only either admin or creator can delete', 403);
    }

    return await this.prisma.concept_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async deleteSharedVideoForConcept(uuid: string, videoId: number) {
    const originalVideo = await this.prisma.concept_video.findUnique({
      where: {
        id: videoId,
      },
    });

    if (!originalVideo) {
      throw new HttpException('video not found', 404);
    }

    if (originalVideo.deleted_at !== null) {
      throw new HttpException('video already deleted', 400);
    }

    if (originalVideo.user_uuid !== uuid) {
      throw new HttpException('permission denied. only either admin or creator can delete', 403);
    }

    return await this.prisma.concept_video.update({
      where: {
        id: videoId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async getConceptAndSysFromLearningSysId(learningSysId: number) {
    try {
      const learningSys = await this.prisma.learning_sys.findUnique({
        where: {
          id: learningSysId,
        },
      });
      return {
        concept: await this.prisma.concept.findFirst({
          where: {
            cls_id: learningSys!.cls_id!,
            content_status: ContentStatus.ACTIVED,
          },
        }),
        learning_sys: learningSys,
      };
    } catch (error) {
      return {
        concept: null,
        learning_sys: null,
      };
    }
  }

  async createReferenceData(dto: CreateReferenceDataDto, uuid: string, classInfo: ClassInfo) {
    const { concept, learning_sys } = await this.getConceptAndSysFromClsID(dto.clsId);

    if (!concept || !learning_sys) {
      throw new HttpException(noLearningSysWarning, 404);
    }

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
      throw new HttpException(noClassErrorMessage, 404);
    }

    console.log(concept, learning_sys);

    const conceptReferenceData = {
      concept_id: concept.id,
      class_table_id: schoolClass.id,
      learning_sys_id: learning_sys.id,
      uuid: uuid,
      scope: dto.scope,
      concept_reference_data: {
        create: {
          view_count: 0,
          like_count: 0,
          content_title: dto.title,
          content_data: dto.content,
          concept_reference_file: {
            createMany: {
              data: dto.filePaths.map((v) => {
                return {
                  path: v,
                };
              }),
            },
          },
        },
      },
    };

    console.log(conceptReferenceData);

    return await this.prisma.concept_reference.create({
      data: conceptReferenceData,
      include: {
        concept_reference_data: {
          include: { concept_reference_file: true },
        },
      },
    });
  }
  async getConceptAndSysFromClsID(cls_id: string) {
    try {
      const learningSys = await this.prisma.learning_sys.findFirst({
        where: {
          cls_id: cls_id,
        },
      });

      const concept = await this.prisma.concept.findFirst({
        where: {
          cls_id: cls_id,
          content_status: ContentStatus.ACTIVED,
        },
      });
      return { concept: concept, learning_sys: learningSys };
    } catch (error) {
      return { concept: null, learning_sys: null };
    }
  }

  async getReferenceData(dto: GetReferenceDataDto, uuid: string, classInfo: ClassInfo) {
    const query = {
      where: {
        learning_sys: {
          cls_id: dto.clsId,
        },
        OR: [
          {
            uuid: uuid,
            scope: ProblemSolvingScope.ME,
          },
          {
            scope: ProblemSolvingScope.ALL,
          },
          {
            scope: ProblemSolvingScope.CLASS,
            class_table: {
              grade: classInfo.user_grade,
              class: classInfo.user_class,
              school: {
                school_id: classInfo.school_id,
              },
            },
          },
        ],
        concept_reference_data: {
          deleted_at: null,
        },
      },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    };

    const totalCount = await this.prisma.concept_reference.count(query);

    if (totalCount === 0) {
      return {
        totalCount: 0,
        data: [],
      };
    }

    const data = await this.prisma.concept_reference.findMany({
      ...query,
      include: {
        concept_reference_data: true,
      },
      orderBy: {
        id: 'desc', //조회수 별로 보이는게 기획이긴 한데, 이러면 새롭게 올린 참고자료가 맨 끝 페이지로 가서 보이는데 정상적인 기획인가?
        // concept_reference_data: {
        //   view_count: 'desc',
        // },
      },
    });

    return {
      totalCount,
      data,
    };
  }

  async increaseViewCountForReferenceData(referenceDataId: number, uuid: string, classInfo: ClassInfo) {
    const referenceData = await this.prisma.concept_reference.findUnique({
      where: {
        id: referenceDataId,
      },
      include: {
        concept_reference_data: true,
      },
    });

    if (!referenceData) {
      throw new HttpException(noRefDataError, 404);
    }
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
      throw new HttpException(noClassErrorMessage, 404);
    }

    if (referenceData.scope === ProblemSolvingScope.ME && referenceData.uuid !== uuid) {
      throw new HttpException('나에게만 공개된 참고자료는 나만 볼 수 있습니다.', 403);
    }

    if (referenceData.scope === ProblemSolvingScope.CLASS && referenceData.class_table_id !== schoolClass.id) {
      throw new HttpException('학급에 공개된 참고자료는 학급 구성원만 볼 수 있습니다.', 403);
    }

    await this.prisma.concept_reference.update({
      where: {
        id: referenceDataId,
      },
      data: {
        concept_reference_data: {
          update: {
            view_count: {
              increment: 1,
            },
          },
        },
      },
    });
  }

  async increaseViewCountForSharedVideo(videoId: number, uuid: string, classInfo: ClassInfo) {
    const video = await this.prisma.concept_video.findUnique({
      where: {
        id: videoId,
      },
      include: {
        concept_video_data: true,
        concept_video_share: true,
      },
    });

    if (!video) {
      throw new HttpException('해당 공유풀이영상이 존재하지 않습니다.', 404);
    }
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
      throw new HttpException(noClassErrorMessage, 404);
    }

    if (video.scope === ProblemSolvingScope.ME && video.user_uuid !== uuid) {
      throw new HttpException('나에게만 공개된 공유풀이영상는 나만 볼 수 있습니다.', 403);
    }

    if (video.scope === ProblemSolvingScope.CLASS && video.concept_video_share?.class_table_id !== schoolClass.id) {
      throw new HttpException('학급에 공개된 공유풀이영상는 학급 구성원만 볼 수 있습니다.', 403);
    }

    await this.prisma.concept_reference.update({
      where: {
        id: videoId,
      },
      data: {
        concept_reference_data: {
          update: {
            view_count: {
              increment: 1,
            },
          },
        },
      },
    });
  }

  async getStudyByLearningSysId(learning_sys_id: number): Promise<study[]> {
    return await this.prisma.study.findMany({
      where: {
        learning_sys_id: learning_sys_id,
      },
    });
  }

  async getStudyByLearningSysIds(learning_sys_id: number[]): Promise<study[]> {
    return await this.prisma.study.findMany({
      where: {
        learning_sys_id: {
          in: learning_sys_id,
        },
      },
    });
  }

  async getStudyByLearningSysIdAndType(learning_sys_id: number, type: StudyType): Promise<study | null> {
    return await this.prisma.study.findFirst({
      where: {
        learning_sys_id: learning_sys_id,
        type: type,
      },
    });
  }

  async getStudyProblesmWithPerforms(studyIds: number[], class_uuid: string[]) {
    return await this.prisma.study_problem.findMany({
      include: {
        study_perform: {
          where: {
            user_uuid: {
              in: class_uuid,
            },
          },
        },
      },
      where: {
        study_id: {
          in: studyIds,
        },
      },
    });
  }

  async getStudiesByLearningSysIds(learningSysIds: number[]) {
    return await this.prisma.study.findMany({
      where: {
        learning_sys_id: {
          in: learningSysIds,
        },
      },
    });
  }

  async getStudiesByLearningSysIdsAndType(learningSysIds: number[], type: StudyType) {
    return await this.prisma.study.findMany({
      where: {
        learning_sys_id: {
          in: learningSysIds,
        },
        type: type,
      },
    });
  }

  async getStudiesByIds(ids: number[]) {
    return await this.prisma.study.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async getReferenceDataDetail(id: number, uuid: string, classInfo: ClassInfo) {
    const referenceData = await this.prisma.concept_reference.findUnique({
      where: {
        id: id,
        OR: [
          {
            uuid: uuid,
            scope: ProblemSolvingScope.ME,
          },
          {
            scope: ProblemSolvingScope.ALL,
          },
          {
            scope: ProblemSolvingScope.CLASS,
            class_table: {
              grade: classInfo.user_grade,
              class: classInfo.user_class,
              school: {
                school_id: classInfo.school_id,
              },
            },
          },
        ],
        concept_reference_data: {
          deleted_at: null,
        },
      },
      include: {
        concept_reference_data: {
          select: {
            like_count: true,
            concept_reference_file: true,
            content_data: true,
            content_title: true,
            view_count: true,
          },
        },
        concept_reference_like: {
          where: {
            user_uuid: uuid,
          },
        },
        _count: {
          select: {
            concept_reference_comment: true,
          },
        },
      },
    });

    if (!referenceData) {
      throw new HttpException(noRefDataError, 404);
    }

    return referenceData;
  }

  async likeReferenceData(referenceDataId: number, like: boolean, uuid: string, classInfo: ClassInfo) {
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
      throw new HttpException(noClassErrorMessage, 500);
    }

    const likeData = await this.prisma.concept_reference_like.findFirst({
      where: {
        concept_reference_id: referenceDataId,
        user_uuid: uuid,
      },
    });

    if (like && likeData) {
      throw new HttpException('이미 좋아요 누른 자료입니다.', 409);
    }
    if (!like && !likeData) {
      throw new HttpException('좋아요를 누르지 않은 자료입니다.', 409);
    }

    if (like) {
      return await this.prisma.$transaction([
        this.prisma.concept_reference_like.create({
          data: {
            concept_reference_id: referenceDataId,
            user_uuid: uuid,
          },
        }),
        this.prisma.concept_reference_data.update({
          where: {
            id: referenceDataId,
          },
          data: {
            like_count: {
              increment: 1,
            },
          },
        }),
      ]);
    } else {
      return await this.prisma.$transaction([
        this.prisma.concept_reference_like.delete({
          where: {
            id: likeData!.id,
          },
        }),
        this.prisma.concept_reference_data.update({
          where: {
            id: referenceDataId,
          },
          data: {
            like_count: {
              decrement: 1,
            },
          },
        }),
      ]);
    }
  }
  async deleteReferenceData(id: number, uuid: string) {
    const data = await this.prisma.concept_reference.findUnique({
      where: {
        id: id,
      },
    });
    const content = await this.prisma.concept_reference_data.findUnique({
      where: {
        concept_reference_id: id,
      },
    });

    if (!data || !content) {
      throw new HttpException(noRefDataError, 404);
    }

    if (data.uuid !== uuid) {
      throw new HttpException('작성자만 삭제할 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    await this.prisma.concept_reference_file.deleteMany({
      where: {
        concept_reference_data_id: content.id,
      },
    });

    await this.prisma.concept_reference_data.delete({
      where: {
        concept_reference_id: id,
      },
    });

    await this.prisma.concept_reference_comment.deleteMany({
      where: {
        concept_reference_id: id,
      },
    });

    await this.prisma.concept_reference_like.deleteMany({
      where: {
        concept_reference_id: id,
      },
    });

    return await this.prisma.concept_reference.delete({
      where: {
        id: id,
      },
    });
  }

  async editReferenceData(dto: EditReferenceDataDto, uuid: string, id: number) {
    const data = await this.prisma.concept_reference.findUnique({
      where: {
        id: id,
      },
    });

    if (!data) {
      throw new HttpException(noRefDataError, 404);
    }

    if (data.uuid !== uuid) {
      throw new HttpException('작성자만 변경할 수 있습니다.', HttpStatus.FORBIDDEN);
    }

    return await this.prisma.concept_reference.update({
      where: {
        id: id,
      },
      data: {
        concept_reference_data: {
          update: {
            content_data: dto.content,
            updated_at: new Date(),
          },
        },
      },
      include: {
        concept_reference_data: {
          select: {
            like_count: true,
            concept_reference_file: true,
            content_data: true,
            content_title: true,
            view_count: true,
          },
        },
        concept_reference_like: {
          where: {
            user_uuid: uuid,
          },
        },
        _count: {
          select: {
            concept_reference_comment: true,
          },
        },
      },
    });
  }

  async createStudy(learningSysId: number, type: StudyType): Promise<study> {
    return await this.prisma.study.create({
      data: {
        learning_sys_id: learningSysId,
        type: type,
        basic_video: '',
      },
    });
  }

  async createStudyProblems(stduyId: number, problems: Array<problem>) {
    return await Promise.all(
      problems.map(async (problem) => {
        return await this.prisma.study_problem.create({
          data: {
            study_id: stduyId,
            problem_id: problem.id,
          },
        });
      }),
    );
  }

  async createStudyProblemsById(stduyId: number, problemIds: number[]) {
    return await Promise.all(
      problemIds.map(async (problemId) => {
        return await this.prisma.study_problem.create({
          data: {
            study_id: stduyId,
            problem_id: problemId,
          },
        });
      }),
    );
  }

  async createStudyPerform(studyPerfrom: CreateStudyPerform) {
    const isExist = await this.prisma.study_perform.findFirst({
      where: {
        study_problem_id: studyPerfrom.study_problem_id,
        user_uuid: studyPerfrom.user_uuid,
        solving_end: null,
      },
    });

    if (isExist) return isExist;

    return await this.prisma.study_perform.create({
      data: {
        study_problem_id: studyPerfrom.study_problem_id,
        user_uuid: studyPerfrom.user_uuid,
        confidence: studyPerfrom.confidence,
        is_correct: studyPerfrom.is_correct,
        solving_start: new Date(),
      },
    });
  }

  async getStudyProblemsByStudyIdsAndUuidWithPerform(studyId: number[], uuid: string) {
    return await this.prisma.study_problem.findMany({
      include: {
        study_perform: {
          where: {
            user_uuid: uuid,
          },
        },
      },
      where: {
        study_id: {
          in: studyId,
        },
      },
    });
  }

  async getStudyPerformsByProblemId(problemId: number): Promise<study_perform[]> {
    const performs: study_perform[] = [];
    const studyProblems = await this.prisma.study_problem.findMany({
      include: {
        study_perform: true,
      },
      where: {
        problem_id: problemId,
      },
    });
    studyProblems.forEach((v) => performs.push(...v.study_perform));
    return performs;
  }

  async getStudyPerformByStudyProblemId(studyProblemId: number, uuid: string): Promise<study_perform | null> {
    return await this.prisma.study_perform.findFirst({
      where: {
        user_uuid: uuid,
        study_problem_id: studyProblemId,
      },
    });
  }

  async getUnstudiedProblemsByIdsAndUuid(studyProblemIds: number[], uuid: string) {
    const studiedPerforms = await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblemIds,
        },
        user_uuid: uuid,
      },
    });

    if (!studiedPerforms.length) {
      return await this.prisma.study_problem.findMany({
        where: {
          id: {
            in: studyProblemIds,
          },
        },
      });
    }

    const studyProblemId = studiedPerforms.map((v) => v.study_problem_id);
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        id: {
          in: studyProblemId,
        },
      },
    });
    const problemIds = [...new Set(studyProblems.map((v) => v.problem_id))];
    return await this.prisma.study_problem.findMany({
      where: {
        id: {
          in: studyProblemIds,
        },
        problem_id: {
          notIn: problemIds,
        },
      },
    });
  }

  async getUnstudiedProblemsByProblemIdsAndUuid(problemIds: number[], uuid: string) {
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        problem_id: {
          in: problemIds,
        },
      },
    });
    const studyProblemIds = studyProblems.map((v) => v.id);
    const studyPerforms = await this.prisma.study_perform.findMany({
      where: {
        user_uuid: uuid,
        study_problem_id: {
          in: studyProblemIds,
        },
        solving_end: null,
      },
    });
    const unstudied = studyPerforms.map((v) => v.study_problem_id);

    return studyProblems.filter((v) => unstudied.includes(v.id));
  }

  async getStudyProblemsByStudyIdAndProblemIds(studyId: number, problemIds: number[]) {
    return await this.prisma.study_problem.findMany({
      where: {
        study_id: studyId,
        problem_id: {
          in: problemIds,
        },
      },
    });
  }

  async getStudyProblemsByStudyIdsAndProblemIds(studyIds: number[], problemIds: number[]) {
    return await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studyIds,
        },
        problem_id: {
          in: problemIds,
        },
      },
    });
  }

  async createStudyProblem(studyId: number, problemId: number) {
    return await this.prisma.study_problem.create({
      data: {
        study_id: studyId,
        problem_id: problemId,
      },
    });
  }

  async getStudiesByLearningSysId(learningSysId: number) {
    return await this.prisma.study.findMany({
      where: {
        learning_sys_id: learningSysId,
      },
    });
  }

  async getIncorrectPerformsByStudyProblemIdsAndUuid(studyProblemIds: number[], uuid: string) {
    return await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblemIds,
        },
        user_uuid: uuid,
        is_correct: 0,
      },
    });
  }

  async getStudyPerformsByStudyProblemIdsAndUuid(studyProblemIds: number[], uuid: string) {
    return await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblemIds,
        },
        user_uuid: uuid,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getStudyProblemsByStudyId(studyId: number) {
    return await this.prisma.study_problem.findMany({
      where: {
        study_id: studyId,
      },
      include: {
        problem: true,
      },
    });
  }

  async getStudyProblemsByStudyIds(studyIds: number[]) {
    return await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studyIds,
        },
      },
    });
  }

  async isPerformCreated(studyProblemIds: number[], uuid: string) {
    return await this.prisma.study_perform.findMany({
      where: {
        user_uuid: uuid,
        study_problem_id: {
          in: studyProblemIds,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getStudiedProblemsByProblemIdsAndUUid(problemIds: number[], uuid: string) {
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        problem_id: {
          in: problemIds,
        },
      },
    });
    const studyProblemsIds = studyProblems.map((v) => v.id);
    const studyPerform = await this.prisma.study_perform.findMany({
      where: {
        user_uuid: uuid,
        study_problem_id: {
          in: studyProblemsIds,
        },
        solving_end: {
          not: null,
        },
      },
    });
    const studied = studyPerform.map((v) => v.study_problem_id);
    return studyProblems.filter((v) => studied.includes(v.id));
  }

  async getStudyProblemByStudyIdAndProblemId(studyId: number, problemId: number) {
    return await this.prisma.study_problem.findFirst({
      where: {
        study_id: studyId,
        problem_id: problemId,
      },
    });
  }

  async getStudyProblemByIds(studyProblemIds: number[]) {
    return await this.prisma.study_problem.findMany({
      where: {
        id: {
          in: studyProblemIds,
        },
      },
    });
  }
}
