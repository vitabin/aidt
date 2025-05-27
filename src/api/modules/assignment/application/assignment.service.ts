/* eslint-disable sonarjs/prefer-single-boolean-return */
import { BadRequestException, ConflictException, Injectable, NotFoundException, UseFilters } from '@nestjs/common';
import { GetAssignmentGaveDto, AssignmentFinishDto, GetAssignmentDto, SubmitAssignmentDto, UnfinishedAssignmentDto, AssignmentCheckDto } from './dto';
import { PrismaService } from 'src/prisma';
import { AssignmentStatus, AssignmentType, assignment_finish } from '@prisma/client';
import { StudyQueryRepository, StudyService } from '../../study';
import { GetQuestionBankDto, ProblemDto, ProblemQueryRepository, ProblemQuestionType } from '../../problem';
import { AssignmentExistDto } from './dto/assignmentExist.dto';
import { LearningService } from '../../learning/application/learning.service';
import { GetExistAssignmentDto } from './dto/getExistAssignment.dto';
import { ResultBoardDto, Results } from '../../dashboard/application/dto';
import { AssignmentPerformWithProblemDto } from './dto/assignmentPerformWithProblem.dto';
import { ProblemTo } from '../../problem/infrastructure/problem.type';
import { NotificationService } from '../../notification/application';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studyQuery: StudyQueryRepository,
    private readonly studyService: StudyService,
    private readonly problemQuery: ProblemQueryRepository,
    private readonly learningService: LearningService,
    private readonly noficiationService: NotificationService,
  ) {}

  @UseFilters(NotFoundException, BadRequestException) // 함수단위 NotFound, BadRequest 예외처리
  async insertAssignmentFinish(assignmentFinishDto: AssignmentFinishDto, uuid: string): Promise<assignment_finish[]> {
    const { assignment_gave_id, finished_at } = assignmentFinishDto;
    return await Promise.all(
      assignment_gave_id.map(async (v) => {
        //과제가 존재하는지 확인한다.
        const assignmentGave = await this.prisma.assignment_gave.findUnique({
          where: { id: v },
        });
        if (!assignmentGave) throw new NotFoundException('부여된 과제를 찾을 수 없습니다.');

        //현재 유저가 과제를 받았는지 확인한다.
        const assignmentGivenUser = await this.prisma.assignment_gave_user.findFirst({
          where: {
            assignment_gave_id: v,
            user_uuid: uuid,
          },
        });
        if (!assignmentGivenUser) throw new BadRequestException('해당 과제를 받은 유저가 아닙니다.');

        //현재 유저가 이미 과제를 제출했는지 확인한다.
        const assignmentAlreadyFinish = await this.prisma.assignment_finish.findFirst({
          where: {
            assignment_gave_id: v,
            user_uuid: uuid,
          },
        });
        if (assignmentAlreadyFinish) throw new BadRequestException('이미 과제를 제출하셨습니다.');

        //모두 통과하면 과제 완료 객체 생성.
        return await this.prisma.assignment_finish.create({
          data: {
            assignment_gave_id: v,
            finished_at: finished_at,
            user_uuid: uuid,
          },
        });
      }),
    );
  }

  async createAssignment(getAssignmentGaveDto: GetAssignmentGaveDto, uuid: string) {
    const { classUuids, types, learningSysId, factor } = getAssignmentGaveDto;
    const dst = [];
    const problemTo = new ProblemTo();
    const assingmentMap: Map<string, Array<ProblemDto>> = new Map();
    classUuids.forEach((v) => assingmentMap.set(v, []));

    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    for await (const learningSys of learningSyses) {
      const learningMap = await this.prisma.learning_map.findFirst({ where: { learning_sys_doc_id: learningSys.learning_sys_doc_id } });
      if (!learningMap) throw new NotFoundException('요청한 단원의 Learning Map을 찾을 수 없습니다.');
      const learningMapNode = await this.prisma.learning_map_node.findFirst({ where: { learning_map_id: learningMap.id } });
      if (!learningMapNode) throw new NotFoundException('Learning Map Node를 찾을 수 없습니다.');
      for (const type of types) {
        const isExist = await this.prisma.assignment_gave.findFirst({
          where: {
            user_uuid: uuid,
            learning_map_id: learningMap.id,
            learning_sys_id: learningSys.id,
            type: type,
          },
        });

        if (isExist) continue;
        const data = {
          user_uuid: uuid,
          learning_map_id: learningMap.id,
          learning_sys_id: learningSys.id,
          type: type,
          given_at: new Date(),
        };
        const assignmentGave = await this.prisma.assignment_gave.create({
          data: data,
        });
        problemTo.assignmentId = assignmentGave.id;

        //gave node 제작
        await this.prisma.assignment_gave_node.create({
          data: {
            assignment_gave_id: assignmentGave.id,
            node_id: learningMapNode.id,
          },
        });

        const studyProblems = await this.searchValidStudyProblem(type, learningSys.id, classUuids);
        const studyPerforms = studyProblems.map((v) => v.study_perform).flat();
        const created = [];
        for await (const id of classUuids) {
          let userProblems = [];

          if (type !== AssignmentType.METACOGNITION) {
            userProblems = studyPerforms.filter((v) => v.is_correct === 0 && v.user_uuid === id);
          } else {
            userProblems = studyPerforms.filter((v) => v.user_uuid === id && v.is_correct === 0 && v.confidence === 1);
          }

          if (!userProblems.length) continue;

          const studyProblemIds = userProblems.map((v) => v.study_problem_id);
          const problemIds = studyProblems.filter((v) => studyProblemIds.includes(v.id)).map((v) => v.problem_id);
          const problems = await this.problemQuery.getProblemByIds(problemIds);
          for await (const problem of problems) {
            const query = new GetQuestionBankDto();
            query.difficulty = problem.difficulty;
            query.problemId = problem.id;
            query.learningSysId = learningSysId;
            query.problemType = ProblemQuestionType.SIMILAR;

            const assignments = (await this.studyService.searchBankedQuestions(query, id, problemTo)).slice(0, factor);
            assingmentMap.get(id)!.push(...assignments);
          }
          const assignmentGaveUser = await this.prisma.assignment_gave_user.create({
            data: {
              user_uuid: id,
              assignment_gave_id: assignmentGave.id,
            },
          });

          await this.noficiationService.create({
            taker_uuid: id, //받는사람 (학생)
            trigger_uuid: uuid, //보내는사람 (선생)
            action: 10,
            additional_data1: assignmentGave.id,
            additional_data2: learningSys.id,
            additional_text: learningSys.name,
          });
          created.push(assignmentGaveUser);
        }
        dst.push({ type: type, createdUser: created });
      }
    }
    const createdUser = Array.from(new Set(...dst.map((v) => v.createdUser)));

    await Promise.all(
      createdUser.map(async (v) => {
        const problemDtos = assingmentMap.get(v.user_uuid)!;
        problemDtos.slice(0, 20).map(async (e) => {
          await this.prisma.assignment_problem.create({
            data: {
              problem_id: e.problem_id,
              assignment_gave_user_id: v.id,
            },
          });
        });
      }),
    );
    return dst;
  }

  async searchValidStudyProblem(type: AssignmentType, learningSysId: number, classUuids: string[]) {
    if (type === AssignmentType.METACOGNITION) {
      const studies = await this.studyQuery.getStudiesByLearningSysId(learningSysId);
      const studyIds = studies.map((v) => v.id);
      return await this.studyQuery.getStudyProblesmWithPerforms(studyIds, classUuids);
    }
    const studys = await this.studyQuery.getStudyWithAllRelation(classUuids, learningSysId, type);
    if (!studys) throw new NotFoundException('학급의 학습 이럭이 존재하지 않습니다.');
    return studys.study_problem;
  }

  async checkUserAssignment(uuid: string, getExistAssignmentDto: GetExistAssignmentDto): Promise<AssignmentExistDto[]> {
    const { learningSysId } = getExistAssignmentDto;

    const existDto: AssignmentExistDto[] = [];
    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const userAssignment = await this.prisma.assignment_gave.findMany({
      where: {
        learning_sys_id: {
          in: learningSyses.map((v) => v.id),
        },
        assignment_gave_user: {
          every: {
            user_uuid: uuid,
          },
        },
      },
    });

    if (userAssignment.length === 0) return existDto;

    const userAssginmentIds = userAssignment.map((v) => v.id);
    const finishedAssignments = await this.prisma.assignment_finish.findMany({
      where: {
        assignment_gave_id: {
          in: userAssginmentIds,
        },
      },
    });
    for await (const assignment of userAssignment) {
      const finishOfThis = finishedAssignments.find((v) => v.assignment_gave_id === assignment.id) || null;
      existDto.push(AssignmentExistDto.create(uuid, learningSysId, assignment.id, assignment.type, finishOfThis));
    }
    return existDto;
  }

  async getAssignmentResultBoard(uuid: string, getExistAssignment: GetExistAssignmentDto): Promise<ResultBoardDto[]> {
    const { learningSysId } = getExistAssignment;
    const resultBoardDto: ResultBoardDto[] = [];

    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const laerningSysIds = learningSyses.map((v) => v.id);

    const userAssignments = await this.prisma.assignment_gave.findMany({
      include: {
        assignment_gave_user: {
          include: {
            assignment_problem: {
              include: {
                assignment_perform: true,
              },
            },
          },
          where: {
            user_uuid: uuid,
          },
        },
      },
      where: {
        learning_sys_id: {
          in: laerningSysIds,
        },
      },
    });
    const userAchievement = await this.prisma.user_achievement.findFirst({
      include: {
        learning_level: true,
      },
      where: {
        user_uuid: uuid,
      },
    });

    if (!userAchievement) throw new NotFoundException('유저 성취정보가 존재하지 않습니다.');

    for await (const sys of learningSyses) {
      const assignmentOnSys = userAssignments.find((v) => v.learning_sys_id === sys.id);

      if (!assignmentOnSys) continue;
      const gaveUser = assignmentOnSys.assignment_gave_user.find((v) => v.assignment_problem.length && v.user_uuid === uuid);

      if (!gaveUser) continue;
      const gaveUserProblem = gaveUser.assignment_problem;
      const problems = await this.problemQuery.getProblemByIds(gaveUserProblem.map((v) => v.problem_id));
      const results = await Promise.all(
        gaveUserProblem.map(async (v) => {
          const difficulty = problems.find((e) => e.id === v.problem_id)!.difficulty;
          const perform = v.assignment_perform;
          return Results.create(v.problem_id, difficulty, perform!.is_correct);
        }),
      );
      const resultBoard = ResultBoardDto.create(uuid, userAchievement.learning_level.level, results);
      resultBoard.assignmentId = assignmentOnSys.id;
      resultBoardDto.push(resultBoard);
    }

    return resultBoardDto;
  }

  async getAssignmentProblemsResult(assignment_gave_id: number, uuid: string) {
    //일단 해당 과제가 유저에게 제출됐는지 가져옴.
    const assignmentGaveUser = await this.prisma.assignment_gave_user.findFirst({
      where: {
        assignment_gave_id: assignment_gave_id,
        user_uuid: uuid,
      },
    });
    if (!assignmentGaveUser) throw new NotFoundException('해당 과제를 받은 유저가 아닙니다.');

    //해당 과제-개인별 문제 가져옴
    const assignmentProblems = await this.prisma.assignment_problem.findMany({
      where: {
        assignment_gave_user_id: assignmentGaveUser.id,
      },
      include: {
        assignment_perform: true,
      },
    });

    if (assignmentProblems.length === 0) throw new NotFoundException('해당 과제에 대한 개인별 문제가 존재하지 않습니다.');

    //문제 불러오기
    const tmpDto = [...assignmentProblems];
    const result = [];
    for (const assignmentProblem of tmpDto) {
      const tmp: AssignmentPerformWithProblemDto = { ...assignmentProblem };
      const problem = await this.prisma.problem.findFirst({
        where: {
          id: assignmentProblem.problem_id,
        },
      });
      const learningSysData = await this.prisma.learning_sys.findFirst({
        where: {
          cls_id: problem?.cls_id,
        },
      });
      tmp.problem = problem;
      tmp.learning_sys_fullname = learningSysData?.full_name;
      result.push(tmp);
    }

    return result;
  }

  async getAssignment(getAssignmentDto: GetAssignmentDto, uuid: string) {
    const { learningSysId, assignmentType } = getAssignmentDto;

    const assignment = await this.prisma.assignment_gave.findMany({
      include: {
        assignment_gave_user: {
          where: {
            user_uuid: uuid,
          },
        },
      },
      where: {
        learning_sys_id: learningSysId,
        type: {
          in: assignmentType,
        },
      },
    });

    if (!assignment.length) throw new NotFoundException('제출된 과제가 없습니다.');

    const assignmentIds = assignment.filter((v) => v.assignment_gave_user.length).map((v) => v.id);
    const userAssignments = await this.prisma.assignment_gave_user.findMany({
      include: {
        assignment_problem: {
          orderBy: {
            problem_id: 'desc',
          },
        },
      },
      where: {
        user_uuid: uuid,
        assignment_gave_id: {
          in: assignmentIds,
        },
      },
    });

    if (!userAssignments.length) throw new NotFoundException('유저 과제 정보를 찾을 수 없습니다.');

    const dst: ProblemDto[] = [];

    for await (const userAssignment of userAssignments) {
      const userAssignmentProblems = userAssignment.assignment_problem;
      const problemIds = userAssignmentProblems.map((v) => v.problem_id);
      const problems = await this.problemQuery.getProblemByIds(problemIds);
      const assignmentProblemIds = userAssignmentProblems.map((v) => v.id);
      const assignmentPerforms = await this.prisma.assignment_perform.findMany({
        where: {
          assignment_problem_id: {
            in: assignmentProblemIds,
          },
        },
      });
      for (const userAssignmentProblem of userAssignmentProblems) {
        const vaildProblem = problems.find((v) => v.id === userAssignmentProblem.problem_id);
        const vaildPerform = assignmentPerforms.find((v) => v.assignment_problem_id === userAssignmentProblem.id);
        const problemDto = ProblemDto.from(vaildProblem!);
        problemDto.assignment_perform = vaildPerform;
        problemDto.assignment_id = userAssignment.id;
        dst.push(problemDto);
      }
    }
    return dst;
  }

  async submitAssignment(submitAssignmentDto: SubmitAssignmentDto, uuid: string) {
    const { confidence, answer, problemId, assignmentId } = submitAssignmentDto;

    const assignmentGaveUser = await this.prisma.assignment_gave_user.findFirst({
      include: {
        assignment_problem: true,
      },
      where: {
        id: assignmentId,
        user_uuid: uuid,
      },
    });

    if (!assignmentGaveUser) throw new BadRequestException('해당 유저의 문제가 아닙니다.');

    const assignmentGave = await this.prisma.assignment_gave.findFirst({
      where: {
        id: assignmentGaveUser.assignment_gave_id,
      },
    });

    if (!assignmentGave) throw new NotFoundException('과제를 찾을 수 없습니다.');

    const userAssignmentProblem = assignmentGaveUser.assignment_problem.find((v) => v.problem_id === problemId);

    if (!userAssignmentProblem) throw new NotFoundException('문제를 찾을 수 없습니다.');

    const orgProb = await this.prisma.problem.findFirstOrThrow({
      where: {
        id: userAssignmentProblem.problem_id,
      },
    });

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const givenUserAssignments = await prisma.assignment_gave_user.findMany({
          where: {
            user_uuid: uuid,
          },
        });
        const givenUserAssignmentsId = givenUserAssignments.map((v) => v.id);
        const userAllAssignmentProblems = await prisma.assignment_problem.findMany({
          where: {
            assignment_gave_user_id: {
              in: givenUserAssignmentsId,
            },
          },
        });

        // 아래에서 업데이트 하기 직전에 SUBMIT 상태의 문제 개수를 조회한다.
        // 이렇게 해야 최초로 전체 제출을 완료한건지, 그냥 문제를 다 제출한건지 구분할 수 있다.
        const userAlreadySubmittedProblems = userAllAssignmentProblems.filter((v) => v.status === AssignmentStatus.SUBMIT);

        const assignmentProblem = await prisma.assignment_problem.update({
          where: {
            id: userAssignmentProblem.id,
          },
          data: {
            status: AssignmentStatus.SUBMIT,
          },
        });

        if (userAlreadySubmittedProblems.length + 1 === userAllAssignmentProblems.length) {
          //최초 전체 제출 완료를 확인함.
          const assignmentGaves = await prisma.assignment_gave.findMany({
            where: {
              user_uuid: uuid,
              learning_sys_id: assignmentGave.learning_sys_id,
            },
          });
          for await (const assignmentGave of assignmentGaves) {
            await prisma.assignment_finish.create({
              data: {
                user_uuid: uuid,
                assignment_gave_id: assignmentGave.id,
                finished_at: new Date(),
              },
            });
          }
        }

        const isExist = await this.prisma.assignment_perform.findFirst({
          where: {
            assignment_problem_id: assignmentProblem.id,
          },
        });

        if (isExist) {
          return {
            id: isExist.id,
            assignment_problem_id: isExist.assignment_problem_id,
            submission_answer: answer,
            is_correct: answer === orgProb.answer_data ? 1 : 0,
            confidence: isExist.confidence,
            created_at: isExist.created_at,
          };
        }

        return await prisma.assignment_perform.create({
          data: {
            assignment_problem_id: assignmentProblem.id,
            submission_answer: answer,
            is_correct: answer === orgProb.answer_data ? 1 : 0,
            confidence: confidence,
          },
        });
      });
    } catch (e) {
      throw new ConflictException('과제 제출 실패');
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async checkFinish(teacherUuid: string, assignmentCheckDto: AssignmentCheckDto) {
    const learningSysId = assignmentCheckDto.learningSysId;
    const assignments = await this.prisma.assignment_gave.findMany({
      where: {
        learning_sys_id: learningSysId,
        user_uuid: teacherUuid,
      },
    });
    const assignmentsIds = assignments.map((v) => v.id);
    if (assignmentsIds.length === 0) throw new NotFoundException('아직 과제를 부여하지 않았습니다.');

    const finished = await this.prisma.assignment_finish.findMany({
      where: {
        user_uuid: {
          in: assignmentCheckDto.classUuids,
        },
        assignment_gave_id: {
          in: assignmentsIds,
        },
      },
    });

    const dst = [];
    for await (const uuid of assignmentCheckDto.classUuids) {
      const userFinished = finished.filter((v) => v.user_uuid === uuid);
      dst.push(UnfinishedAssignmentDto.create(uuid, userFinished));
    }
    return dst;
  }

  async checkGavePossible(uuid: string, learningSysId: number) {
    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const learningSysIds = learningSyses.map((v) => v.id);
    const assignments = await this.prisma.assignment_gave.findMany({
      where: {
        learning_sys_id: {
          in: learningSysIds,
        },
        user_uuid: uuid,
      },
    });

    if (!assignments.length) return true;

    return false;
  }
}
