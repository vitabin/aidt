import { Test, TestingModule } from '@nestjs/testing';
import { SharedVideoController } from './sharedVideo.controller';
import {
  CreateCommentForConceptDto,
  CreateSharedVideoForConceptDto,
  GetSharedVideoForConceptDto,
  LikeSharedVideoDto,
  LikeSharedVideoResponseDto,
  PinSharedVideoOnTopDto,
  StudyService,
  UpdateCommentForConceptDto,
} from '../application';
import { CommentEntity, ConceptVideo, EProblemSolvingScope, EVideoProcessingStatus } from '../infrastructure';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { WinstonModule } from 'nest-winston';
import { ProblemSolvingScope, VideoProcessingStatus } from '@prisma/client';

describe('SharedVideoController', () => {
  let studyController: SharedVideoController;
  let studyService: DeepMockProxy<StudyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedVideoController],
      imports: [WinstonModule.forRoot({})],
      providers: [
        {
          provide: StudyService,
          useValue: mockDeep<StudyService>(),
        },
      ],
    }).compile();

    studyController = module.get<SharedVideoController>(SharedVideoController);
    studyService = module.get(StudyService);
  });

  it('should be defined', () => {
    expect(studyController).toBeDefined();
  });

  describe('getSharedVideoForConcept', () => {
    it('공유 영상 목록을 반환해야 합니다', async () => {
      const dto: Partial<GetSharedVideoForConceptDto> = {
        curriculumId: '1234',
        page: 1,
      };
      const uuid = 'some-uuid';
      const result: { totalPage: number; videos: ConceptVideo[] } = {
        totalPage: 1,
        videos: [
          {
            id: 1234,
            learning_sys_id: 1234,
            scope: EProblemSolvingScope.ALL,
            user_uuid: 'some-uuid',
            video_path: 'some-path',
            status: EVideoProcessingStatus.DONE,
            created_at: new Date(),
            deleted_at: null,
            pinned: true,
            comment_count: 0,
            haveLiked: false,
            like_count: 0,
          },
        ],
      };

      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
      };
      jest.spyOn(studyService, 'getSharedVideoForConcept').mockResolvedValue(result);

      expect(await studyController.getSharedVideoForConcept(dto as GetSharedVideoForConceptDto, uuid, classInfo)).toBe(result);
      expect(studyService.getSharedVideoForConcept).toHaveBeenCalledWith(dto, uuid, classInfo);
    });
  });

  describe('pinSharedVideoOnTop', () => {
    it('공유 영상의 상단 고정 여부를 업데이트해야 합니다', async () => {
      const dto: Partial<PinSharedVideoOnTopDto> = {
        pin: true,
      };
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
      };
      const result = {
        id: 1234,
        learning_sys_id: 1234,
        scope: ProblemSolvingScope.ALL,
        user_uuid: 'some-uuid',
        video_path: 'some-path',
        status: VideoProcessingStatus.DONE,
        created_at: new Date(),
        concept_video_id: 1234,
        class_table_id: 5678,
        pinned: true,
      };
      jest.spyOn(studyService, 'pinSharedVideoOnTop').mockResolvedValue(result);

      expect(await studyController.pinSharedVideoOnTop(dto as PinSharedVideoOnTopDto, 1234, classInfo)).toBe(result);
      expect(studyService.pinSharedVideoOnTop).toHaveBeenCalledWith(dto, classInfo, 1234);
    });
  });

  describe('createSharedVideoForConcept', () => {
    it('새로운 공유 영상을 생성해야 합니다', async () => {
      const dto: CreateSharedVideoForConceptDto = {
        curriculumId: '1234',
        videoPath: 'some-path',
        scope: EProblemSolvingScope.ALL,
      };
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
      };
      const result = {
        id: 1234,
        learning_sys_id: 1234,
        scope: EProblemSolvingScope.ALL,
        user_uuid: 'some-uuid',
        video_path: 'some-path',
        status: EVideoProcessingStatus.DONE,
        created_at: new Date(),
        concept_video_id: 1234,
        class_table_id: 5678,
        pinned: true,
        concept_share_id: 1234,
        deleted_at: null,
        comment_count: 0,
        haveLiked: false,
        like_count: 0,
      };
      jest.spyOn(studyService, 'createSharedVideoForConcept').mockResolvedValue(result);

      expect(await studyController.createSharedVideoForConcept(dto, uuid, classInfo)).toBe(result);
      expect(studyService.createSharedVideoForConcept).toHaveBeenCalledWith(dto, uuid, classInfo);
    });
  });

  describe('deleteSharedVideoForConcept', () => {
    it('공유 영상을 삭제해야 합니다', async () => {
      const videoId = 1234;
      const uuid = 'some-uuid';
      const result = { id: 1234 };
      jest.spyOn(studyService, 'deleteSharedVideoForConcept').mockResolvedValue(result);

      expect(await studyController.deleteSharedVideoForConcept(videoId, uuid)).toBe(result);
      expect(studyService.deleteSharedVideoForConcept).toHaveBeenCalledWith(uuid, videoId);
    });
  });

  describe('createCommentForConcept', () => {
    it('해당 영상에 댓글을 생성해야 합니다', async () => {
      const dto: CreateCommentForConceptDto = {
        content: 'Great video!',
      };
      const videoId = 1234;
      const uuid = 'some-uuid';
      const result: CommentEntity = {
        id: 1234,
        created_at: new Date(),
        content: 'Great video!',
      };
      jest.spyOn(studyService, 'createCommentForConcept').mockResolvedValue(result);

      expect(await studyController.createCommentForConcept(dto, videoId, uuid)).toBe(result);
      expect(studyService.createCommentForConcept).toHaveBeenCalledWith(dto, uuid, videoId);
    });
  });

  describe('updateCommentForConcept', () => {
    it('해당 댓글을 수정해야 합니다', async () => {
      const dto: UpdateCommentForConceptDto = {
        content: 'Updated comment',
      };
      const commentId = 1234;
      const uuid = 'some-uuid';
      const result: CommentEntity = {
        id: commentId,
        created_at: new Date(),
        content: 'Updated comment',
      };
      jest.spyOn(studyService, 'updateCommentForConcept').mockResolvedValue(result);

      expect(await studyController.updateCommentForConcept(dto, commentId, uuid)).toBe(result);
      expect(studyService.updateCommentForConcept).toHaveBeenCalledWith(dto, uuid, commentId);
    });
  });

  describe('deleteCommentForConcept', () => {
    it('해당 댓글을 삭제해야 합니다', async () => {
      const commentId = 1234;
      const uuid = 'some-uuid';
      const result = { id: 1234 };
      jest.spyOn(studyService, 'deleteCommentForConcept').mockResolvedValue(result);

      expect(await studyController.deleteCommentForConcept(commentId, uuid)).toBe(result);
      expect(studyService.deleteCommentForConcept).toHaveBeenCalledWith(uuid, commentId);
    });
  });

  describe('likeSharedVideo', () => {
    it('공유 영상에 좋아요를 해야 합니다.', async () => {
      const dto: LikeSharedVideoDto = {
        concept_video_id: 1234,
        like: true,
      };
      const result: LikeSharedVideoResponseDto = {
        concept_video_id: 1234,
        like_count: 1,
      };
      jest.spyOn(studyService, 'likeSharedVideo').mockResolvedValue(result);

      expect(await studyController.likeSharedVideo(dto, 'uuid')).toBe(result);
      expect(studyService.likeSharedVideo).toHaveBeenCalledWith(dto, 'uuid');
    });

    it('공유 영상에 좋아요를 해제 해야 합니다.', async () => {
      const dto: LikeSharedVideoDto = {
        concept_video_id: 1234,
        like: false,
      };
      const result: LikeSharedVideoResponseDto = {
        concept_video_id: 1234,
        like_count: 0,
      };
      jest.spyOn(studyService, 'likeSharedVideo').mockResolvedValue(result);

      expect(await studyController.likeSharedVideo(dto, 'uuid')).toBe(result);
      expect(studyService.likeSharedVideo).toHaveBeenCalledWith(dto, 'uuid');
    });
  });
  describe('viewSharedVideo', () => {
    it('개념 공유 영상의 조회수를 증가시켜야 합니다', async () => {
      const videoId = 1234;
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
      };

      jest.spyOn(studyService, 'increaseViewCountForSharedVideo').mockResolvedValue(undefined);

      expect(await studyController.viewSharedVideo(videoId, uuid, classInfo)).toBe(undefined);
      expect(studyService.increaseViewCountForSharedVideo).toHaveBeenCalledWith(videoId, uuid, classInfo);
    });
  });
});
