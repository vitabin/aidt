/* eslint-disable sonarjs/no-duplicate-string */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import {
  PinSharedVideoOnTopDto,
  UpdateCommentForConceptDto,
  CreateCommentForConceptDto,
  CreateReferenceDataDto,
  GetReferenceDataDto,
  GetSharedVideoForConceptDto,
} from '../application';
import { LikeSharedVideoDto } from '../submodules/shared-video/application/dto/like-shared-video.dto';
import { StudyQueryRepository } from './study.query';
import {
  ProblemSolvingScope,
  VideoProcessingStatus,
  StudyType,
  concept_video_like,
  concept_video_share,
  study,
  study_perform,
  concept,
  school_class,
  ConceptType,
  learning_sys,
  UnitType,
  ContentStatus,
} from '@prisma/client';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { EProblemSolvingScope } from '../submodules/shared-video/infrastructure/concept-video.entity';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CreateSharedVideoForConceptDto } from '../submodules/shared-video/application/dto';

const UUID = 'user-uuid';
const VIDEO_ID = 1;
const COMMENT_ID = 1;
const STUDY_ID = 1;
const CLASS_ID = 2;
const LEARNING_SYS_ID = 1;
const CONCEPT_VIDEO_ID = 1;
const LIKE_TRUE = true;
const LIKE_FALSE = false;
const REFERENCE_DATA_ID = 1;
const CLS_ID = 'classID';

const MOCK_CONCEPT_VIDEO = {
  id: CONCEPT_VIDEO_ID,
  created_at: new Date(),
  deleted_at: null,
  learning_sys_id: LEARNING_SYS_ID,
  scope: ProblemSolvingScope.ALL,
  status: VideoProcessingStatus.DONE,
  user_uuid: UUID,
  video_path: '23423',
  pinned: true,
  concept_id: 111,
};

const MOCK_SCHOOL_CLASS = { id: CLASS_ID, school_id: 1234, grade: '3', class: '5', created_at: new Date(), learning_map_id: 1, semester: 1 };
const MOCK_CONCEPT: concept = {
  id: 1,
  cls_id: CLS_ID,
  created_at: new Date(),
  type: ConceptType.ADVANCED,
  latex_data: 'asdfasdf',
  type_name: '고급',
  created_by: 234534,
  content_status: ContentStatus.ACTIVED,
  is_algeomath: true,
  order_no: 1,
  updated_at: new Date(),
};
const MOCK_LEARNING_SYS: learning_sys = {
  id: LEARNING_SYS_ID,
  cls_id: CLS_ID,
  achievement_desc: 'asdfasdf',
  achievement_id: 'asdfa',
  created_at: new Date(),
  deleted_at: null,
  full_name: 'asdfasdf',
  index: 1,
  is_deleted: false,
  name: 'asdfasdf',
  learning_sys_doc_id: 1,
  parent_id: 1,
  type: UnitType.CHAPTER,
  updated_at: new Date(),
  pre_learning_map_id: 1,
  grade: 1,
  semester: 1,
};

