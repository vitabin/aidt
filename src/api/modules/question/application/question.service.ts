import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma, QuestionScope, QuestionStatus, question } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { GetQuestionsDto } from './dto/getQuestions.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProblemSolving } from '../../problem';
import { EProblemSolvingScope } from '../../study';
import { CreateQuestionDto } from './dto';

const noQuestionError = '질문을 찾을 수 없습니다.';
const noAnswerError = '답변을 찾을 수 없습니다.';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async putQuestionForProblem(dto: CreateQuestionDto, user_uuid: string): Promise<question> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
    });

    if (!problem) throw new HttpException('문제를 찾을 수 없습니다.', 404);

    const learning_sys = await this.prisma.learning_sys.findFirst({
      where: { cls_id: problem.cls_id },
    });

    if (!learning_sys) throw new HttpException('학습 체계를 찾을 수 없습니다.', 404);

    return await this.prisma.question.create({
      data: {
        problem_id: dto.problemId,
        scope: dto.scope,
        question_user_uuid: user_uuid,
        title: dto.title,
        learning_sys_id: learning_sys.id,
      },
    });
  }

  async getQuestionForProblem(dto: GetQuestionsDto, user_uuid: string) {
    const { onlyMine, page, pageSize, titleKeyword, unitNameKeyword } = dto;

    const where: Prisma.questionWhereInput = {
      question_user_uuid: onlyMine ? user_uuid : undefined,
      shared_solution_video: onlyMine ? undefined : { is: null },
      status: onlyMine
        ? undefined
        : {
            not: {
              equals: QuestionStatus.SOLVING,
            },
          },
      deleted_at: null,
      title: titleKeyword
        ? {
            contains: titleKeyword,
          }
        : undefined,
      learning_sys: unitNameKeyword
        ? {
            full_name: {
              contains: unitNameKeyword,
            },
          }
        : undefined,
    };

    const totalCount = await this.prisma.question.count({
      where: where,
    });
    if (totalCount === 0) {
      return {
        questions: [],
        totalPage: 0,
      };
    }

    let answeredQuestionsCount = undefined;
    let awaitingQuestionsCount = undefined;

    if (onlyMine) {
      answeredQuestionsCount = await this.prisma.question.count({
        where: {
          question_user_uuid: user_uuid,
          shared_solution_video_id: {
            not: null,
          },
          deleted_at: null,
        },
      });
      awaitingQuestionsCount = totalCount - answeredQuestionsCount;
    }

    const question = await this.prisma.question.findMany({
      where: where,
      orderBy: { created_at: 'desc' },
      include: {
        shared_solution_video: {
          include: {
            shared_solution_video_share: true,
          },
        },
        problem: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPage = Math.ceil(totalCount / pageSize);

    if (question.length === 0) {
      return {
        questions: [],
        totalPage: totalPage,
      };
    }

    return {
      questions: question,
      totalPage: totalPage,
      answeredQuestionsCount: onlyMine ? answeredQuestionsCount : undefined,
      awaitingQuestionsCount: onlyMine ? awaitingQuestionsCount : undefined,
    };
  }

  async getQnAsByUuids(uuids: string[]) {
    return await this.prisma.question.findMany({
      where: {
        OR: [
          {
            question_user_uuid: {
              in: uuids,
            },
          },
          {
            shared_solution_video: {
              user_uuid: {
                in: uuids,
              },
            },
          },
        ],
        deleted_at: null,
      },
      include: {
        shared_solution_video: true,
      },
    });
  }

  async getAnswerForQuestion(id: number): Promise<ProblemSolving> {
    const question = await this.prisma.question.findUnique({
      where: { id: id, deleted_at: null },
      include: {
        shared_solution_video: { include: { shared_solution_video_share: true } },
      },
    });

    if (!question) throw new HttpException(noQuestionError, HttpStatus.NOT_FOUND);

    if (!question.shared_solution_video) throw new HttpException(noAnswerError, HttpStatus.NOT_FOUND);
    return {
      videoPath: question.shared_solution_video.video_path,
      createdAt: question.shared_solution_video?.created_at,
      id: question.shared_solution_video.id,
      problemId: question.problem_id,
      userUuid: question.shared_solution_video.user_uuid,
      scope: question.shared_solution_video.shared_solution_video_share!.scope as EProblemSolvingScope,
    };
  }

  async startAnswerForQuestion(id: number, user_uuid: string) {
    const startAnsweringData = await this.cacheManager.get(`startAnsweringData-${id}`);
    const userAttempt = await this.cacheManager.get(`userAttemptToAnswer-${user_uuid}`);

    if (startAnsweringData && !userAttempt) throw new HttpException('이미 답변 중인 질문입니다.', HttpStatus.CONFLICT);

    const question = await this.prisma.question.findUnique({
      where: {
        id: id,
        deleted_at: null,
      },

      include: {
        shared_solution_video: { select: { id: true } },
      },
    });

    if (!question) throw new HttpException(noQuestionError, HttpStatus.NOT_FOUND);

    if (question.shared_solution_video) throw new HttpException('이미 답변이 완료된 질문입니다.', HttpStatus.CONFLICT);

    await this.prisma.$transaction(async (tx) => {
      await this.cacheManager.set(`startAnsweringData-${id}`, true, 20 * 60 * 1000);
      await this.cacheManager.set(`userAttemptToAnswer-${user_uuid}`, true, 20 * 60 * 1000);
      await tx.question.update({
        where: { id: id },
        data: {
          status: QuestionStatus.SOLVING,
        },
      });
    });
  }
}
