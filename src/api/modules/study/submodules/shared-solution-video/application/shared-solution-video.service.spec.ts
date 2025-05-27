import { Test, TestingModule } from '@nestjs/testing';
import { SharedSolutionVideoService } from './shared-solution-video.service';
import { PrismaService } from 'src/prisma';
import { HttpException, HttpStatus } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import {
  CreateCommentForSharedSolutionVideoDto,
  CreateSharedSolutionVideoForConceptDto,
  EditCommentForSharedSolutionVideoDto,
  GetSharedSolutionVideoForConceptCommentDto,
  GetSharedSolutionVideoForConceptDto,
} from './dto';
import { Role } from 'src/libs/decorators/role.enum';
import { EProblemSolvingScope } from '../../../infrastructure';

const noClassCase = '학급을 찾을 수 없으면 오류를 발생시켜야 합니다';
const noVideoCase = '영상을 찾을 수 없으면 오류를 발생시켜야 합니다';

describe('SharedSolutionVideoService', () => {
  let service: SharedSolutionVideoService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockClassInfo: ClassInfo = {
    school_id: 'test-school-id',
    user_class: 'test-class',
    user_grade: 'test-grade',
    semester: 1,
  };

  const noClassError = '학급 정보를 찾을 수 없습니다.';
  const noVideoError = '영상을 찾을 수 없습니다.';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedSolutionVideoService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }],
    }).compile();

    service = module.get<SharedSolutionVideoService>(SharedSolutionVideoService);
    prisma = module.get<PrismaService>(PrismaService) as DeepMockProxy<PrismaService>;
  });

  describe('likeSharedSolutionVideo', () => {
    it('사용자가 이미 좋아요를 누른 비디오인 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = true;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue({ id: 1 } as any);

      await expect(service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException('이미 좋아요를 누르셨습니다.', HttpStatus.CONFLICT),
      );
    });

    it('사용자가 좋아요를 누르지 않은 영상을 좋아요 해제하려고 할 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = false;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue(null);

      await expect(service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException('좋아요를 하지 않은 영상입니다.', HttpStatus.CONFLICT),
      );
    });

    it(noClassCase, async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = true;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue(null);
      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo)).rejects.toThrow(new HttpException(noClassError, HttpStatus.NOT_FOUND));
    });

    it(noVideoCase, async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = true;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue(null);
      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue(null);

      await expect(service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo)).rejects.toThrow(new HttpException(noVideoError, HttpStatus.NOT_FOUND));
    });

    it('영상이 사용자의 학급에 속하지 않은 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = true;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue(null);
      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { school_class_id: 2 },
      } as any);

      await expect(service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException('자기 학급에 있는 영상만 좋아요를 누를 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('영상을 성공적으로 좋아요 해야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = true;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue(null);
      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { school_class_id: 1 },
      } as any);

      await service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.shared_solution_video_like.create({
          data: {
            user_uuid: uuid,
            shared_solution_video_id: videoId,
          },
        }),
        prisma.shared_solution_video_data.update({
          where: {
            id: videoId,
          },
          data: {
            like_count: {
              increment: 1,
            },
          },
        }),
      ]);
    });

    it('영상을 성공적으로 좋아요 해제해야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';
      const like = false;

      prisma.shared_solution_video_like.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { school_class_id: 1 },
      } as any);

      await service.likeSharedSolutionVideo(videoId, like, uuid, mockClassInfo);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.shared_solution_video_like.delete({
          where: {
            id: 1,
          },
        }),
        prisma.shared_solution_video_data.update({
          where: {
            id: videoId,
          },
          data: {
            like_count: {
              decrement: 1,
            },
          },
        }),
      ]);
    });
  });

  describe('deleteCommentForSharedSolutionVideo', () => {
    it('댓글이 존재하지 않거나 이미 삭제된 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue(null);

      await expect(service.deleteCommentForSharedSolutionVideo(videoId, commentId, uuid)).rejects.toThrow(
        new HttpException('이미 삭제됐거나 존재하지 않는 댓글입니다.', HttpStatus.NOT_FOUND),
      );
    });

    it('사용자가 댓글 작성자가 아닌 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue({
        user_uuid: 'other-uuid1',
      } as any);

      await expect(service.deleteCommentForSharedSolutionVideo(videoId, commentId, uuid)).rejects.toThrow(
        new HttpException('오직 작성자만 댓글을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('댓글을 성공적으로 삭제해야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue({
        user_uuid: uuid,
      } as any);

      await service.deleteCommentForSharedSolutionVideo(videoId, commentId, uuid);

      expect(prisma.shared_solution_video_comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe('editCommentForSharedSolutionVideo', () => {
    it('댓글이 존재하지 않는 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';
      const dto: EditCommentForSharedSolutionVideoDto = { content: 'Updated Comment1' };

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue(null);

      await expect(service.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid)).rejects.toThrow(
        new HttpException('존재하지 않는 댓글입니다.', HttpStatus.NOT_FOUND),
      );
    });

    it('사용자가 댓글 작성자가 아닌 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';
      const dto: EditCommentForSharedSolutionVideoDto = { content: 'Updated Comment' };

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue({
        user_uuid: 'other-uuid',
      } as any);

      await expect(service.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid)).rejects.toThrow(
        new HttpException('오직 작성자만 댓글을 수정할 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('댓글을 성공적으로 수정해야 합니다', async () => {
      const videoId = 1;
      const commentId = 1;
      const uuid = 'test-uuid';
      const dto: EditCommentForSharedSolutionVideoDto = { content: 'Updated Comment' };

      prisma.shared_solution_video_comment.findFirst.mockResolvedValue({
        user_uuid: uuid,
      } as any);

      await service.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid);

      expect(prisma.shared_solution_video_comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { content: dto.content, updated_at: expect.any(Date) },
      });
    });
  });

  describe('getCommentForSharedSolutionVideo', () => {
    it(noClassCase, async () => {
      const videoId = 1;
      const dto: GetSharedSolutionVideoForConceptCommentDto = { page: 1, pageSize: 10 };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.getCommentForSharedSolutionVideo(videoId, dto, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException(noClassError, HttpStatus.NOT_FOUND),
      );
    });

    it(noVideoCase, async () => {
      const videoId = 1;
      const dto: GetSharedSolutionVideoForConceptCommentDto = { page: 1, pageSize: 10 };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue(null);

      await expect(service.getCommentForSharedSolutionVideo(videoId, dto, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException(noVideoError, HttpStatus.NOT_FOUND),
      );
    });

    it('페이지 네이션된 댓글을 반환해야 합니다', async () => {
      const videoId = 1;
      const dto: GetSharedSolutionVideoForConceptCommentDto = { page: 1, pageSize: 10 };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { school_class_id: 1 },
      } as any);
      prisma.shared_solution_video_comment.findMany.mockResolvedValue([{ id: 1, content: 'Comment' } as any]);
      prisma.shared_solution_video_comment.count.mockResolvedValue(1);

      const result = await service.getCommentForSharedSolutionVideo(videoId, dto, uuid, mockClassInfo);

      expect(result).toEqual({
        page: 1,
        totalPage: 1,
        comments: [{ id: 1, content: 'Comment' }],
      });
    });
  });

  describe('createCommentForSharedSolutionVideo', () => {
    it(noClassCase, async () => {
      const videoId = 1;
      const dto: CreateCommentForSharedSolutionVideoDto = { content: 'New Comment1' };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.createCommentForSharedSolutionVideo(dto, videoId, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException(noClassError, HttpStatus.NOT_FOUND),
      );
    });

    it(noVideoCase, async () => {
      const videoId = 1;
      const dto: CreateCommentForSharedSolutionVideoDto = { content: 'New Comment' };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue(null);

      await expect(service.createCommentForSharedSolutionVideo(dto, videoId, uuid, mockClassInfo)).rejects.toThrow(
        new HttpException(noVideoError, HttpStatus.NOT_FOUND),
      );
    });

    it('댓글을 성공적으로 작성해야 합니다', async () => {
      const videoId = 1;
      const dto: CreateCommentForSharedSolutionVideoDto = { content: 'New Comment' };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { school_class_id: 1 },
      } as any);
      prisma.shared_solution_video_comment.create.mockResolvedValue({
        id: 1,
        content: dto.content,
        shared_solution_video_id: videoId,
        user_uuid: uuid,
      } as any);

      const result = await service.createCommentForSharedSolutionVideo(dto, videoId, uuid, mockClassInfo);

      expect(result).toEqual({
        id: 1,
        content: dto.content,
        shared_solution_video_id: videoId,
        user_uuid: uuid,
      });
    });
  });

  describe('deleteSharedSolutionVideo', () => {
    it('영상이 존재하지 않는 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video.findUnique.mockResolvedValue(null);

      await expect(service.deleteSharedSolutionVideo(videoId, uuid)).rejects.toThrow(new HttpException('영상이 존재하지 않습니다.', HttpStatus.NOT_FOUND));
    });

    it('사용자가 비디오 작성자가 아닌 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video.findUnique.mockResolvedValue({
        user_uuid: 'other-uuid',
      } as any);

      await expect(service.deleteSharedSolutionVideo(videoId, uuid)).rejects.toThrow(
        new HttpException('오직 작성자만 영상을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('영상을 성공적으로 삭제해야 합니다', async () => {
      const videoId = 1;
      const uuid = 'test-uuid';

      prisma.shared_solution_video.findUnique.mockResolvedValue({
        user_uuid: uuid,
      } as any);

      await service.deleteSharedSolutionVideo(videoId, uuid);

      expect(prisma.shared_solution_video.update).toHaveBeenCalledWith({
        where: { id: videoId },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe('pinSharedSolutionVideoOnTop', () => {
    it(noClassCase, async () => {
      const videoId = 1;
      const pin = true;

      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.pinSharedSolutionVideoOnTop(videoId, pin, mockClassInfo)).rejects.toThrow(new HttpException(noClassError, HttpStatus.NOT_FOUND));
    });

    it(noVideoCase, async () => {
      const videoId = 1;
      const pin = true;

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue(null);

      await expect(service.pinSharedSolutionVideoOnTop(videoId, pin, mockClassInfo)).rejects.toThrow(new HttpException(noVideoError, HttpStatus.NOT_FOUND));
    });

    it('영상이 이미 상단 고정된 경우 오류를 발생시켜야 합니다', async () => {
      const videoId = 1;
      const pin = true;

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { pinned: true },
      } as any);

      await expect(service.pinSharedSolutionVideoOnTop(videoId, pin, mockClassInfo)).rejects.toThrow(
        new HttpException('이미 상단 고정이 되어 있는 영상입니다.', HttpStatus.CONFLICT),
      );
    });

    it('영상을 상단에 성공적으로 고정해야 합니다', async () => {
      const videoId = 1;
      const pin = true;

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findFirst.mockResolvedValue({
        shared_solution_video_share: { pinned: false, school_class_id: 1 },
      } as any);
      prisma.shared_solution_video.findMany.mockResolvedValue([{ id: 1 } as any]);

      await service.pinSharedSolutionVideoOnTop(videoId, pin, mockClassInfo);

      expect(prisma.shared_solution_video_share.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        data: { pinned: false },
      });
      expect(prisma.shared_solution_video_share.update).toHaveBeenCalledWith({
        where: { shared_solution_video_id: videoId },
        data: { pinned: pin },
      });
    });
  });

  describe('getSharedSolutionVideoForConcept', () => {
    it(noClassCase, async () => {
      const dto: GetSharedSolutionVideoForConceptDto = {
        onlyMine: false,
        page: 1,
        pageSize: 10,
        problemId: 1,
      };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.getSharedSolutionVideoForConcept(dto, uuid, mockClassInfo)).rejects.toThrow(new HttpException(noClassError, HttpStatus.NOT_FOUND));
    });

    it('상단 고정 및 기타 영상과 함께 페이지 네이션된 영상을 반환해야 합니다', async () => {
      const dto: GetSharedSolutionVideoForConceptDto = {
        onlyMine: false,
        page: 1,
        pageSize: 10,
        problemId: 1,
      };
      const uuid = 'test-uuid';

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            created_at: new Date(),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video4',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: true },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          } as any,
        ])
        .mockResolvedValueOnce([
          {
            id: 2,
            created_at: new Date(),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video3',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: false },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          } as any,
        ])
        .mockResolvedValueOnce([
          {
            id: 3,
            created_at: new Date(),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video2',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: false },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          } as any,
        ]);

      const result = await service.getSharedSolutionVideoForConcept(dto, uuid, mockClassInfo);

      expect(result).toEqual({
        totalPageCount: 1,
        videos: [
          {
            id: 1,
            created_at: expect.any(Date),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video4',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: true },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          },
          {
            id: 2,
            created_at: expect.any(Date),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video3',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: false },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          },
          {
            id: 3,
            created_at: expect.any(Date),
            study_problem_id: 1,
            user_uuid: 'test-uuid',
            video_path: 'path/to/video2',
            deleted_at: null,
            shared_solution_video_share: { school_class_id: 1, pinned: false },
            _count: { shared_solution_video_comment: 1 },
            shared_solution_video_like: [],
            shared_solution_video_data: { like_count: 0 },
          },
        ],
      });
    });
  });

  describe('createSharedSolutionVideoForConcept', () => {
    it('역할이 범위에 대해 유효하지 않은 경우 오류를 발생시켜야 합니다', async () => {
      const dto: CreateSharedSolutionVideoForConceptDto = {
        videoPath: 'path/to/video1',
        studyProblemId: 1,
        scope: EProblemSolvingScope.ALL,
      };
      const uuid = 'test-uuid';
      const role = Role.Student;

      await expect(service.createSharedSolutionVideoForConcept(dto, uuid, mockClassInfo, role)).rejects.toThrow(
        new HttpException('교사만 공유 범위를 전체로 할 수 있습니다.', HttpStatus.BAD_REQUEST),
      );
    });

    it(noClassCase, async () => {
      const dto: CreateSharedSolutionVideoForConceptDto = {
        videoPath: 'path/to/video',
        studyProblemId: 1,
        scope: EProblemSolvingScope.CLASS,
      };
      const uuid = 'test-uuid';
      const role = Role.Student;

      prisma.school_class.findFirst.mockResolvedValue(null);

      await expect(service.createSharedSolutionVideoForConcept(dto, uuid, mockClassInfo, role)).rejects.toThrow(
        new HttpException(noClassError, HttpStatus.NOT_FOUND),
      );
    });

    it('공유 풀이 영상을 성공적으로 생성해야 합니다', async () => {
      const dto: CreateSharedSolutionVideoForConceptDto = {
        videoPath: 'path/to/video',
        studyProblemId: 1,
        scope: EProblemSolvingScope.CLASS,
      };
      const uuid = 'test-uuid';
      const role = Role.Student;

      prisma.school_class.findFirst.mockResolvedValue({ id: 1 } as any);
      prisma.shared_solution_video.create.mockResolvedValue({
        id: 1,
        video_path: dto.videoPath,
        study_problem_id: dto.studyProblemId,
        user_uuid: uuid,
        created_at: new Date(),
      } as any);

      const result = await service.createSharedSolutionVideoForConcept(dto, uuid, mockClassInfo, role);

      expect(result).toEqual({
        id: 1,
        video_path: dto.videoPath,
        study_problem_id: dto.studyProblemId,
        user_uuid: uuid,
        created_at: expect.any(Date),
      });
    });
  });
});