describe('StudyQueryRepository', () => {
  let repository: StudyQueryRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyQueryRepository,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    repository = module.get<StudyQueryRepository>(StudyQueryRepository);
    prisma = module.get(PrismaService);
  });

  it('정의되어 있어야 합니다', () => {
    expect(repository).toBeDefined();
  });

  describe('getSharedVideoForConcept', () => {
    const dto: GetSharedVideoForConceptDto = { learningSysId: 1, page: 1, pageSize: 10, onlyMine: false };

    it('전역 페이징을 사용하여 비디오를 올바르게 가져와야 합니다', async () => {
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      const pinnedVideos = [MOCK_CONCEPT_VIDEO];
      const myVideos = [MOCK_CONCEPT_VIDEO];
      const otherVideos = [MOCK_CONCEPT_VIDEO];
      const totalVideoCount = 3;

      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.learning_sys, 'findUnique').mockResolvedValue(MOCK_LEARNING_SYS);
      jest
        .spyOn(prisma.concept_video, 'findMany')
        .mockResolvedValueOnce(pinnedVideos) // Pinned videos
        .mockResolvedValueOnce(myVideos) // My videos
        .mockResolvedValueOnce(otherVideos); // Other videos
      jest.spyOn(prisma.concept_video, 'count').mockResolvedValue(totalVideoCount);

      const result = await repository.getSharedVideoForConcept(dto, UUID, classInfo);

      expect(result.totalPage).toEqual(Math.ceil(totalVideoCount / dto.pageSize));
      expect(result.videos).toEqual([...pinnedVideos, ...myVideos, ...otherVideos].slice(0, dto.pageSize));

      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          school: { school_id: classInfo.school_id },
          grade: classInfo.user_grade,
          class: classInfo.user_class,
        },
        select: { id: true },
      });
      expect(prisma.concept_video.findMany).toHaveBeenCalledTimes(3); // Pinned, My, and Other videos
    });

    it('클래스를 찾지 못하는 경우 에러를 처리해야 합니다', async () => {
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(null);

      await expect(repository.getSharedVideoForConcept(dto, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('onlyMine이 true일 때 다른 비디오를 가져오지 않아야 합니다', async () => {
      const dtoWithOnlyMine: GetSharedVideoForConceptDto = { learningSysId: 1, page: 1, pageSize: 10, onlyMine: true };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      const myVideos = [MOCK_CONCEPT_VIDEO];
      const totalVideoCount = 1;

      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.learning_sys, 'findUnique').mockResolvedValue(MOCK_LEARNING_SYS);
      jest
        .spyOn(prisma.concept_video, 'findMany')
        .mockResolvedValueOnce([]) // Pinned videos
        .mockResolvedValueOnce(myVideos); // My videos
      jest.spyOn(prisma.concept_video, 'count').mockResolvedValue(totalVideoCount);

      const result = await repository.getSharedVideoForConcept(dtoWithOnlyMine, UUID, classInfo);

      expect(result.totalPage).toEqual(Math.ceil(totalVideoCount / dtoWithOnlyMine.pageSize));
      expect(result.videos).toEqual([...myVideos].slice(0, dtoWithOnlyMine.pageSize));

      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          school: { school_id: classInfo.school_id },
          grade: classInfo.user_grade,
          class: classInfo.user_class,
        },
        select: { id: true },
      });
      expect(prisma.concept_video.findMany).toHaveBeenCalledTimes(2); // Pinned and My videos
    });
  });

  describe('getStudyById', () => {
    it('ID로 스터디를 반환해야 합니다', async () => {
      const study: study = { id: STUDY_ID, basic_video: '2', created_at: new Date(), learning_sys_id: LEARNING_SYS_ID, type: StudyType.ADDITIONAL };
      jest.spyOn(prisma.study, 'findUnique').mockResolvedValue(study);

      const result = await repository.getStudyById(STUDY_ID);
      expect(result).toEqual(study);
      expect(prisma.study.findUnique).toHaveBeenCalledWith({ where: { id: STUDY_ID } });
    });
  });

  describe('getStudyByProblemId', () => {
    it('문제 ID로 스터디를 반환해야 합니다', async () => {
      const problem_id = 1;
      const study = { id: problem_id, basic_video: '2', created_at: new Date(), learning_sys_id: LEARNING_SYS_ID, type: StudyType.ADDITIONAL };
      jest.spyOn(prisma.study, 'findFirst').mockResolvedValue(study);

      const result = await repository.getStudyByProblemId(problem_id);
      expect(result).toEqual(study);
      expect(prisma.study.findFirst).toHaveBeenCalledWith({
        include: {
          study_problem: {
            where: {
              problem_id: problem_id,
            },
          },
        },
      });
    });

    it('스터디가 없으면 null을 반환해야 합니다', async () => {
      const problem_id = 1;
      jest.spyOn(prisma.study, 'findFirst').mockResolvedValue(null);

      const result = await repository.getStudyByProblemId(problem_id);
      expect(result).toBeNull();
      expect(prisma.study.findFirst).toHaveBeenCalledWith({
        include: {
          study_problem: {
            where: {
              problem_id: problem_id,
            },
          },
        },
      });
    });
  });

  describe('getStudyPerformByUuids', () => {
    it('유저 UUID 배열로 study_perform을 반환해야 합니다', async () => {
      const uuids = [UUID];
      const studyPerform: study_perform[] = [
        {
          id: 1,
          user_uuid: UUID,
          study_problem_id: STUDY_ID,
          created_at: new Date(),
          solving_end: new Date(),
          solving_start: new Date(),
          confidence: 0,
          submission_answer: '',
          is_correct: 1,
        },
      ];

      jest.spyOn(prisma.study_perform, 'findMany').mockResolvedValue(studyPerform);
      const result = await repository.getStudyPerformByUuids(uuids);
      expect(result).toEqual(studyPerform);
      expect(prisma.study_perform.findMany).toHaveBeenCalledWith({ where: { user_uuid: { in: uuids } } });
    });
  });

  describe('getStudyWithAllRelation', () => {
    it('유저 UUID 배열과 학습체계 ID로 모든 연관 관계를 가진 스터디를 반환해야 합니다', async () => {
      const uuids = [UUID];
      const type = StudyType.ADDITIONAL;
      const study = {
        id: STUDY_ID,
        learning_sys_id: LEARNING_SYS_ID,
        type: type,
        study_problem: [{ study_perform: [{ user_uuid: UUID }] }],
        basic_video: '2',
        created_at: new Date(),
      };
      jest.spyOn(prisma.study, 'findFirstOrThrow').mockResolvedValue(study);

      const result = await repository.getStudyWithAllRelation(uuids, LEARNING_SYS_ID, type);
      expect(result).toEqual(study);
      expect(prisma.study.findFirstOrThrow).toHaveBeenCalledWith({
        include: {
          study_problem: {
            include: {
              study_perform: {
                where: { user_uuid: { in: uuids } },
              },
            },
          },
        },
        where: { learning_sys_id: LEARNING_SYS_ID, type: type },
      });
    });
  });

  describe('pinSharedVideoOnTop', () => {
    it('공유 영상을 상단에 고정해야 합니다', async () => {
      const dto: Partial<PinSharedVideoOnTopDto> = { pin: true };
      const share: concept_video_share = { id: 4, concept_video_id: CONCEPT_VIDEO_ID, class_table_id: CLASS_ID, pinned: true };
      const alreadyPinned = { id: 5, concept_video_id: 2, class_table_id: CLASS_ID, pinned: true };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(MOCK_CONCEPT_VIDEO);
      jest.spyOn(prisma.concept_video_share, 'findFirst').mockResolvedValueOnce(share).mockResolvedValueOnce(alreadyPinned);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([{ pinned: false }, { pinned: true }]);

      const result = await repository.pinSharedVideoOnTop(dto as PinSharedVideoOnTopDto, classInfo, CONCEPT_VIDEO_ID);
      expect(result).toEqual({ pinned: true });
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({ where: { id: CONCEPT_VIDEO_ID, deleted_at: null } });
      expect(prisma.concept_video_share.findFirst).toHaveBeenCalledWith({
        where: {
          class_table_id: CLASS_ID,
          concept_video: {
            id: CONCEPT_VIDEO_ID,
            deleted_at: null,
          },
          pinned: true,
        },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.concept_video_share.update({ where: { id: alreadyPinned.id }, data: { pinned: false } }),
        prisma.concept_video_share.update({ where: { id: share.id }, data: { pinned: dto.pin } }),
      ]);
    });

    it('개념 영상을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: Partial<PinSharedVideoOnTopDto> = { pin: true };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(null);

      await expect(repository.pinSharedVideoOnTop(dto as PinSharedVideoOnTopDto, classInfo, CONCEPT_VIDEO_ID)).rejects.toThrow(HttpException);
    });

    it('개념 영상 공유를 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: Partial<PinSharedVideoOnTopDto> = { pin: true };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(MOCK_CONCEPT_VIDEO);
      jest.spyOn(prisma.concept_video_share, 'findFirst').mockResolvedValue(null);

      await expect(repository.pinSharedVideoOnTop(dto as PinSharedVideoOnTopDto, classInfo, CONCEPT_VIDEO_ID)).rejects.toThrow(HttpException);
    });
  });

  describe('createSharedVideoForConcept', () => {
    it('개념에 대한 공유 영상을 생성해야 합니다', async () => {
      const dto: CreateSharedVideoForConceptDto = { videoPath: 'path', scope: EProblemSolvingScope.ALL, learningSysId: LEARNING_SYS_ID };
      const createdVideo = {
        id: CONCEPT_VIDEO_ID,
        created_at: new Date(),
        deleted_at: null,
        learning_sys_id: LEARNING_SYS_ID,
        scope: ProblemSolvingScope.ALL,
        status: VideoProcessingStatus.DONE,
        user_uuid: UUID,
        video_path: '23423',
        concept_video_share: { create: { class_table_id: CLASS_ID, pinned: false } },
        concept_id: 1,
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(prisma.concept, 'findFirst').mockResolvedValue(MOCK_CONCEPT);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_video, 'create').mockResolvedValue(createdVideo);
      jest.spyOn(prisma.learning_sys, 'findUnique').mockResolvedValue(MOCK_LEARNING_SYS);

      const result = await repository.createSharedVideoForConcept(dto, UUID, classInfo);
      expect(result).toEqual(createdVideo);
      expect(prisma.concept_video.create).toHaveBeenCalledWith({
        data: {
          concept_id: 1,
          scope: dto.scope,
          user_uuid: UUID,
          video_path: dto.videoPath,
          status: 'IDLE',
          concept_video_share: { create: { class_table_id: CLASS_ID, pinned: false } },
          concept_video_data: { create: { like_count: 0, view_count: 0 } },
        },
        include: { concept_video_share: true, concept: { select: { cls_id: true } } },
      });
    });

    it('학급을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: CreateSharedVideoForConceptDto = { videoPath: 'path', scope: EProblemSolvingScope.ALL, learningSysId: LEARNING_SYS_ID };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(null);

      await expect(repository.createSharedVideoForConcept(dto, UUID, classInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('likeSharedVideo', () => {
    it('공유 영상을 좋아요 해야 합니다', async () => {
      const dto: LikeSharedVideoDto = { concept_video_id: CONCEPT_VIDEO_ID, like: LIKE_TRUE };
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(MOCK_CONCEPT_VIDEO);
      jest.spyOn(prisma.concept_video_like, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([{ concept_video_id: CONCEPT_VIDEO_ID }, { like_count: 1 }]);

      const result = await repository.likeSharedVideo(dto, UUID);
      expect(result).toEqual([{ concept_video_id: CONCEPT_VIDEO_ID }, { like_count: 1 }]);
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({ where: { id: dto.concept_video_id, deleted_at: null } });
      expect(prisma.concept_video_like.findFirst).toHaveBeenCalledWith({ where: { concept_video_id: dto.concept_video_id, user_uuid: UUID } });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.concept_video_like.create({ data: { concept_video_id: dto.concept_video_id, user_uuid: UUID }, select: { concept_video_id: true } }),
        prisma.concept_video_data.update({
          where: { concept_video_id: dto.concept_video_id },
          data: { like_count: { increment: 1 } },
          select: { like_count: true },
        }),
      ]);
    });

    it('개념 영상을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: LikeSharedVideoDto = { concept_video_id: CONCEPT_VIDEO_ID, like: LIKE_TRUE };
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(null);

      await expect(repository.likeSharedVideo(dto, UUID)).rejects.toThrow(HttpException);
    });

    it('좋아요 데이터가 존재하고 좋아요가 true인 경우 오류를 발생시켜야 합니다', async () => {
      const dto: LikeSharedVideoDto = { concept_video_id: CONCEPT_VIDEO_ID, like: LIKE_TRUE };
      const likeData: concept_video_like = { id: CONCEPT_VIDEO_ID, concept_video_id: CONCEPT_VIDEO_ID, user_uuid: UUID, created_at: new Date() };
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(MOCK_CONCEPT_VIDEO);
      jest.spyOn(prisma.concept_video_like, 'findFirst').mockResolvedValue(likeData);

      await expect(repository.likeSharedVideo(dto, UUID)).rejects.toThrow(HttpException);
    });

    it('공유 영상의 좋아요를 해제해야 합니다', async () => {
      const dto: LikeSharedVideoDto = { concept_video_id: CONCEPT_VIDEO_ID, like: LIKE_FALSE };
      const likeData = { id: CONCEPT_VIDEO_ID, concept_video_id: CONCEPT_VIDEO_ID, user_uuid: UUID, created_at: new Date() };
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(MOCK_CONCEPT_VIDEO);
      jest.spyOn(prisma.concept_video_like, 'findFirst').mockResolvedValue(likeData);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([{ concept_video_id: CONCEPT_VIDEO_ID }, { like_count: 0 }]);

      const result = await repository.likeSharedVideo(dto, UUID);
      expect(result).toEqual([{ concept_video_id: CONCEPT_VIDEO_ID }, { like_count: 0 }]);
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({ where: { id: dto.concept_video_id, deleted_at: null } });
      expect(prisma.concept_video_like.findFirst).toHaveBeenCalledWith({ where: { concept_video_id: dto.concept_video_id, user_uuid: UUID } });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.concept_video_like.delete({ where: { id: likeData.id }, select: { concept_video_id: true } }),
        prisma.concept_video_data.update({
          where: { concept_video_id: dto.concept_video_id },
          data: { like_count: { decrement: 1 } },
          select: { like_count: true },
        }),
      ]);
    });
  });

  describe('createCommentForConcept', () => {
    const dto: CreateCommentForConceptDto = { content: 'Great video!' };
    it('해당 영상에 댓글을 생성해야 합니다', async () => {
      const videoData = {
        ...MOCK_CONCEPT_VIDEO,
        concept_video_data: { id: 2 },
      };

      const createdComment = {
        id: COMMENT_ID,
        content: dto.content,
        concept_video_data_id: videoData.concept_video_data.id,
        created_at: new Date(),
        deleted_at: null,
        updated_at: null,
        user_uuid: UUID,
      };

      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(videoData);
      jest.spyOn(prisma.concept_video_comment, 'create').mockResolvedValue(createdComment);

      const result = await repository.createCommentForConcept(dto, UUID, VIDEO_ID);
      expect(result).toEqual(createdComment);
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({
        where: { id: VIDEO_ID, deleted_at: null },
        include: { concept_video_data: true },
      });
      expect(prisma.concept_video_comment.create).toHaveBeenCalledWith({
        data: {
          content: dto.content,
          concept_video_data_id: videoData.concept_video_data.id,
          user_uuid: UUID,
        },
      });
    });

    it('개념 영상을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(null);
      await expect(repository.createCommentForConcept(dto, UUID, VIDEO_ID)).rejects.toThrow(HttpException);
    });

    it('개념 영상 데이터가 없으면 오류를 발생시켜야 합니다', async () => {
      const videoData = {
        ...MOCK_CONCEPT_VIDEO,
        concept_video_data: null,
      };
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(videoData);
      await expect(repository.createCommentForConcept(dto, UUID, VIDEO_ID)).rejects.toThrow(HttpException);
    });
  });

  describe('updateCommentForConcept', () => {
    it('해당 댓글을 수정해야 합니다', async () => {
      const dto: UpdateCommentForConceptDto = { content: 'Updated comment' };

      const originalComment = {
        id: COMMENT_ID,
        content: 'Original comment',
        user_uuid: UUID,
        created_at: new Date(),
        deleted_at: null,
        updated_at: null,
        concept_video_data_id: 1,
      };

      const updatedComment = {
        ...originalComment,
        content: dto.content,
        updated_at: new Date(),
      };

      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(originalComment);
      jest.spyOn(prisma.concept_video_comment, 'update').mockResolvedValue(updatedComment);

      const result = await repository.updateCommentForConcept(dto, UUID, COMMENT_ID);
      expect(result).toEqual(updatedComment);
      expect(prisma.concept_video_comment.findUnique).toHaveBeenCalledWith({
        where: { id: COMMENT_ID, deleted_at: null },
      });
      expect(prisma.concept_video_comment.update).toHaveBeenCalledWith({
        where: { id: COMMENT_ID },
        data: {
          content: dto.content,
          updated_at: expect.any(Date),
        },
      });
    });

    it('댓글을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: UpdateCommentForConceptDto = { content: 'Updated comment' };
      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(null);
      await expect(repository.updateCommentForConcept(dto, UUID, COMMENT_ID)).rejects.toThrow(HttpException);
    });

    it('사용자가 댓글 작성자가 아니면 오류를 발생시켜야 합니다', async () => {
      const dto: UpdateCommentForConceptDto = { content: 'Updated comment' };

      const originalComment = {
        id: COMMENT_ID,
        content: 'Original comment',
        user_uuid: 'different-uuid',
        created_at: new Date(),
        deleted_at: null,
        updated_at: null,
        concept_video_data_id: 1,
      };

      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(originalComment);
      await expect(repository.updateCommentForConcept(dto, UUID, COMMENT_ID)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteCommentForConcept', () => {
    it('해당 댓글을 삭제해야 합니다', async () => {
      const originalComment = {
        id: COMMENT_ID,
        content: 'Original comment',
        user_uuid: UUID,
        created_at: new Date(),
        deleted_at: null,
        updated_at: null,
        concept_video_data_id: 1,
      };

      const deletedComment = {
        ...originalComment,
        deleted_at: new Date(),
      };

      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(originalComment);
      jest.spyOn(prisma.concept_video_comment, 'update').mockResolvedValue(deletedComment);

      const result = await repository.deleteCommentForConcept(UUID, COMMENT_ID);
      expect(result).toEqual(deletedComment);
      expect(prisma.concept_video_comment.findUnique).toHaveBeenCalledWith({
        where: { id: COMMENT_ID },
      });
      expect(prisma.concept_video_comment.update).toHaveBeenCalledWith({
        where: { id: COMMENT_ID },
        data: {
          deleted_at: expect.any(Date),
        },
      });
    });

    it('댓글을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(null);
      await expect(repository.deleteCommentForConcept(UUID, COMMENT_ID)).rejects.toThrow(HttpException);
    });

    it('댓글이 이미 삭제되었으면 오류를 발생시켜야 합니다', async () => {
      const originalComment = {
        id: COMMENT_ID,
        content: 'Original comment',
        user_uuid: UUID,
        created_at: new Date(),
        deleted_at: new Date(),
        updated_at: null,
        concept_video_data_id: 1,
      };

      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(originalComment);
      await expect(repository.deleteCommentForConcept(UUID, COMMENT_ID)).rejects.toThrow(HttpException);
    });

    it('사용자가 댓글 작성자가 아니면 오류를 발생시켜야 합니다', async () => {
      const originalComment = {
        id: COMMENT_ID,
        content: 'Original comment',
        user_uuid: 'different-uuid',
        created_at: new Date(),
        deleted_at: null,
        updated_at: null,
        concept_video_data_id: 1,
      };

      jest.spyOn(prisma.concept_video_comment, 'findUnique').mockResolvedValue(originalComment);
      await expect(repository.deleteCommentForConcept(UUID, COMMENT_ID)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteSharedVideoForConcept', () => {
    it('공유 영상을 삭제해야 합니다', async () => {
      const originalVideo = {
        ...MOCK_CONCEPT_VIDEO,
        concept_video_data: null,
      };

      const deletedVideo = {
        ...originalVideo,
        deleted_at: new Date(),
      };

      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(originalVideo);
      jest.spyOn(prisma.concept_video, 'update').mockResolvedValue(deletedVideo);

      const result = await repository.deleteSharedVideoForConcept(UUID, VIDEO_ID);
      expect(result).toEqual(deletedVideo);
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({
        where: { id: VIDEO_ID },
      });
      expect(prisma.concept_video.update).toHaveBeenCalledWith({
        where: { id: VIDEO_ID },
        data: {
          deleted_at: expect.any(Date),
        },
      });
    });

    it('영상을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(null);
      await expect(repository.deleteSharedVideoForConcept(UUID, VIDEO_ID)).rejects.toThrow(HttpException);
    });

    it('이미 삭제된 영상이면 오류를 발생시켜야 합니다', async () => {
      const originalVideo = {
        ...MOCK_CONCEPT_VIDEO,
        deleted_at: new Date(),
        concept_video_data: null,
      };

      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(originalVideo);
      await expect(repository.deleteSharedVideoForConcept(UUID, VIDEO_ID)).rejects.toThrow(HttpException);
    });

    it('사용자가 영상 작성자가 아니면 오류를 발생시켜야 합니다', async () => {
      const originalVideo = {
        ...MOCK_CONCEPT_VIDEO,
        user_uuid: 'different-uuid',
      };

      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(originalVideo);
      await expect(repository.deleteSharedVideoForConcept(UUID, VIDEO_ID)).rejects.toThrow(HttpException);
    });
  });

  describe('createReferenceData', () => {
    it('참고 자료를 생성해야 합니다', async () => {
      const dto: CreateReferenceDataDto = {
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file'],
        scope: EProblemSolvingScope.ALL,
        learningSysId: 1,
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      const schoolClass: school_class = {
        id: CLASS_ID,
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school_id: 1341234,
        created_at: new Date(),
        learning_map_id: 1,
      };

      const conceptReferenceMock = {
        id: 1,
        concept_id: MOCK_CONCEPT.id,
        class_table_id: schoolClass.id,
        learning_sys_id: MOCK_LEARNING_SYS.id,
        uuid: UUID,
        scope: dto.scope,
        created_at: MOCK_CONCEPT.created_at,
        concept_reference_data: {
          id: 1,
          view_count: 0,
          like_count: 0,
          content_title: dto.title,
          content_data: dto.content,
          concept_reference_file: dto.filePaths.map((path, index) => ({
            id: index,
            path,
          })),
        },
      };

      jest.spyOn(repository, 'getConceptAndSysFromLearningSysId').mockResolvedValue({ concept: MOCK_CONCEPT, learning_sys: MOCK_LEARNING_SYS });
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(schoolClass);
      jest.spyOn(prisma.learning_sys, 'findFirst').mockResolvedValue(MOCK_LEARNING_SYS);
      jest.spyOn(prisma.concept_reference, 'create').mockResolvedValue(conceptReferenceMock);

      const result = await repository.createReferenceData(dto, UUID, classInfo);
      expect(result).toEqual({
        id: 1,
        concept_id: MOCK_CONCEPT.id,
        class_table_id: schoolClass.id,
        learning_sys_id: MOCK_LEARNING_SYS.id,
        uuid: UUID,
        scope: dto.scope,
        created_at: MOCK_CONCEPT.created_at,
        concept_reference_data: {
          id: 1,
          view_count: 0,
          like_count: 0,
          content_title: dto.title,
          content_data: dto.content,
          concept_reference_file: dto.filePaths.map((path, index) => ({
            id: index,
            path,
          })),
        },
      });

      expect(repository.getConceptAndSysFromLearningSysId).toHaveBeenCalledWith(dto.learningSysId);
      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });
      expect(prisma.learning_sys.findUnique).toHaveBeenCalledWith({
        where: {
          id: dto.learningSysId,
        },
      });
      expect(prisma.concept_reference.create).toHaveBeenCalledWith({
        data: {
          concept_id: MOCK_CONCEPT.id,
          class_table_id: schoolClass.id,
          learning_sys_id: MOCK_LEARNING_SYS.id,
          uuid: UUID,
          scope: dto.scope,
          concept_reference_data: {
            create: {
              view_count: 0,
              like_count: 0,
              content_title: dto.title,
              content_data: dto.content,
              concept_reference_file: {
                createMany: {
                  data: dto.filePaths.map((v) => ({
                    path: v,
                  })),
                },
              },
            },
          },
        },
        include: {
          concept_reference_data: {
            include: { concept_reference_file: true },
          },
        },
      });
    });

    it('개념을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: CreateReferenceDataDto = {
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file'],
        scope: EProblemSolvingScope.ALL,
        learningSysId: 1,
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(repository, 'getConceptAndSysFromLearningSysId').mockResolvedValue({ concept: null, learning_sys: null });

      await expect(repository.createReferenceData(dto, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('학급을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const dto: CreateReferenceDataDto = {
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file'],
        scope: EProblemSolvingScope.ALL,
        learningSysId: 1,
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      const concept = MOCK_CONCEPT;

      jest.spyOn(repository, 'getConceptAndSysFromLearningSysId').mockResolvedValue({ concept, learning_sys: MOCK_LEARNING_SYS });
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(null);

      await expect(repository.createReferenceData(dto, UUID, classInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('getReferenceData', () => {
    it('참고 자료 데이터를 반환해야 합니다', async () => {
      const dto: Partial<GetReferenceDataDto> = { learningSysId: 1, page: 1, pageSize: 10 };
      const totalCount = 10;
      const referenceData = [
        {
          id: REFERENCE_DATA_ID,
          concept_id: 1,
          class_table_id: CLASS_ID,
          learning_sys_id: LEARNING_SYS_ID,
          uuid: UUID,
          scope: ProblemSolvingScope.ALL,
          created_at: new Date(),
          concept_reference_data: {
            id: 1,
            view_count: 0,
            like_count: 0,
            content_title: 'Title',
            content_data: 'Content',
            concept_reference_file: [{ id: 1, path: 'path/to/file' }],
          },
        },
      ];
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'count').mockResolvedValue(totalCount);
      jest.spyOn(prisma.concept_reference, 'findMany').mockResolvedValue(referenceData);

      const result = await repository.getReferenceData(dto as GetReferenceDataDto, UUID, classInfo);
      expect(result).toEqual({ totalCount, data: referenceData });
      expect(prisma.concept_reference.count).toHaveBeenCalledWith({
        where: {
          learning_sys: { id: dto.learningSysId },
          concept_reference_data: { deleted_at: null },
          OR: [
            { uuid: UUID, scope: ProblemSolvingScope.ME },
            { scope: ProblemSolvingScope.ALL },
            {
              scope: ProblemSolvingScope.CLASS,
              class_table: {
                grade: classInfo.user_grade,
                class: classInfo.user_class,
                school: { school_id: classInfo.school_id },
              },
            },
          ],
        },
        skip: 0,
        take: 10,
      });
      expect(prisma.concept_reference.findMany).toHaveBeenCalledWith({
        where: {
          learning_sys: { id: dto.learningSysId },
          concept_reference_data: { deleted_at: null },
          OR: [
            { uuid: UUID, scope: ProblemSolvingScope.ME },
            { scope: ProblemSolvingScope.ALL },
            {
              scope: ProblemSolvingScope.CLASS,
              class_table: {
                grade: classInfo.user_grade,
                class: classInfo.user_class,
                school: { school_id: classInfo.school_id },
              },
            },
          ],
        },
        take: dto.pageSize,
        skip: (dto.page! - 1) * dto.pageSize!,
        include: { concept_reference_data: true },
        orderBy: { concept_reference_data: { view_count: 'desc' } },
      });
    });

    it('참고 자료가 없으면 빈 데이터를 반환해야 합니다.', async () => {
      const dto: Partial<GetReferenceDataDto> = { learningSysId: 1, page: 1, pageSize: 10 };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'count').mockResolvedValue(0);

      await expect(repository.getReferenceData(dto as GetReferenceDataDto, UUID, classInfo)).resolves.toEqual({
        totalCount: 0,
        data: [],
      });
    });
  });

  describe('increaseViewCountForReferenceData', () => {
    it('참고 자료의 조회수를 증가시켜야 합니다', async () => {
      const referenceData = {
        id: REFERENCE_DATA_ID,
        scope: ProblemSolvingScope.ALL,
        uuid: UUID,
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(referenceData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_reference_data, 'update').mockResolvedValue({
        view_count: 1,
        id: 1,
        concept_reference_id: 1,
        content_title: 'abc',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        content_data: 'sdfsdf',
        like_count: 0,
      });

      await repository.increaseViewCountForReferenceData(REFERENCE_DATA_ID, UUID, classInfo);
      expect(prisma.concept_reference.findUnique).toHaveBeenCalledWith({
        where: { id: REFERENCE_DATA_ID },
        include: { concept_reference_data: true },
      });
      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });
      expect(prisma.concept_reference.update).toHaveBeenCalledWith({
        where: { id: REFERENCE_DATA_ID },
        data: {
          concept_reference_data: {
            update: {
              view_count: { increment: 1 },
            },
          },
        },
      });
    });

    it('참고 자료를 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(null);

      await expect(repository.increaseViewCountForReferenceData(REFERENCE_DATA_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('학급을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const referenceData = {
        id: REFERENCE_DATA_ID,
        scope: ProblemSolvingScope.ALL,
        uuid: UUID,
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(referenceData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(null);

      await expect(repository.increaseViewCountForReferenceData(REFERENCE_DATA_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('참고 자료가 나에게만 공개되었고 사용자가 작성자가 아니면 오류를 발생시켜야 합니다', async () => {
      const referenceData = {
        id: REFERENCE_DATA_ID,
        scope: ProblemSolvingScope.ME,
        uuid: 'different-uuid',
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(referenceData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);

      await expect(repository.increaseViewCountForReferenceData(REFERENCE_DATA_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('참고 자료가 학급에 공개되었고 학급이 일치하지 않으면 오류를 발생시켜야 합니다', async () => {
      const referenceData = {
        id: REFERENCE_DATA_ID,
        scope: ProblemSolvingScope.CLASS,
        uuid: UUID,
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(referenceData);
      jest
        .spyOn(prisma.school_class, 'findFirst')
        .mockResolvedValue({ id: 7, school_id: 12345, grade: '3', class: '5', created_at: new Date(), learning_map_id: 1 });

      await expect(repository.increaseViewCountForReferenceData(REFERENCE_DATA_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('increaseViewCountForSharedVideo', () => {
    const classInfo: ClassInfo = {
      school_id: '1234',
      user_class: '5678',
      user_grade: '10',
      semester: 1,
    };

    it('개념 공유 영상을 조회수 증가시켜야 합니다', async () => {
      const videoData = {
        concept_id: 1,
        id: VIDEO_ID,
        created_at: new Date(),
        deleted_at: null,
        scope: ProblemSolvingScope.ALL,
        status: VideoProcessingStatus.DONE,
        user_uuid: UUID,
        video_path: 'path',
      };
      const updatedVideoData = {
        class_table_id: CLASS_ID,
        concept_id: 1,
        id: VIDEO_ID,
        uuid: UUID,
        scope: ProblemSolvingScope.ALL,
        created_at: new Date(),
        learning_sys_id: LEARNING_SYS_ID,
      };

      jest.spyOn(prisma.concept_video, 'findUnique').mockResolvedValue(videoData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);
      jest.spyOn(prisma.concept_reference, 'update').mockResolvedValue(updatedVideoData);

      await repository.increaseViewCountForSharedVideo(VIDEO_ID, UUID, classInfo);
      expect(prisma.concept_video.findUnique).toHaveBeenCalledWith({
        where: { id: VIDEO_ID },
        include: { concept_video_data: true, concept_video_share: true },
      });
      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: { school_id: classInfo.school_id },
        },
      });
      expect(prisma.concept_reference.update).toHaveBeenCalledWith({
        where: { id: VIDEO_ID },
        data: {
          concept_reference_data: {
            update: {
              view_count: { increment: 1 },
            },
          },
        },
      });
    });

    it('개념 공유 영상을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(null);
      await expect(repository.increaseViewCountForSharedVideo(VIDEO_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('학급을 찾을 수 없으면 오류를 발생시켜야 합니다', async () => {
      const videoData = {
        id: VIDEO_ID,
        scope: ProblemSolvingScope.ALL,
        uuid: UUID,
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(videoData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(null);

      await expect(repository.increaseViewCountForSharedVideo(VIDEO_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('공유 영상이 나에게만 공개되었고 사용자가 작성자가 아니면 오류를 발생시켜야 합니다', async () => {
      const videoData = {
        id: VIDEO_ID,
        scope: ProblemSolvingScope.ME,
        uuid: 'different-uuid',
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(videoData);
      jest.spyOn(prisma.school_class, 'findFirst').mockResolvedValue(MOCK_SCHOOL_CLASS);

      await expect(repository.increaseViewCountForSharedVideo(VIDEO_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });

    it('공유 영상이 학급에 공개되었고 학급이 일치하지 않으면 오류를 발생시켜야 합니다', async () => {
      const videoData = {
        id: VIDEO_ID,
        scope: ProblemSolvingScope.CLASS,
        uuid: UUID,
        class_table_id: CLASS_ID,
        concept_reference_data: { id: 2, view_count: 0 },
        concept_id: 1,
        learning_sys_id: LEARNING_SYS_ID,
        created_at: new Date(),
      };

      jest.spyOn(prisma.concept_reference, 'findUnique').mockResolvedValue(videoData);
      jest
        .spyOn(prisma.school_class, 'findFirst')
        .mockResolvedValue({ id: 7, school_id: 12345, grade: '3', class: '5', created_at: new Date(), learning_map_id: 1 });

      await expect(repository.increaseViewCountForSharedVideo(VIDEO_ID, UUID, classInfo)).rejects.toThrow(HttpException);
    });
  });
});
