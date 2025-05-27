import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { Role } from 'src/libs/decorators/role.enum';
import {
  CreateAnswerDto,
  CreateCommentForSharedSolutionVideoDto,
  EditCommentForSharedSolutionVideoDto,
  GetSharedSolutionVideoForConceptCommentDto,
  GetSharedSolutionVideoForConceptDto,
} from './dto';
import { PrismaService } from 'src/prisma';
import { EProblemSolvingScope } from '../../../infrastructure';
import { question, shared_solution_video } from '@prisma/client';

const noClassError = '학급 정보를 찾을 수 없습니다.';
const noVideoError = '영상을 찾을 수 없습니다.';
const noAnswerError = '답변을 찾을 수 없습니다.';
const noQuestionError = '질문을 찾을 수 없습니다.';

@Injectable()
export class SharedSolutionVideoService {
  constructor(private readonly prisma: PrismaService) {}
  async likeSharedSolutionVideo(videoId: number, like: boolean, uuid: string, classInfo: ClassInfo) {
    const likeData = await this.prisma.shared_solution_video_like.findFirst({
      where: {
        user_uuid: uuid,
        shared_solution_video_id: videoId,
      },
    });

    if (like && likeData) throw new HttpException('이미 좋아요를 누르셨습니다.', HttpStatus.CONFLICT);
    if (!like && !likeData) throw new HttpException('좋아요를 하지 않은 영상입니다.', HttpStatus.CONFLICT);

    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    const video = await this.prisma.shared_solution_video.findFirst({
      where: {
        id: videoId,
      },
      include: {
        shared_solution_video_share: {
          select: {
            school_class_id: true,
          },
        },
      },
    });

    if (!video) throw new HttpException(noVideoError, HttpStatus.NOT_FOUND);
    if (video.shared_solution_video_share?.school_class_id !== schoolClass.id)
      throw new HttpException('자기 학급에 있는 영상만 좋아요를 누를 수 있습니다.', HttpStatus.FORBIDDEN);

    if (like) {
      await this.prisma.$transaction([
        this.prisma.shared_solution_video_like.create({
          data: {
            user_uuid: uuid,
            shared_solution_video_id: videoId,
          },
        }),
        this.prisma.shared_solution_video_data.update({
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
    } else {
      await this.prisma.$transaction([
        this.prisma.shared_solution_video_like.delete({
          where: {
            id: likeData!.id,
          },
        }),
        this.prisma.shared_solution_video_data.update({
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
    }
  }
  async deleteCommentForSharedSolutionVideo(videoId: number, commentId: number, uuid: string) {
    const comment = await this.prisma.shared_solution_video_comment.findFirst({
      where: {
        id: commentId,
        shared_solution_video_id: videoId,
        deleted_at: null,
      },
    });

    if (!comment) throw new HttpException('이미 삭제됐거나 존재하지 않는 댓글입니다.', HttpStatus.NOT_FOUND);

    if (comment.user_uuid !== uuid) throw new HttpException('오직 작성자만 댓글을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.shared_solution_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }
  async editCommentForSharedSolutionVideo(dto: EditCommentForSharedSolutionVideoDto, videoId: number, commentId: number, uuid: string) {
    const comment = await this.prisma.shared_solution_video_comment.findFirst({
      where: {
        id: commentId,
        shared_solution_video_id: videoId,
        deleted_at: null,
      },
    });

    if (!comment) throw new HttpException('존재하지 않는 댓글입니다.', HttpStatus.NOT_FOUND);

    if (comment.user_uuid !== uuid) throw new HttpException('오직 작성자만 댓글을 수정할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.shared_solution_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: dto.content,
        updated_at: new Date(),
      },
    });
  }
  async getCommentForSharedSolutionVideo(videoId: number, dto: GetSharedSolutionVideoForConceptCommentDto, uuid: string, classInfo: ClassInfo) {
    const { page, pageSize } = dto;
    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    const video = await this.prisma.shared_solution_video.findFirst({
      where: {
        id: videoId,
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
        },
      },
    });

    if (!video) throw new HttpException(noVideoError, HttpStatus.NOT_FOUND);

    const comments = await this.prisma.shared_solution_video_comment.findMany({
      where: {
        shared_solution_video_id: videoId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { page, totalPage: Math.ceil((await this.prisma.shared_solution_video_comment.count()) / pageSize), comments };
  }
  async createCommentForSharedSolutionVideo(dto: CreateCommentForSharedSolutionVideoDto, videoId: number, uuid: string, classInfo: ClassInfo) {
    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    const video = await this.prisma.shared_solution_video.findFirst({
      where: {
        id: videoId,
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
        },
      },
    });

    if (!video) throw new HttpException(noVideoError, HttpStatus.NOT_FOUND);

    return await this.prisma.shared_solution_video_comment.create({
      data: {
        content: dto.content,
        shared_solution_video_id: videoId,
        user_uuid: uuid,
      },
    });
  }
  async deleteSharedSolutionVideo(videoId: number, uuid: string) {
    const video = await this.prisma.shared_solution_video.findUnique({
      where: {
        id: videoId,
        deleted_at: null,
      },
    });

    if (!video) throw new HttpException('영상이 존재하지 않습니다.', HttpStatus.NOT_FOUND);

    if (video.user_uuid !== uuid) throw new HttpException('오직 작성자만 영상을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.shared_solution_video.update({
      where: {
        id: videoId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }
  async pinSharedSolutionVideoOnTop(videoId: number, pin: boolean, classInfo: ClassInfo) {
    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    const video = await this.prisma.shared_solution_video.findFirst({
      where: {
        id: videoId,
        deleted_at: null,
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
        },
      },
      include: {
        shared_solution_video_share: true,
      },
    });

    if (!video) throw new HttpException(noVideoError, HttpStatus.NOT_FOUND);

    if (pin && video.shared_solution_video_share?.pinned) throw new HttpException('이미 상단 고정이 되어 있는 영상입니다.', HttpStatus.CONFLICT);
    if (!pin && !video.shared_solution_video_share?.pinned) throw new HttpException('이미 상단 고정되어 있지 않은 영상입니다.', HttpStatus.CONFLICT);
    const alreadyPinnedVideoShares = await this.prisma.shared_solution_video.findMany({
      where: {
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
          pinned: true,
        },
      },
    });

    if (alreadyPinnedVideoShares) {
      await this.prisma.shared_solution_video_share.updateMany({
        where: {
          id: {
            in: alreadyPinnedVideoShares.map((share) => share.id),
          },
        },
        data: {
          pinned: false,
        },
      });
    }

    await this.prisma.shared_solution_video_share.update({
      where: {
        shared_solution_video_id: videoId,
      },
      data: {
        pinned: pin,
      },
    });
  }
  async getSharedSolutionVideoForConcept(dto: GetSharedSolutionVideoForConceptDto, uuid: string, classInfo: ClassInfo) {
    const { onlyMine, page, pageSize, problemId } = dto;

    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    const skip = (page - 1) * pageSize;

    if (onlyMine) {
      const totalCount = await this.prisma.shared_solution_video.count({
        where: {
          problem_id: problemId,
          shared_solution_video_share: {
            school_class_id: schoolClass.id,
          },
          deleted_at: null,
          user_uuid: uuid,
        },
      });

      if (totalCount === 0) {
        return {
          videos: [],
          totalPageCount: 1,
        };
      }
      const videos = await this.prisma.shared_solution_video.findMany({
        where: {
          user_uuid: uuid,
          problem_id: problemId,
          shared_solution_video_share: {
            school_class_id: schoolClass.id,
          },
          deleted_at: null,
        },
        skip: skip,
        take: pageSize,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          shared_solution_video_share: true,
          _count: {
            select: {
              shared_solution_video_comment: true,
            },
          },
          shared_solution_video_like: {
            where: {
              user_uuid: uuid,
            },
          },
          shared_solution_video_data: {
            select: {
              like_count: true,
            },
          },
        },
      });

      return {
        videos: videos,
        totalPageCount: Math.ceil(totalCount / pageSize),
      };
    }

    // 먼저 상단 고정 영상을 불러옵니다.

    const pinnedVideos = await this.prisma.shared_solution_video.findMany({
      where: {
        problem_id: problemId,
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
          pinned: true,
        },
        deleted_at: null,
        OR: [
          { shared_solution_video_share: { scope: EProblemSolvingScope.ALL } },
          {
            user_uuid: uuid,
            shared_solution_video_share: { scope: EProblemSolvingScope.ME },
          },
          { shared_solution_video_share: { scope: EProblemSolvingScope.CLASS, school_class_id: schoolClass.id } },
        ],
      },
      include: {
        shared_solution_video_share: true,
        _count: {
          select: {
            shared_solution_video_comment: true,
          },
        },
        question: { select: { problem_id: true } },
        shared_solution_video_like: {
          where: {
            user_uuid: uuid,
          },
        },
        shared_solution_video_data: {
          select: {
            like_count: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // 상단고정되지 않은 내 영상을 찾습니다.

    const myVideos = await this.prisma.shared_solution_video.findMany({
      where: {
        problem_id: problemId,
        user_uuid: uuid,
        shared_solution_video_share: {
          school_class_id: schoolClass.id,
          pinned: false,
        },
        deleted_at: null,
        OR: [
          { shared_solution_video_share: { scope: EProblemSolvingScope.ME } },
          { shared_solution_video_share: { scope: EProblemSolvingScope.ALL } },
          { shared_solution_video_share: { scope: EProblemSolvingScope.CLASS, school_class_id: schoolClass.id } },
        ],
      },
      include: {
        shared_solution_video_share: true,
        _count: {
          select: {
            shared_solution_video_comment: true,
          },
        },
        question: { select: { problem_id: true } },
        shared_solution_video_like: {
          where: {
            user_uuid: uuid,
          },
        },
        shared_solution_video_data: {
          select: {
            like_count: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // 상단 고정 영상와 먼저 영상을 병합합니다.

    const combinedVideos = [...pinnedVideos, ...myVideos];

    let otherVideos = [];

    if (!onlyMine && combinedVideos.length < skip + pageSize) {
      const remainingSkip = Math.max(0, skip - combinedVideos.length);
      const remainingTake = pageSize - Math.max(0, combinedVideos.length - skip);

      // 나머지 영상, 즉 내 영상과, 상단고정이 된 영상을 제외한 모든 영상을 불러옵니다.
      otherVideos = await this.prisma.shared_solution_video.findMany({
        where: {
          problem_id: problemId,
          user_uuid: { not: uuid },
          deleted_at: null,
          shared_solution_video_share: {
            pinned: false,
          },
          OR: [
            { shared_solution_video_share: { scope: EProblemSolvingScope.ALL } },
            { shared_solution_video_share: { scope: EProblemSolvingScope.CLASS, school_class_id: schoolClass.id } },
          ],
        },
        include: {
          shared_solution_video_share: true,
          _count: {
            select: {
              shared_solution_video_comment: true,
            },
          },

          question: { select: { problem_id: true } },
          shared_solution_video_like: {
            where: {
              user_uuid: uuid,
            },
          },
          shared_solution_video_data: {
            select: {
              like_count: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: remainingSkip,
        take: remainingTake,
      });

      combinedVideos.push(...otherVideos);
    }

    // 페이지네이션을 적용합니다.
    const paginatedVideos = combinedVideos.slice(skip, skip + pageSize);

    const totalVideoCount = combinedVideos.length;
    const totalPageCount = Math.ceil(totalVideoCount / pageSize);

    return { totalPageCount, videos: paginatedVideos };
  }
  async createSharedSolutionVideoForConcept(dto: CreateAnswerDto, uuid: string, classInfo: ClassInfo, role: Role) {
    if (dto.problemId && dto.questionId) {
      throw new BadRequestException('질문에 대한 답변일 경우 questionId만, 문제에 대해 전자칠판으로 푼 경우에는 problemId만 사용할 수 있습니다.');
    }

    if (!dto.problemId && !dto.questionId) {
      throw new BadRequestException('questionId나 problemId 둘 중 하나는 담아서 보내주세요.');
    }

    if (role !== Role.Student && dto.scope === EProblemSolvingScope.ME)
      throw new HttpException('학생만 공유 범위를 나만 보기로 할 수 있습니다.', HttpStatus.BAD_REQUEST);

    const schoolClass = await this.findSchoolClassFromClassInfo(classInfo);

    if (!schoolClass) throw new HttpException(noClassError, HttpStatus.NOT_FOUND);

    // 질문 id가 주어진 경우 질문을 조회해봅니다.
    let question: question | null = null;
    if (dto.questionId) {
      question = await this.prisma.question.findUnique({
        where: { id: dto.questionId },
      });
      if (!question) throw new HttpException(noQuestionError, HttpStatus.NOT_FOUND);
      if (question.shared_solution_video_id) throw new ConflictException('이미 답변이 있는 질문입니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 이미 풀이영상이 있는지 확인합니다.
      let shared_solution: shared_solution_video | null = null;

      if (dto.problemId) {
        shared_solution = await tx.shared_solution_video.findFirst({
          where: {
            user_uuid: uuid,
            problem_id: dto.problemId ? dto.problemId : undefined,
            deleted_at: null,
          },
        });
      }

      if (!shared_solution) {
        // 기존 풀이영상이 아예 없거나 질문에 연동된 풀이영상이라면 그냥 생성합니다.
        shared_solution = await tx.shared_solution_video.create({
          data: {
            problem_id: dto.problemId ? dto.problemId : question!.problem_id,
            video_path: dto.videoPath,
            shared_solution_video_data: {
              create: {
                like_count: 0,
                pause_count: 0,
                play_count: 0,
                view_count: 0,
                watch_time: 0,
              },
            },
            user_uuid: uuid,
            shared_solution_video_share: {
              create: {
                scope: dto.scope,
                school_class_id: schoolClass.id,
                pinned: false,
                user_uuid: uuid,
              },
            },
          },
        });
      } else {
        // 기존에 내가 푼 영상이 있는 경우 영상 경로, 공유 범위만 업데이트하고 상단 고정 여부는 초기화합니다.
        shared_solution = await tx.shared_solution_video.update({
          where: { id: shared_solution.id },
          data: {
            video_path: dto.videoPath,
            shared_solution_video_share: {
              update: {
                scope: dto.scope,
                pinned: false,
              },
            },
          },
        });
      }

      // 만약 질문에 대한 답변 풀이라면 question 테이블도 업데이트해줍니다.
      if (dto.questionId) {
        await tx.question.update({
          where: { id: dto.questionId },
          data: {
            shared_solution_video_id: shared_solution.id,
          },
        });
      }

      return shared_solution;
    });
  }

  async findSchoolClassFromClassInfo(classInfo: ClassInfo) {
    return await this.prisma.school_class.findFirst({
      where: {
        class: classInfo.user_class,
        grade: classInfo.user_grade,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });
  }

  async deleteAnswerForQuestion(id: number, uuid: string) {
    const sharedSolutionVideo = await this.prisma.shared_solution_video.findUnique({
      where: { id: id },
    });

    if (!sharedSolutionVideo) throw new HttpException(noAnswerError, HttpStatus.NOT_FOUND);

    if (sharedSolutionVideo.deleted_at) throw new HttpException('이미 삭제된 답변입니다.', HttpStatus.CONFLICT);

    if (sharedSolutionVideo.user_uuid !== uuid) throw new HttpException('오직 작성자만이 답변을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.shared_solution_video.update({
      where: { id: id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async addPlayCountForAnswer(id: number) {
    const answer = await this.prisma.shared_solution_video.findUnique({
      where: { id: id },
      select: {
        shared_solution_video_data: {
          select: {
            id: true,
          },
        },
        id: true,
      },
    });

    if (!answer) throw new HttpException(noAnswerError, HttpStatus.NOT_FOUND);

    return await this.prisma.shared_solution_video_data.update({
      where: { id: answer.shared_solution_video_data!.id },
      data: {
        play_count: {
          increment: 1,
        },
      },
    });
  }
  async addPlayTimeForAnswer(id: number, timeInSecond: number) {
    const answer = await this.prisma.shared_solution_video.findUnique({
      where: { id: id },
      select: {
        shared_solution_video_data: {
          select: {
            id: true,
          },
        },
        id: true,
      },
    });

    if (!answer) throw new HttpException(noAnswerError, HttpStatus.NOT_FOUND);

    return await this.prisma.shared_solution_video_data.update({
      where: { id: answer.shared_solution_video_data!.id },
      data: {
        watch_time: {
          increment: timeInSecond,
        },
      },
    });
  }
  async pauseAnswerForQuestion(id: number) {
    const answer = await this.prisma.shared_solution_video.findUnique({
      where: { id: id },
      select: {
        shared_solution_video_data: {
          select: {
            id: true,
          },
        },
        id: true,
      },
    });

    if (!answer) throw new HttpException(noAnswerError, HttpStatus.NOT_FOUND);

    return await this.prisma.shared_solution_video_data.update({
      where: { id: answer.shared_solution_video_data!.id },
      data: {
        pause_count: {
          increment: 1,
        },
      },
    });
  }
}
