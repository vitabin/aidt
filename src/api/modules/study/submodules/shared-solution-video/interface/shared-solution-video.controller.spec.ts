import { Test, TestingModule } from '@nestjs/testing';
import { SharedSolutionVideoController } from './shared-solution-video.controller';
import { SharedSolutionVideoService } from '../application/shared-solution-video.service';
import { PrismaService } from 'src/prisma';
import { HttpException } from '@nestjs/common';
import { EProblemSolvingScope } from '../../../infrastructure';
import { Role } from 'src/libs/decorators/role.enum';
import { mockDeep } from 'jest-mock-extended';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import {
  CreateCommentForSharedSolutionVideoDto,
  CreateSharedSolutionVideoForConceptDto,
  EditCommentForSharedSolutionVideoDto,
  GetSharedSolutionVideoForConceptCommentDto,
  GetSharedSolutionVideoForConceptDto,
} from '../application/dto';
import { shared_solution_video_comment } from '@prisma/client';
import { WinstonModule } from 'nest-winston';

const serviceErrorCase = '서비스가 실패하면 오류를 던져야 합니다';
describe('SharedSolutionVideoController', () => {
  let controller: SharedSolutionVideoController;
  let service: SharedSolutionVideoService;
  const prismaService = mockDeep<PrismaService>();

  const mockClassInfo: ClassInfo = {
    school_id: 'test-school-id',
    user_class: 'test-class',
    user_grade: 'test-grade',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WinstonModule.forRoot({})],
      controllers: [SharedSolutionVideoController],
      providers: [SharedSolutionVideoService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    controller = module.get<SharedSolutionVideoController>(SharedSolutionVideoController);
    service = module.get<SharedSolutionVideoService>(SharedSolutionVideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSharedSolutionVideoForConcept', () => {
    it('공유 풀이 영상을 생성해야 합니다', async () => {
      const dto: CreateSharedSolutionVideoForConceptDto = {
        videoPath: 'path/to/video5',
        studyProblemId: 1,
        scope: EProblemSolvingScope.CLASS,
      };
      const uuid = 'test-uuid';
      const role = Role.Student;

      const mockResponse = {
        id: 1,
        created_at: new Date(),
        user_uuid: uuid,
        deleted_at: null,
        video_path: dto.videoPath,
        study_problem_id: dto.studyProblemId,
      };

      jest.spyOn(service, 'createSharedSolutionVideoForConcept').mockResolvedValue(mockResponse);

      const result = await controller.createSharedSolutionVideoForConcept(dto, uuid, mockClassInfo, role);

      expect(result).toEqual(mockResponse);
      expect(service.createSharedSolutionVideoForConcept).toHaveBeenCalledWith(dto, uuid, mockClassInfo, role);
    });

    it('역할이 유효하지 않으면 오류를 던져야 합니다', async () => {
      const dto: CreateSharedSolutionVideoForConceptDto = {
        videoPath: 'path/to/video',
        studyProblemId: 1,
        scope: EProblemSolvingScope.ALL,
      };
      const uuid = 'test-uuid';
      const role = Role.Student;

      jest.spyOn(service, 'createSharedSolutionVideoForConcept').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.createSharedSolutionVideoForConcept(dto, uuid, mockClassInfo, role)).rejects.toThrow(HttpException);
    });
  });

  describe('getSharedSolutionVideoForConcept', () => {
    it('페이지된 영상을 반환해야 합니다', async () => {
      const dto: GetSharedSolutionVideoForConceptDto = { onlyMine: false, page: 1, pageSize: 10, problemId: 1 };
      const uuid = 'test-uuid';

      const mockResponse: {
        totalPageCount: number;
        videos: any[];
      } = {
        totalPageCount: 1,
        videos: [
          {
            id: 1,
            video_path: 'path/to/video',
            study_problem_id: 1,
            _count: { shared_solution_video_comment: 2 },
            created_at: new Date(),
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          },
        ],
      };

      jest.spyOn(service, 'getSharedSolutionVideoForConcept').mockResolvedValue(mockResponse);

      const result = await controller.getSharedSolutionVideoForConcept(dto, uuid, mockClassInfo);

      expect(result).toEqual({
        totalPage: mockResponse.totalPageCount,
        page: dto.page,
        videos: mockResponse.videos.map((video) => ({
          commentCount: video._count.shared_solution_video_comment,
          createdAt: video.created_at,
          haveILiked: video.shared_solution_video_like.length > 0,
          likeCount: video.shared_solution_video_data.like_count,
          videoPath: video.video_path,
          studyProblemId: video.study_problem_id,
          userUuid: video.user_uuid,
          id: video.id,
        })),
      });
      expect(service.getSharedSolutionVideoForConcept).toHaveBeenCalledWith(dto, uuid, mockClassInfo);
    });

    it(serviceErrorCase, async () => {
      const dto: GetSharedSolutionVideoForConceptDto = { onlyMine: false, page: 1, pageSize: 10, problemId: 1 };
      const uuid = 'test-uuid';

      jest.spyOn(service, 'getSharedSolutionVideoForConcept').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.getSharedSolutionVideoForConcept(dto, uuid, mockClassInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('pinSharedSolutionVideoOnTop', () => {
    it('공유 풀이 영상을 상단에 고정해야 합니다', async () => {
      const pin = true;
      const videoId = 1;

      jest.spyOn(service, 'pinSharedSolutionVideoOnTop').mockResolvedValue(undefined);

      const result = await controller.pinSharedSolutionVideoOnTop(pin, videoId, mockClassInfo);

      expect(result).toBeUndefined();
      expect(service.pinSharedSolutionVideoOnTop).toHaveBeenCalledWith(videoId, pin, mockClassInfo);
    });

    it(serviceErrorCase, async () => {
      const pin = true;
      const videoId = 1;

      jest.spyOn(service, 'pinSharedSolutionVideoOnTop').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.pinSharedSolutionVideoOnTop(pin, videoId, mockClassInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteSharedSolutionVideo', () => {
    it('공유 풀이 영상을 삭제해야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'deleteSharedSolutionVideo').mockResolvedValue(undefined);

      const result = await controller.deleteSharedSolutionVideo(videoId, uuid);

      expect(result).toBeUndefined();
      expect(service.deleteSharedSolutionVideo).toHaveBeenCalledWith(videoId, uuid);
    });

    it(serviceErrorCase, async () => {
      const videoId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'deleteSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.deleteSharedSolutionVideo(videoId, uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('createCommentForSharedSolutionVideo', () => {
    it('공유 풀이 영상에 대한 댓글을 생성해야 합니다', async () => {
      const dto: CreateCommentForSharedSolutionVideoDto = { content: 'New Comment' };
      const videoId = 1;
      const uuid = 'test-uuid';

      const mockResponse = {
        id: 1,
        content: dto.content,
        shared_solution_video_id: videoId,
        user_uuid: uuid,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      jest.spyOn(service, 'createCommentForSharedSolutionVideo').mockResolvedValue(mockResponse);

      const result = await controller.createCommentForSharedSolutionVideo(dto, videoId, uuid, mockClassInfo);

      expect(result).toEqual({
        content: mockResponse.content,
        id: mockResponse.id,
        created_at: mockResponse.created_at,
        updated_at: mockResponse.updated_at,
      });
      expect(service.createCommentForSharedSolutionVideo).toHaveBeenCalledWith(dto, videoId, uuid, mockClassInfo);
    });

    it(serviceErrorCase, async () => {
      const dto: CreateCommentForSharedSolutionVideoDto = { content: 'New Comment' };
      const videoId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'createCommentForSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.createCommentForSharedSolutionVideo(dto, videoId, uuid, mockClassInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('getCommentForSharedSolutionVideo', () => {
    it('공유 풀이 영상에 대한 댓글을 반환해야 합니다', async () => {
      const videoId = 1;
      const dto: GetSharedSolutionVideoForConceptCommentDto = { page: 1, pageSize: 10 };
      const uuid = 'test-uuid';

      const mockResponse: {
        page: number;
        totalPage: number;
        comments: shared_solution_video_comment[];
      } = {
        page: 1,
        totalPage: 1,
        comments: [
          {
            id: 1,
            content: 'Comment',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            shared_solution_video_id: videoId,
            user_uuid: uuid,
          },
        ],
      };

      jest.spyOn(service, 'getCommentForSharedSolutionVideo').mockResolvedValue(mockResponse);

      const result = await controller.getCommentForSharedSolutionVideo(videoId, dto, uuid, mockClassInfo);

      expect(result).toEqual({
        page: dto.page,
        totalPage: mockResponse.totalPage,
        comments: mockResponse.comments.map((comment) => ({
          content: comment.content,
          created_at: comment.created_at,
          id: comment.id,
          updated_at: comment.updated_at,
        })),
      });
      expect(service.getCommentForSharedSolutionVideo).toHaveBeenCalledWith(videoId, dto, uuid, mockClassInfo);
    });

    it(serviceErrorCase, async () => {
      const videoId = 1;
      const dto: GetSharedSolutionVideoForConceptCommentDto = { page: 1, pageSize: 10 };
      const uuid = 'test-uuid';

      jest.spyOn(service, 'getCommentForSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.getCommentForSharedSolutionVideo(videoId, dto, uuid, mockClassInfo)).rejects.toThrow(HttpException);
    });
  });

  describe('editCommentForSharedSolutionVideo', () => {
    it('공유 풀이 영상에 대한 댓글을 수정해야 합니다', async () => {
      const dto: EditCommentForSharedSolutionVideoDto = { content: 'Updated Comment' };
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'editCommentForSharedSolutionVideo').mockResolvedValue(undefined);

      const result = await controller.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid);

      expect(result).toBeUndefined();
      expect(service.editCommentForSharedSolutionVideo).toHaveBeenCalledWith(dto, videoId, commentId, uuid);
    });

    it(serviceErrorCase, async () => {
      const dto: EditCommentForSharedSolutionVideoDto = { content: 'Updated Comment' };
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'editCommentForSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteCommentForSharedSolutionVideo', () => {
    it('공유 풀이 영상에 대한 댓글을 삭제해야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'deleteCommentForSharedSolutionVideo').mockResolvedValue(undefined);

      const result = await controller.deleteCommentForSharedSolutionVideo(videoId, uuid, commentId);

      expect(result).toBeUndefined();
      expect(service.deleteCommentForSharedSolutionVideo).toHaveBeenCalledWith(videoId, commentId, uuid);
    });

    it(serviceErrorCase, async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'deleteCommentForSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.deleteCommentForSharedSolutionVideo(videoId, uuid, commentId)).rejects.toThrow(HttpException);
    });
  });

  describe('likeSharedSolutionVideo', () => {
    it('공유 풀이 영상에 좋아요를 해야 합니다', async () => {
      const like = true;
      const videoId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'likeSharedSolutionVideo').mockResolvedValue(undefined);

      const result = await controller.likeSharedSolutionVideo(like, videoId, uuid, mockClassInfo);

      expect(result).toBeUndefined();
      expect(service.likeSharedSolutionVideo).toHaveBeenCalledWith(videoId, like, uuid, mockClassInfo);
    });

    it(serviceErrorCase, async () => {
      const like = true;
      const videoId = 1;
      const uuid = 'test-uuid';

      jest.spyOn(service, 'likeSharedSolutionVideo').mockRejectedValue(new HttpException('Error', 400));

      await expect(controller.likeSharedSolutionVideo(like, videoId, uuid, mockClassInfo)).rejects.toThrow(HttpException);
    });
  });
});
