/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable sonarjs/no-duplicate-string */
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import {
  AccumulateDto,
  AverageDataDto,
  ResultBoardDto,
  GetTeacherWeakChaptersDto,
  StudentAchievementLevelDto,
  StudentProgressRateDto,
  StudentStudyDurationDto,
  StudentWeakChaptersDto,
  TeacherWeakChaptersDto,
  Results,
  AccumulatePerformDto,
  GetDescendingIn2StudentsDto,
  LearningHistoryDto,
  GetLearningHistoryDto,
  AverageHistoryItem,
  TotalHistory,
  GetAccumulateDto,
  GetAssessmentHistoryDto,
  DescendingPart,
  GetTeacherUserPlanNotesDto,
  UserPlanNoteDto,
  MvpDto,
  GetTeacherDashboardProblemsDto,
  GetTeacherDashboardConceptVideosDto,
  GetAchievementStandardUsersDto,
  studentAchievementStandardResponseDto,
} from './dto';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from '../../problem/infrastructure';
import { StudyQueryRepository } from '../../study';
import { QuestionService } from '../../question/application/question.service';
import { PrismaService } from 'src/prisma';
import { LearningSysMapNodeQueryRepository } from '../../learning/infrastructure/learning_map';
import { UserAchievementService } from '../../user_achievement/application';
import { StatisticDto, StatisticItem } from './dto/statistic.dto';
import { HistoryService, LearningHistorySummary } from 'src/history/history.service';
import { AchievementType, AssessmentType, ContentStatus, StudyType, UnitType, achievement_standard, learning_map_node, learning_sys, study } from '@prisma/client';
import {
  AssignmentProbWithPerform,
  CommonConceptVideoWithPlay,
  ConceptWithSolving,
  CurrentAchievement,
  StudyPerform,
  StudyProblemWithPerforms,
} from '../infrastucture';
import { LearningService } from '../../learning/application/learning.service';
import { UserService } from '../../user/application';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { orderBy } from 'lodash';
import { GetAchievementStandardDto } from './dto/getAchievementStandard.dto';
import { EProblemDifficulty } from '../../problem/infrastructure/problem.difficulty.enum';
import { GetStudentWeakChaptersDto } from './dto/getStudentWeakChapters.dto';
import { LearningSysQueryRepository } from '../../learning';

@Injectable()
export class DashboardService {
  readonly logger: Logger = new Logger(DashboardService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: HistoryService,
    private readonly studyQuery: StudyQueryRepository,
    private readonly problemSolvingQuery: ProblemSolvingQueryRepository,
    private readonly questionService: QuestionService,
    private readonly problemQuery: ProblemQueryRepository,
    private readonly learningSysMapQueryRepository: LearningSysMapNodeQueryRepository,
    private readonly userAchievementService: UserAchievementService,
    private readonly learningService: LearningService,
    private readonly userService: UserService,
    private readonly learningSysQuery: LearningSysQueryRepository,
  ) {}

  async getAccumulate1Page(getAccumulateDto: GetAccumulateDto, user_uuid: string): Promise<AccumulateDto> {
    const { classUuids } = getAccumulateDto;
    let totalActivity: number = 0;
    let myActivity: number = 0;

    const classStudyPerforms = await this.studyQuery.getStudyPerformByUuids(classUuids);
    const classQnAs = await this.questionService.getQnAsByUuids(classUuids);
    const classAnnounceLikes = await this.prisma.announcement_content_like.findMany({ where: { user_uuid: { in: classUuids } } });
    const classConceptRefLikes = await this.prisma.concept_reference_like.findMany({ where: { user_uuid: { in: classUuids } } });
    const classConcepVidLikes = await this.prisma.concept_video_like.findMany({ where: { user_uuid: { in: classUuids } } });
    const classAnnounceComments = await this.prisma.announcement_comment.findMany({ where: { user_uuid: { in: classUuids } } });
    const classConceptRefComments = await this.prisma.concept_reference_comment.findMany({ where: { user_uuid: { in: classUuids } } });
    const classConcepVidComments = await this.prisma.concept_video_comment.findMany({ where: { user_uuid: { in: classUuids } } });
    const classCommonConceptVidLikes = await this.prisma.common_concept_video_like.findMany({ where: { user_uuid: { in: classUuids } } });
    const classCommonConceptVidComments = await this.prisma.common_concept_video_comment.findMany({ where: { user_uuid: { in: classUuids } } });
    const classShardedSolutionVidLikes = await this.prisma.shared_solution_video_like.findMany({ where: { user_uuid: { in: classUuids } } });
    const classShardedSoluntionComments = await this.prisma.shared_solution_video_comment.findMany({ where: { user_uuid: { in: classUuids } } });

    const userStudyPerforms = classStudyPerforms.filter((v) => v.user_uuid == user_uuid);
    const userQnAs = classQnAs.filter((v) => v.question_user_uuid === user_uuid || v.shared_solution_video?.user_uuid === user_uuid);
    const userAnnounceLikes = classAnnounceLikes.filter((v) => v.user_uuid === user_uuid);
    const userAnnounceComments = classAnnounceComments.filter((v) => v.user_uuid === user_uuid);
    const userConcepVidComments = classConcepVidComments.filter((v) => v.user_uuid === user_uuid);
    const userConcepVidLikes = classConcepVidLikes.filter((v) => v.user_uuid === user_uuid);
    const userConceptRefLikes = classConceptRefLikes.filter((v) => v.user_uuid === user_uuid);
    const userConceptRefComments = classConceptRefComments.filter((v) => v.user_uuid === user_uuid);
    const userCommonConceptVidLikes = classCommonConceptVidLikes.filter((v) => v.user_uuid === user_uuid);
    const userCommonConceptVidComments = classCommonConceptVidComments.filter((v) => v.user_uuid === user_uuid);
    const userShardedSolutionVidLikes = classShardedSolutionVidLikes.filter((v) => v.user_uuid === user_uuid);
    const userShardedSoluntionComments = classShardedSoluntionComments.filter((v) => v.user_uuid === user_uuid);

    totalActivity += classAnnounceLikes.length;
    totalActivity += classAnnounceComments.length;
    totalActivity += classConceptRefLikes.length;
    totalActivity += classConceptRefComments.length;
    totalActivity += classConcepVidLikes.length;
    totalActivity += classConcepVidComments.length;
    totalActivity += classCommonConceptVidLikes.length;
    totalActivity += classCommonConceptVidComments.length;
    totalActivity += classShardedSolutionVidLikes.length;
    totalActivity += classShardedSoluntionComments.length;

    myActivity += userAnnounceLikes.length;
    myActivity += userAnnounceComments.length;
    myActivity += userConcepVidLikes.length;
    myActivity += userConcepVidComments.length;
    myActivity += userConceptRefLikes.length;
    myActivity += userConceptRefComments.length;
    myActivity += userCommonConceptVidComments.length;
    myActivity += userCommonConceptVidLikes.length;
    myActivity += userShardedSolutionVidLikes.length;
    myActivity += userShardedSoluntionComments.length;

    const meanActivity = totalActivity / classUuids.length;

    return AccumulateDto.create({ userStudyPerforms, classStudyPerforms, userQnAs, classQnAs, myActivity, meanActivity });
  }

  async getAccumulate2Page(getAccumulateDto: GetAccumulateDto, user_uuid: string): Promise<AccumulatePerformDto> {
    const classPerform = await this.studyQuery.getStudyPerformByUuids(getAccumulateDto.classUuids);
    const userPerform = classPerform.filter((v) => v.user_uuid === user_uuid);

    //아이디 값만
    const classStudyProblemIds = classPerform.map((v) => v.study_problem_id);
    const userStudyProblemIds = userPerform.map((v) => v.study_problem_id);

    //아이디 값으로 problem 조회
    const classSolvedProblems = await this.studyQuery.getStudyProblemByIds(classStudyProblemIds);
    const userSolvedProblems = await this.studyQuery.getStudyProblemByIds(userStudyProblemIds);
    const classProblems = await this.problemQuery.getProblemByIds(classSolvedProblems.map((v) => v.problem_id));
    const userProblems = await this.problemQuery.getProblemByIds(userSolvedProblems.map((v) => v.problem_id));

    return AccumulatePerformDto.create(
      classProblems,
      userProblems,
      classSolvedProblems,
      userSolvedProblems,
      classPerform,
      userPerform,
      getAccumulateDto.classUuids.length,
    );
  }

  async validateOrUpdateUserLearningStatus(uuid: string) {
    const user = await this.prisma.user.findFirstOrThrow({ where: { user_uuid: uuid } });
    const studyDatas = await this.prisma.study.findMany({
      where: {
        study_problem: {
          every: {
            study_perform: {
              every: {
                user_uuid: uuid,
                is_correct: {
                  not: -1,
                },
              },
            },
          },
        },
      },
    });
    const studyCompletedList = [];
    const studyLearningSysIds = [...new Set(studyDatas.map((v) => v.learning_sys_id))];

    for await (const studyLearningSysItem of studyLearningSysIds) {
      const learningStudyData = await this.prisma.study.findMany({
        where: {
          learning_sys_id: studyLearningSysItem,
        },
      });
      if (learningStudyData.length >= 3) studyCompletedList.push(studyLearningSysItem);
    }

    const learningMapNode = await this.prisma.learning_map_node.findFirst({
      where: {
        learning_sys_id: Math.max(...studyCompletedList),
      },
    });

    if (!learningMapNode) throw new NotFoundException('학생의 학습맵 노드 정보를 찾을 수 없습니다.');

    return await this.prisma.user.update({
      where: {
        user_uuid: uuid,
      },
      data: {
        learning_map_id: user.learning_map_id,
        current_learning_node_id: learningMapNode.id,
      },
    });
  }

  /**
   * 학생의 최근 3개 소단원의 취약한 단원을 반환하는 서비스 코드. 오답률 정보도 같이 반환하니 여러군데에서 쓰면 된다.
   * @param uuid UUID
   * @returns Array<StudentWeakChaptersDto>
   */
  async getStudentWeakChapters(uuid: string, dto: GetStudentWeakChaptersDto): Promise<StudentWeakChaptersDto[]> {
    let recent3LearningSys: learning_sys[];

    const checkLearningSys = await this.learningSysQuery.getById(dto.learningSysId);
    if (!checkLearningSys) throw new NotFoundException('단원정보를 찾을 수 없습니다.');

    if (checkLearningSys?.type === UnitType.UNIT) {
      recent3LearningSys = await this.learningSysQuery.getRecent3UnitNodesByLearningSysId(checkLearningSys.id);
    } else {
      const node = await this.learningSysMapQueryRepository.getNodeByLearningSysId(checkLearningSys.id);
      const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(node.id);
      const learningSysIds = recent3Nodes.map((v) => v.learning_sys_id);
      recent3LearningSys = await this.learningSysQuery.getByIds(learningSysIds);
    }

    const studentWeakChapters: StudentWeakChaptersDto[] = [];

    for await (const learningSys of recent3LearningSys) {
      // //학습 시스템 정보를 불러온다.
      const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSys.id);
      const currentDto = new StudentWeakChaptersDto();
      // 단원 이름을 Dto에 지정.
      if (!learningSys || !learningSys.name) throw new NotFoundException('학습 시스템 정보를 찾을 수 없습니다.');
      currentDto.chapterName = learningSys.name;

      for await (const learningSys of learningSyses) {
        const currentUserProblemPerform = await this.prisma.study_perform.findMany({
          where: {
            user_uuid: uuid,
            study_problem: {
              study: {
                learning_sys_id: learningSys.id,
                type: {
                  not: StudyType.ADDITIONAL,
                },
              },
            },
          },
          include: {
            study_problem: {
              include: {
                problem: true,
              },
            },
          },
        });

        if (!currentUserProblemPerform) return studentWeakChapters;

        for (const performance of currentUserProblemPerform!) {
          const currentProblem = performance.study_problem.problem;
          if (!currentUserProblemPerform || !currentProblem) continue;

          const difficulty = currentProblem.difficulty;
          const IsCorrect = performance.is_correct;

          currentDto[difficulty][0] += 1;
          currentDto[difficulty][1] += IsCorrect !== 1 ? 1 : 0;
          currentDto.SUM[0] += 1;
          currentDto.SUM[1] += IsCorrect !== 1 ? 1 : 0;
        }
      }
      studentWeakChapters.push(currentDto);
    }
    //각 배열의 SUM[1] (즉, 오답순)이 많은 순으로 배열한다. 그래야 취약한 단원 순으로 정렬될것이다.
    studentWeakChapters.sort((a, b) => b.SUM[1] - a.SUM[1]);

    return studentWeakChapters;
  }

  async getTeacherUserPlanNotes(dto: GetTeacherUserPlanNotesDto, uuid: string, classInfo: ClassInfo): Promise<UserPlanNoteDto[]> {
    const currentUser = await this.userService.isUuidValid(uuid);
    const { uuids } = dto;

    const currentSemesterId = await this.userService.getSemesterId(uuid);

    if (currentSemesterId) {
      const resp = [];
      const chapterPlan = await this.prisma.study_chapter_plan.findMany({
        where: {
          uuid: {
            in: uuids,
          },
          semester_id: currentSemesterId,
          learning_sys_id: 0,
        },
      });
      for await (const chapterPlanItem of chapterPlan) {
        let respDto = new UserPlanNoteDto();
        const dream = await this.prisma.user_plan_note.findFirst({
          where: {
            user_uuid: chapterPlanItem.uuid,
          },
          orderBy: {
            id: 'desc',
          },
        });
        respDto = { ...chapterPlanItem };
        respDto.dream = dream || {
          id: 0,
          user_uuid: '',
          dream_jobs: null,
          dream_reason: null,
          created_at: null,
        };
        resp.push(respDto);
      }
      return resp;
    } else {
      throw new Error(`${classInfo.user_grade} ${classInfo.semester} 해당 유저의 학기 정보를 찾을 수 없습니다.`);
    }
  }

  async getTeacherWeakChapters(dto: GetTeacherWeakChaptersDto, uuid: string): Promise<TeacherWeakChaptersDto[]> {
    let recent3LearningSys: learning_sys[];

    const checkLearningSys = await this.learningSysQuery.getById(dto.learning_sys_id);
    if (!checkLearningSys) throw new NotFoundException('단원정보를 찾을 수 없습니다.');

    if (checkLearningSys?.type === UnitType.UNIT) {
      recent3LearningSys = await this.learningSysQuery.getRecent3UnitNodesByLearningSysId(checkLearningSys.id);
    } else {
      const node = await this.learningSysMapQueryRepository.getNodeByLearningSysId(checkLearningSys.id);
      const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(node.id);
      const learningSysIds = recent3Nodes.map((v) => v.learning_sys_id);
      recent3LearningSys = await this.learningSysQuery.getByIds(learningSysIds);
    }
    const teacherWeakChapters: TeacherWeakChaptersDto[] = [];

    for await (const learningSys of recent3LearningSys) {
      const currentDto = new TeacherWeakChaptersDto();

      // 소단원 이름을 Dto에 지정.
      if (!learningSys || !learningSys.name) throw new NotFoundException('학습 시스템 정보를 찾을 수 없습니다.');
      currentDto.chapterName = learningSys.name;

      //학습 시스템 아이디로 study를 불러온다.
      const studies = await this.prisma.study.findMany({
        where: {
          learning_sys_id: learningSys.id,
        },
      });
      const studyIds = studies.map((v) => v.id);

      //이젠 학습 아이디를 가지고 학습-문제를 불러온다.
      const studyProblems = await this.prisma.study_problem.findMany({
        where: {
          study_id: {
            in: studyIds,
          },
        },
        include: {
          problem: true,
        },
      });

      const studyProblemsIds = studyProblems.map((v) => v.id);

      const currentUserProblemPerforms = await this.prisma.study_perform.findMany({
        where: {
          user_uuid: {
            in: dto.uuids,
          },
          study_problem_id: {
            in: studyProblemsIds,
          },
        },
      });
      if (!currentUserProblemPerforms) continue;

      //각 학생들의 정보만큼 반복한다.
      for (const currentUserProblemPerform of currentUserProblemPerforms) {
        const currentProblem = studyProblems.find((v) => v.id === currentUserProblemPerform.study_problem_id)?.problem;
        if (currentProblem) {
          const difficulty = currentProblem.difficulty;
          const IsCorrect = currentUserProblemPerform.is_correct;

          currentDto[difficulty][0] += 1;
          currentDto[difficulty][1] += IsCorrect !== 1 ? 0 : 1;
          currentDto.SUM[0] += 1;
          currentDto.SUM[1] += IsCorrect !== 1 ? 0 : 1;
        }
      }
      teacherWeakChapters.push(currentDto);
    }

    //각 배열의 SUM[1] (즉, 오답순)이 많은 순으로 배열한다. 그래야 취약한 단원 순으로 정렬될것이다.
    teacherWeakChapters.sort((a, b) => b.SUM[1] - a.SUM[1]);

    return teacherWeakChapters;
  }

  /**
   * 학생의 최근 3개 소단원의 진도율을 반환하는 서비스 코드
   * @param uuid UUID
   * @returns Array<StudentProgressRateDto>
   */
  async getStudentProgressRates(uuid: string): Promise<StudentProgressRateDto[]> {
    const currentUserOld = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUserOld || !currentUserOld.current_learning_node_id) await this.validateOrUpdateUserLearningStatus(uuid);

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });

    if (!currentUser || !currentUser.current_learning_node_id) throw new NotFoundException('학생의 학습 이력 정보를 찾을 수 없습니다.');

    //현재 노드맵 아이디이고, 전, 전전 노드를 불러와야한다.
    //현재,이전,전전 노드를 불러오는 함수가 자주 쓰일 것 같아서 repository에 따로 만들어 놓았습니다.
    const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(currentUser.current_learning_node_id);
    const studentProgressRates: StudentProgressRateDto[] = [];

    for await (const node of recent3Nodes) {
      const currentDto = new StudentProgressRateDto();
      //학습 시스템 정보를 불러온다.
      const learningSys = await this.prisma.learning_sys.findUnique({
        where: {
          id: node.learning_sys_id,
        },
      });

      // 소단원 이름을 Dto에 지정.
      if (!learningSys || !learningSys.name) throw new NotFoundException('학습 시스템 정보를 찾을 수 없습니다.');
      currentDto.chapterName = learningSys.name;
      currentDto.learningMapNodeId = node.id;

      //학습 시스템 아이디로 study를 불러온다.
      const studies = await this.prisma.study.findMany({
        where: {
          learning_sys_id: node.learning_sys_id,
        },
      });
      const studyIds = studies.map((v) => v.id);

      //이젠 학습 아이디를 가지고 학습-문제를 불러온다.
      const studyProblems = await this.prisma.study_problem.findMany({
        where: {
          study_id: {
            in: studyIds,
          },
        },
      });

      let performCountOfThisStudy = 0;

      for await (const studyProblem of studyProblems) {
        const currentUserProblemPerform = await this.prisma.study_perform.findFirst({
          where: {
            user_uuid: uuid,
            study_problem_id: studyProblem.id,
          },
        });
        if (!currentUserProblemPerform) continue;
        if (currentUserProblemPerform) performCountOfThisStudy += 1;
      }
      currentDto.progressRate = performCountOfThisStudy >= 12 ? 100 : (performCountOfThisStudy / 12) * 100;
      /**
       * 왜 진도율을 계산하는데 12가 기준인가?
       * 생각해보면 소단원 하나 당,
       * 기본문제 4개 + 확인문제 4개 + 피드백문제 4개 + 오답문제 n개 = (12 + n)개 를 반드시 풀게 되어있다.
       * 근데 기본문제를 풀기 전엔 확인 문제로 못넘어가고, 확인문제를 풀기 전엔 피드백문제로 못넘어가고, 피드백문제를 풀기 전엔 오답문제로 못넘어가게 되어있다.
       * 즉, 우리는 문제 갯수를 카운팅하는 것 만으로도 이 학생이 어느정도 진도를 나갔는지 알 수 있게 되어있다.
       * FYI)
       * 0~4개 : 기본 문제를 풀고 있음
       * 5~8개 : 확인 문제를 풀고 있음
       * 9~12개 : 피드백 문제를 풀고 있음
       * 12개 이상 : 오답 문제를 풀고 있음
       * 그러므로 굳이 일일이 이 학생의 study_perform을 루프 다 돌면서, 관련된 study행을 찾고,
       * 그 study의 type을 찾아서 feedback인지, confirm인지 일일이 확인할 필요가 없다는 말이다.
       */
      studentProgressRates.push(currentDto);
    }

    return studentProgressRates;
  }

  /**
   * 학생의 최근 3개 소단원의 학습 시간을 초단위로 반환하는 서비스 코드
   * @param uuid UUID
   * @returns Array<StudentStudyDurationDto>
   */
  async getStudentStudyDurations(uuid: string): Promise<StudentStudyDurationDto[]> {
    const currentUserOld = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUserOld || !currentUserOld.current_learning_node_id) await this.validateOrUpdateUserLearningStatus(uuid);

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });

    if (!currentUser || !currentUser.current_learning_node_id) throw new NotFoundException('학생의 학습 이력 정보를 찾을 수 없습니다.');

    //현재 노드맵 아이디이고, 전, 전전 노드를 불러와야한다.
    //현재,이전,전전 노드를 불러오는 함수가 자주 쓰일 것 같아서 repository에 따로 만들어 놓았습니다.
    const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(currentUser.current_learning_node_id);
    const studentProgressRates: StudentStudyDurationDto[] = [];

    for await (const node of recent3Nodes) {
      const currentDto = new StudentStudyDurationDto();
      //학습 시스템 정보를 불러온다.
      const learningSys = await this.prisma.learning_sys.findUnique({
        where: {
          id: node.learning_sys_id,
        },
      });

      // 소단원 이름을 Dto에 지정.
      if (!learningSys || !learningSys.name) throw new NotFoundException('학습 시스템 정보를 찾을 수 없습니다.');
      currentDto.chapterName = learningSys.name;
      currentDto.learningMapNodeId = node.id;

      //학습 시스템 아이디로 study를 불러온다.
      const studies = await this.prisma.study.findMany({
        where: {
          learning_sys_id: node.learning_sys_id,
        },
      });
      const studyIds = studies.map((v) => v.id);

      //이젠 학습 아이디를 가지고 학습-문제를 불러온다.
      const studyProblems = await this.prisma.study_problem.findMany({
        where: {
          study_id: {
            in: studyIds,
          },
        },
      });

      let studyDurationInSecondsOfThisStudy = 0;

      for await (const studyProblem of studyProblems) {
        const currentUserProblemPerform = await this.prisma.study_perform.findFirst({
          where: {
            user_uuid: uuid,
            study_problem_id: studyProblem.id,
          },
        });
        if (!currentUserProblemPerform) continue;

        if (currentUserProblemPerform && currentUserProblemPerform.solving_end && currentUserProblemPerform.solving_start) {
          //풀이가 완료된 것 만 가져온다.
          const deltaMilliSecs = currentUserProblemPerform.solving_end.getTime() - currentUserProblemPerform.solving_start.getTime();
          studyDurationInSecondsOfThisStudy += deltaMilliSecs / 1000;
        }
      }
      currentDto.learningMapNodeId = node.learning_map_id;
      currentDto.studyDuration = studyDurationInSecondsOfThisStudy;
      studentProgressRates.push(currentDto);
    }

    return studentProgressRates;
  }

  /**
   * 학생의 최근 3개 소단원의 학습 단계를 반환하는 서비스 코드
   * @param uuid USER_UUID
   * @returns Array<StudentAchievementLevelDto>
   */
  async getStuentAchievementLevels(uuid: string): Promise<StudentAchievementLevelDto[]> {
    const currentUserOld = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUserOld || !currentUserOld.current_learning_node_id) await this.validateOrUpdateUserLearningStatus(uuid);

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_uuid: uuid,
      },
    });

    if (!currentUser || !currentUser.current_learning_node_id) throw new NotFoundException('학생의 학습 이력 정보를 찾을 수 없습니다.');

    //현재 노드맵 아이디이고, 전, 전전 노드를 불러와야한다.
    //현재,이전,전전 노드를 불러오는 함수가 자주 쓰일 것 같아서 repository에 따로 만들어 놓았습니다.
    const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(currentUser.current_learning_node_id);
    const studentAchievementLevels: StudentAchievementLevelDto[] = [];

    for await (const node of recent3Nodes) {
      const currentDto = new StudentAchievementLevelDto();
      //학습 시스템 정보를 불러온다.
      const learningSys = await this.prisma.learning_sys.findUnique({
        where: {
          id: node.learning_sys_id,
        },
      });

      // 소단원 이름을 Dto에 지정.
      if (!learningSys || !learningSys.name) throw new NotFoundException('학습 시스템 정보를 찾을 수 없습니다.');

      const currentUserAchievements = await this.userAchievementService.getLastUserAchievementsByLearningSysId(node.learning_sys_id, uuid);
      currentDto.learningMapNodeId = node.learning_map_id;
      currentDto.chapterName = learningSys.name;
      currentDto.achivementLevel = currentUserAchievements?.learning_level.level || -1;
      studentAchievementLevels.push(currentDto);
    }

    return studentAchievementLevels;
  }

  async getAverageDataForStrategyComment(learningSysId: number, uuid: string): Promise<AverageDataDto> {
    // 계산에 필요한 쿼리를 선행한다.
    const currentMember = await this.prisma.user.findUniqueOrThrow({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentMember) throw new NotFoundException('해당 유저 정보를 찾을 수 없습니다.');

    const currentDto = new AverageDataDto();
    const studies = await this.prisma.study.findMany({
      where: {
        learning_sys_id: learningSysId,
      },
    });
    if (!studies) throw new NotFoundException('해당 학습 정보를 찾을 수 없습니다.');
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studies.map((v) => v.id),
        },
      },
      include: {
        problem: true,
      },
    });
    if (!studyProblems) throw new NotFoundException('해당 학습과 관련된 학습-문제 정보들을 찾을 수 없습니다.');
    const studyPerforms = await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblems.map((v) => v.id),
        },
      },
    });
    const userDistinctStudyPerforms = await this.prisma.study_perform.findMany({
      distinct: ['user_uuid'],
      where: {
        study_problem_id: {
          in: studyProblems.map((v) => v.id),
        },
      },
    });

    // 1. average of study duration 계산
    const totalPerformsCount = studyPerforms.length;
    const userDistinctPerformsCount = userDistinctStudyPerforms.length;
    let solvingCompletedPerformsCount = 0;
    let totalDuration = 0;
    let myDuration = 0;
    let myPerformsCount = 0;
    for (const perform of studyPerforms) {
      if (perform.solving_end && perform.solving_start) {
        const calculatedDuration = (perform.solving_end.getTime() - perform.solving_start.getTime()) / 1000;
        totalDuration += calculatedDuration;
        if (perform.user_uuid === uuid) {
          myDuration += calculatedDuration;
          myPerformsCount++;
        }
        solvingCompletedPerformsCount++;
      }
    }
    const AVERAGE_STUDY_DURATION = solvingCompletedPerformsCount > 0 ? (totalDuration / solvingCompletedPerformsCount) * 100 : 0;
    const percentage_study_duration = AVERAGE_STUDY_DURATION > 0 ? (myDuration / AVERAGE_STUDY_DURATION) * 100 : 0;

    //2. percentage_study_performs 계산
    const AVERAGE_STUDY_PERFORMS = totalPerformsCount / userDistinctPerformsCount;
    const percentage_study_performs = AVERAGE_STUDY_PERFORMS > 0 ? (myPerformsCount / AVERAGE_STUDY_PERFORMS) * 100 : 0;

    // 4. 학습 단계를 불러온다.
    let achievement = await this.prisma.user_achievement.findFirst({
      where: {
        user_uuid: uuid,
        learning_sys_id: learningSysId,
        achievement_type: 'UNIT_END',
      },
      include: {
        learning_level: true,
      },
    });

    //현재 학습 단계가 없다면, DIAGNOSTIC을 불러온다.
    if (!achievement) {
      achievement = await this.prisma.user_achievement.findFirst({
        where: {
          user_uuid: uuid,
          achievement_type: 'DIAGNOSTIC',
        },
        include: {
          learning_level: true,
        },
        orderBy: {
          id: 'desc', //선생이 강제 설정할수도 있으므로 마지막꺼
        },
      });
    }

    // 3,5. 난이도 별 학습 문제 및 정답률을 계산한다.
    const tmpPerformsByDifficulty = {
      HIGHEST: 0,
      HIGH: 0,
      MIDDLE: 0,
      LOW: 0,
      SUM: 0,
    };

    let correctCount = 0;

    for await (const studyProblem of studyProblems) {
      const currentUserProblemPerform = studyPerforms.find((v) => v.study_problem_id === studyProblem.id && v.user_uuid === uuid);
      const currentProblem = studyProblem.problem;
      if (!currentUserProblemPerform || !currentProblem) continue;

      const difficulty = currentProblem.difficulty;
      const isCorrect = currentUserProblemPerform.is_correct;

      tmpPerformsByDifficulty[difficulty] += 1;
      tmpPerformsByDifficulty.SUM += 1;
      correctCount += isCorrect ? 1 : 0;
    }

    currentDto.percentage_study_duration = percentage_study_duration;
    currentDto.percentage_study_performs = percentage_study_performs;
    currentDto.percentage_correct_rate = (correctCount / tmpPerformsByDifficulty.SUM) * 100;
    currentDto.achievement_level = achievement?.learning_level.level || 0;
    currentDto.performs_by_difficulty = tmpPerformsByDifficulty;
    return currentDto;
  }

  async getAssessmentResultBoard(getAssessmentHistoryDto: GetAssessmentHistoryDto): Promise<ResultBoardDto[]> {
    const { classUuids, assessmentId } = getAssessmentHistoryDto;
    const assessment = await this.prisma.assessment.findFirstOrThrow({ 
      where: { 
        id: assessmentId 
      } 
    });
    const assessmentProblems = await this.prisma.assessment_problem.findMany({ 
      where: { 
        assessment_id: assessmentId 
      }, 
        orderBy: { 
          id: 'asc' 
        } 
      });
    const assessmentProblemIds = assessmentProblems.map((v) => v.id);

    const resultBoardDto: ResultBoardDto[] = [];
    for await (const id of classUuids) {
      const assessmentPerfroms = await this.prisma.assessment_perform.findMany({
        where: { 
          assessment_problem_id: { 
            in: assessmentProblemIds 
          }, 
          user_uuid: id 
        },
      });
      const performs = await Promise.all(
        assessmentPerfroms.map(async (v) => {
          const assessmentProblem = assessmentProblems.find((e) => e.id === v.assessment_problem_id);
          const problem = await this.problemQuery.findFirstOrThrow({ id: assessmentProblem!.problem_id });

          return Results.create(assessmentProblem!.problem_id, problem.difficulty, v.is_correct);
        }),
      );

      const achievement = await this.prisma.user_achievement.findFirstOrThrow({
        where: {
          user_uuid: id,
          achievement_type: this.switchAssesmentType2AchievementType(assessment.type)
        },
        include: {
          learning_level: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 1,
      });
      const resultBoard = ResultBoardDto.create(id, achievement.learning_level.level, performs);
      resultBoard.assessmentId = assessmentId;
      resultBoardDto.push(resultBoard);
    }

    return resultBoardDto;
  }

  switchAssesmentType2AchievementType(type: AssessmentType): AchievementType{
    switch (type) {
      case 'NONE':
        return AchievementType.NONE;
      case 'DIAGNOSTIC':
        return AchievementType.DIAGNOSTIC;
      case 'UNIT':
        return AchievementType.UNIT_END
      case 'COMPREHENSIVE':
        return AchievementType.COMPREHENSIVE
    }
  }

  async getDescendingIn2SubsectionsStudents(dto: GetDescendingIn2StudentsDto) {
    const { learningSysId, studentIds: uuids, fetchingParts } = dto;
    const learningLevelStudents: Set<string> = new Set();
    const problemSolvingCountStudents: Set<string> = new Set();
    const correctRateStudents: Set<string> = new Set();
    const learningTimeStudents: Set<string> = new Set();

    const learning_map_node = await this.prisma.learning_map_node.findFirst({
      where: { learning_sys: { id: learningSysId } },
    });

    if (!learning_map_node) throw new HttpException('해당 학습체계에 맞는 학습 노드를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);

    const previous_learning_map_node = await this.prisma.learning_map_node.findFirst({
      where: { link_next: learning_map_node!.id },
    });

    if (!previous_learning_map_node) return {};

    const pre_previous_learning_map_node = await this.prisma.learning_map_node.findFirst({
      where: { link_next: previous_learning_map_node!.id },
    });

    if (!pre_previous_learning_map_node) return {};

    if (fetchingParts.includes(DescendingPart.LEARNING_LEVEL)) {
      const achievement = await this.prisma.user_achievement.findMany({
        where: {
          user_uuid: { in: uuids },
          learning_map_node_id: { in: [learning_map_node!.id, previous_learning_map_node!.id, pre_previous_learning_map_node!.id] },
          is_force_apply: false,
        },
        include: {
          learning_level: true,
        },
      });

      const currentAchievements = achievement.filter((v) => v.learning_map_node_id === learning_map_node!.id);
      const previousAchievements = achievement.filter((v) => v.learning_map_node_id === previous_learning_map_node!.id);
      const prePreviousAchievements = achievement.filter((v) => v.learning_map_node_id === pre_previous_learning_map_node!.id);

      uuids.forEach((uuid) => {
        const current = currentAchievements.find((v) => v.user_uuid === uuid)?.learning_level.level;
        const previous = previousAchievements.find((v) => v.user_uuid === uuid)?.learning_level.level;
        const prePrevious = prePreviousAchievements.find((v) => v.user_uuid === uuid)?.learning_level.level;
        if ((prePrevious && previous && current && prePrevious > previous && previous > current) || (current === 1 && previous === 1 && prePrevious === 1)) {
          learningLevelStudents.add(uuid);
        }
      });
    }

    let studyPerformData: StudyPerform[] = [];

    if (fetchingParts.includes(DescendingPart.PROBLEM_SOLVING_COUNT) || fetchingParts.includes(DescendingPart.CORRECT_RATE)) {
      studyPerformData = await this.prisma.study_perform.findMany({
        where: {
          user_uuid: { in: uuids },
          study_problem: {
            study: {
              learning_sys_id: {
                in: [learning_map_node!.learning_sys_id, previous_learning_map_node!.learning_sys_id, pre_previous_learning_map_node!.learning_sys_id],
              },
            },
          },
        },
        include: {
          study_problem: {
            include: {
              study: true,
            },
          },
        },
      });
    }

    if (fetchingParts.includes(DescendingPart.PROBLEM_SOLVING_COUNT)) {
      const groupedData = studyPerformData.reduce((acc: { [userUUID: string]: { [learningSysID: string]: number } }, current) => {
        const userUUID = current.user_uuid;
        const learningSysID = current.study_problem.study.learning_sys_id;

        if (!acc[userUUID]) {
          acc[userUUID] = {};
        }

        if (!acc[userUUID][learningSysID]) {
          acc[userUUID][learningSysID] = 0;
        }

        acc[userUUID][learningSysID] += 1;
        return acc;
      }, {});

      const studentsWithDescendingCounts = Object.entries(groupedData)
        .filter(([userUUID, learningSysData]) => {
          const counts = [
            learningSysData[pre_previous_learning_map_node!.learning_sys_id.toString()] || 0,
            learningSysData[previous_learning_map_node!.learning_sys_id.toString()] || 0,
            learningSysData[learning_map_node!.learning_sys_id.toString()] || 0,
          ];
          return counts[0] > counts[1] && counts[1] > counts[2];
        })
        .map(([userUUID]) => userUUID);

      studentsWithDescendingCounts.forEach((student) => problemSolvingCountStudents.add(student));
    }

    if (fetchingParts.includes(DescendingPart.CORRECT_RATE)) {
      const groupedData = studyPerformData.reduce((acc: { [userUUID: string]: { [learningSysID: string]: { total: number; correct: number } } }, current) => {
        const userUUID = current.user_uuid;
        const learningSysID = current.study_problem.study.learning_sys_id.toString();

        if (!acc[userUUID]) {
          acc[userUUID] = {};
        }

        if (!acc[userUUID][learningSysID]) {
          acc[userUUID][learningSysID] = { total: 0, correct: 0 };
        }

        acc[userUUID][learningSysID].total += 1;
        if (current.is_correct !== 0) {
          acc[userUUID][learningSysID].correct += 1;
        }

        return acc;
      }, {});

      const correctRates = Object.entries(groupedData).map(([userUUID, learningSysData]) => {
        const rates = {
          prePrevious: learningSysData[pre_previous_learning_map_node!.learning_sys_id.toString()],
          previous: learningSysData[previous_learning_map_node!.learning_sys_id.toString()],
          current: learningSysData[learning_map_node!.learning_sys_id.toString()],
        };
        return {
          user_uuid: userUUID,
          correct_rate: {
            prePrevious: rates.prePrevious ? rates.prePrevious.correct / rates.prePrevious.total : null,
            previous: rates.previous ? rates.previous.correct / rates.previous.total : null,
            current: rates.current ? rates.current.correct / rates.current.total : null,
          },
        };
      });

      const studentsWithDescendingCorrectRates = correctRates
        .filter(({ correct_rate }) => {
          const { prePrevious, previous, current } = correct_rate;
          return prePrevious !== null && previous !== null && current !== null && prePrevious > previous && previous > current;
        })
        .map(({ user_uuid }) => user_uuid);

      studentsWithDescendingCorrectRates.forEach((student) => correctRateStudents.add(student));
    }
    const subsections = await this.learningService.sectionToSubsections(learningSysId);
    const previousSubsections = await this.learningService.sectionToSubsections(previous_learning_map_node.learning_sys_id);
    const prePreviousSubsections = await this.learningService.sectionToSubsections(pre_previous_learning_map_node.learning_sys_id);

    if (fetchingParts.includes(DescendingPart.LEARNING_TIME)) {
      const currentLearningHistory = await this.historyService.getLearningHistoryManySummaries(
        uuids,
        subsections.map((v) => v.cls_id!),
      );
      const previousLearningHistory = await this.historyService.getLearningHistoryManySummaries(
        uuids,
        previousSubsections.map((v) => v.cls_id!),
      );
      const prePreviousLearningHistory = await this.historyService.getLearningHistoryManySummaries(
        uuids,
        prePreviousSubsections.map((v) => v.cls_id!),
      );

      uuids.forEach((uuid) => {
        const current = currentLearningHistory.find((history) => history.userUuid === uuid)?.totalLearningTime || 0;
        const previous = previousLearningHistory.find((history) => history.userUuid === uuid)?.totalLearningTime || 0;
        const prePrevious = prePreviousLearningHistory.find((history) => history.userUuid === uuid)?.totalLearningTime || 0;

        if (prePrevious > previous && previous > current) {
          learningTimeStudents.add(uuid);
        }
      });
    }

    return {
      learningLevelStudents: Array.from(learningLevelStudents.values()) ?? undefined,
      problemSolvingCountStudents: Array.from(problemSolvingCountStudents.values()) ?? undefined,
      correctRateStudents: Array.from(correctRateStudents.values()) ?? undefined,
      // eslint-disable-next-line sonarjs/no-empty-collection
      learningTimeStudents: Array.from(learningTimeStudents.values()) ?? undefined,
    };
  }

  async getUserLearningHistory(getLearningHistory: GetLearningHistoryDto, user_uuid: string): Promise<LearningHistoryDto> {
    const { classUuids, learningSysId } = getLearningHistory;
    const learningHistoryDto = new LearningHistoryDto();
    const totalHistory = new TotalHistory();

    const learningSyses = await this.learningService.getSectionBelowLearningSys(getLearningHistory.learningSysId);
    const learningSysIds = learningSyses.map((v) => v.id);
    const learningSysClsIds: string[] = [];
    for await (const learningSys of learningSyses) {
      const subsections = await this.learningService.sectionToSubsections(learningSys.id);
      const clsIds = subsections.map((v) => v.cls_id!);
      learningSysClsIds.push(...clsIds);
    }

    const studies = await this.studyQuery.getStudiesByLearningSysIds(learningSysIds);
    const studyIds = studies.map((v) => v.id);
    const studyProblems = await this.studyQuery.getStudyProblesmWithPerforms(studyIds, classUuids);

    const currenctLearningMapNode = await this.prisma.learning_map_node.findMany({
      where: {
        learning_sys_id: { in: learningSysIds },
      },
    });

    if (!currenctLearningMapNode.length) throw new NotFoundException('LearningMapNode를 찾을 수 없습니다.');

    const currentAchievement = await this.prisma.user_achievement.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      include: {
        learning_level: true,
      },
    });

    if (!learningSysClsIds.length) throw new NotFoundException('현재 단원ID 의 표준학습체계 ID를 찾을수 없습니다.');

    const concept = await this.prisma.concept.findMany({
      include: {
        concept_video_id: {
          where: {
            user_uuid: {
              in: classUuids,
            },
          },
        },
      },
      where: {
        cls_id: {
          in: learningSysClsIds,
        },
        content_status: ContentStatus.ACTIVED,
      },
    });
    const conceptIds = concept.map((v) => v.id);
    const learningTimes = await this.historyService.getLearningHistorySummariesWithManyCurriculumIds(classUuids, learningSysClsIds);

    const commonConceptVideo = await this.prisma.common_concept_video.findMany({
      include: {
        common_concept_video_play: {
          where: {
            user_uuid: {
              in: classUuids,
            },
            ended_at: {
              not: null,
            },
          },
        },
      },
      where: {
        concept_id: {
          in: conceptIds,
        },
      },
    });

    for await (const uuid of classUuids) {
      const items = await this.getLearningHistory(
        uuid,
        studies,
        studyProblems,
        currenctLearningMapNode,
        currentAchievement,
        concept,
        learningTimes,
        commonConceptVideo,
      );

      if (user_uuid === uuid) learningHistoryDto.historyItem = items;
      totalHistory.totalPreviousLevel += items.previousAchievementLevel;
      totalHistory.totalAfterLevel += items.afterAchievementLevel;
      totalHistory.totalConceptVideo += items.concepStudyVideo;
      totalHistory.totalConceptExplain += items.concepStudyExplain;
      totalHistory.totalBasic += items.numBasic;
      totalHistory.totalIncorrectBasic += items.numIncorrectBasic;
      totalHistory.totalConfirm += items.numConfirm;
      totalHistory.totalIncorrectConfirm += items.numIncorrectConfirm;
      totalHistory.totalFeedback += items.numFeedback;
      totalHistory.totalIncorrectFeedback += items.numIncorrectFeedback ?? 0;
      totalHistory.totalAdditional += items.numAdditional;
      totalHistory.totalIncorrectAdditional += items.numIncorrectAdditional;
      totalHistory.totalMetaCognition += items.metacognition;
      totalHistory.totalMetaCognitionMiss += items.metacognitionMiss;
      totalHistory.totalParticipate += items.studyParticipate;
      totalHistory.totalParticipateTime += items.numStudyParticipate;
    }

    learningHistoryDto.uuid = user_uuid;
    learningHistoryDto.learningSysId = learningSysId;
    learningHistoryDto.meanHistoryItem = AverageHistoryItem.create(totalHistory, classUuids.length);

    return learningHistoryDto;
  }

  async getLearningHistory(
    user_uuid: string,
    studies: study[],
    studyProblems: StudyProblemWithPerforms[],
    currentLearningMapNode: learning_map_node[],
    currentAchievement: CurrentAchievement[],
    concept: ConceptWithSolving[],
    learningTimes: LearningHistorySummary[],
    commonConceptVideoWithPlay: CommonConceptVideoWithPlay[],
    assignmentProblems?: AssignmentProbWithPerform[],
  ) {
    const totalHistory = new TotalHistory();

    for (const study of studies) {
      const currecntProblems = studyProblems.filter((v) => v.study_id === study.id);
      const userproblems = currecntProblems.filter((v) => v.study_perform.map((e) => e.user_uuid).includes(user_uuid));
      userproblems.forEach((v) => {
        const performs = v.study_perform;
        const userPerforms = performs.filter((e) => e.user_uuid === user_uuid);
        if (study.type === StudyType.ADDITIONAL) {
          totalHistory.totalAdditional += userPerforms.length;
          totalHistory.totalIncorrectAdditional += userPerforms.filter((e) => !e.is_correct).length;
          totalHistory.totalMetaCognition += userPerforms.filter((e) => e.confidence === 1).length;
          totalHistory.totalMetaCognitionMiss += userPerforms.filter((e) => e.confidence === 1 && !e.is_correct).length;
        }
        if (study.type === StudyType.BASIC) {
          totalHistory.totalBasic += userPerforms.length;
          totalHistory.totalIncorrectBasic += userPerforms.filter((e) => !e.is_correct).length;
          totalHistory.totalMetaCognition += userPerforms.filter((e) => e.confidence === 1).length;
          totalHistory.totalMetaCognitionMiss += userPerforms.filter((e) => e.confidence === 1 && !e.is_correct).length;
        }
        if (study.type === StudyType.FEEDBACK) {
          totalHistory.totalFeedback += userPerforms.length;
          totalHistory.totalIncorrectFeedback += userPerforms.filter((e) => !e.is_correct).length;
          totalHistory.totalMetaCognition += userPerforms.filter((e) => e.confidence === 1).length;
          totalHistory.totalMetaCognitionMiss += userPerforms.filter((e) => e.confidence === 1 && !e.is_correct).length;
        }
        if (study.type === StudyType.CONFIRM) {
          totalHistory.totalConfirm += userPerforms.length;
          totalHistory.totalIncorrectConfirm += userPerforms.filter((e) => !e.is_correct).length;
          totalHistory.totalMetaCognition += userPerforms.filter((e) => e.confidence === 1).length;
          totalHistory.totalMetaCognitionMiss += userPerforms.filter((e) => e.confidence === 1 && !e.is_correct).length;
        }
      });
    }

    const userAchievement = currentAchievement.filter((v) => v.user_uuid === user_uuid);
    const previousMapNodeIds = currentLearningMapNode.filter((v) => v.link_prev).map((v) => v.link_prev!);

    if (previousMapNodeIds[0]) {
      const prevLearningMapNode = await this.prisma.learning_map_node.findFirst({
        where: {
          id: previousMapNodeIds[0],
        },
      });
      const previousAchievements = await this.prisma.user_achievement.findMany({
        include: {
          learning_level: true,
        },
        where: {
          learning_sys_id: prevLearningMapNode!.learning_sys_id,
          user_uuid: user_uuid,
        },
      });
      const priviousLevel = previousAchievements.reduce((prev, current) => prev + current.learning_level.level, 0) / previousAchievements.length;
      if (priviousLevel) totalHistory.totalPreviousLevel += priviousLevel;
    } else {
      const previousAchievements = await this.prisma.user_achievement.findMany({
        include: {
          learning_level: true,
        },
        where: {
          user_uuid: user_uuid,
          achievement_type: AchievementType.DIAGNOSTIC,
        },
      });
      const priviousLevel = previousAchievements.reduce((prev, current) => prev + current.learning_level.level, 0) / previousAchievements.length;
      if (priviousLevel) totalHistory.totalPreviousLevel += priviousLevel;
    }
    totalHistory.totalAfterLevel += userAchievement.reduce((prev, current) => prev + current.learning_level.level, 0) / userAchievement.length;

    concept.forEach((v) => {
      const video = v.concept_video_id;
      const userSolvings = video.filter((e) => e.user_uuid === user_uuid);
      totalHistory.totalConceptExplain += userSolvings.length;
    });

    commonConceptVideoWithPlay.forEach((v) => {
      const play = v.common_concept_video_play;
      const userPlay = play.filter((e) => e.user_uuid === user_uuid);
      totalHistory.totalConceptVideo += userPlay.reduce((prev, current) => (current.ended_at!.getTime() - current.created_at.getTime()) / 1000 + prev, 0);
    });

    const userParticipate = learningTimes.find((v) => v.userUuid === user_uuid);
    if (userParticipate) {
      totalHistory.totalParticipate += userParticipate.totalLengthOfHistory;
      totalHistory.totalParticipateTime += userParticipate.totalLearningTime;
    }

    if (assignmentProblems) {
      totalHistory.totalAssignment += assignmentProblems.length;
      totalHistory.totalIncorrectAssignment += assignmentProblems.filter((v) => !v.assignment_perform?.is_correct).length;
    }

    return TotalHistory.of(totalHistory);
  }

  async classLearningHistory(getLearningHistoryDto: GetLearningHistoryDto): Promise<LearningHistoryDto[]> {
    const { classUuids, learningSysId } = getLearningHistoryDto;
    const learningHistoryDtos: LearningHistoryDto[] = [];
    const totalHistory = new TotalHistory();

    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const learningSysIds = learningSyses.map((v) => v.id);
    const learningSysClsIds: string[] = [];
    for await (const learningSys of learningSyses) {
      const subsections = await this.learningService.sectionToSubsections(learningSys.id);
      const clsIds = subsections.map((v) => v.cls_id!);
      learningSysClsIds.push(...clsIds);
    }

    const studies = await this.studyQuery.getStudiesByLearningSysIds(learningSysIds);
    const studyIds = studies.map((v) => v.id);
    const studyProblems = await this.studyQuery.getStudyProblesmWithPerforms(studyIds, classUuids);

    const currenctLearningMapNode = await this.prisma.learning_map_node.findMany({
      where: {
        learning_sys_id: { in: learningSysIds },
      },
    });

    if (!currenctLearningMapNode) throw new NotFoundException('LearningMapNode를 찾을 수 없습니다.');

    const currentAchievement = await this.prisma.user_achievement.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      include: {
        learning_level: true,
      },
    });

    if (!learningSysClsIds) throw new NotFoundException('현재 단원ID 의 표준학습체계 ID를 찾을수 없습니다.');

    const concept = await this.prisma.concept.findMany({
      include: {
        concept_video_id: {
          where: {
            user_uuid: {
              in: classUuids,
            },
          },
        },
      },
      where: {
        cls_id: {
          in: learningSysClsIds,
        },
      },
    });

    const conceptIds = concept.map((v) => v.id);

    const learningTimes = await this.historyService.getLearningHistorySummariesWithManyCurriculumIds(classUuids, learningSysClsIds);

    const commonConceptVideo = await this.prisma.common_concept_video.findMany({
      include: {
        common_concept_video_play: {
          where: {
            user_uuid: {
              in: classUuids,
            },
            ended_at: {
              not: null,
            },
          },
        },
      },
      where: {
        concept_id: {
          in: conceptIds,
        },
      },
    });

    const assignments = await this.prisma.assignment_gave.findMany({
      where: {
        learning_sys_id: {
          in: learningSysIds,
        },
      },
    });
    const assignmentIds = assignments.map((v) => v.id);
    const assignmentUsers = await this.prisma.assignment_gave_user.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
        assignment_gave_id: {
          in: assignmentIds,
        },
      },
    });
    const assignmentUserIds = assignmentUsers.map((v) => v.id);
    const assignmentProblems = await this.prisma.assignment_problem.findMany({
      include: {
        assignment_perform: true,
      },
      where: {
        assignment_gave_user_id: {
          in: assignmentUserIds,
        },
      },
    });

    for await (const uuid of classUuids) {
      const learningHistoryItem = new LearningHistoryDto();
      const userAssignmnetIds = assignmentUsers.filter((v) => v.user_uuid).map((v) => v.id);
      const userAssignmnetsProblems = assignmentProblems.filter((v) => userAssignmnetIds.includes(v.assignment_gave_user_id));
      const items = await this.getLearningHistory(
        uuid,
        studies,
        studyProblems,
        currenctLearningMapNode,
        currentAchievement,
        concept,
        learningTimes,
        commonConceptVideo,
        userAssignmnetsProblems,
      );

      totalHistory.totalPreviousLevel += items.previousAchievementLevel;
      totalHistory.totalAfterLevel += items.afterAchievementLevel;
      totalHistory.totalConceptVideo += items.concepStudyVideo;
      totalHistory.totalConceptExplain += items.concepStudyExplain;
      totalHistory.totalBasic += items.numBasic;
      totalHistory.totalIncorrectBasic += items.numIncorrectBasic;
      totalHistory.totalConfirm += items.numConfirm;
      totalHistory.totalIncorrectConfirm += items.numIncorrectConfirm;
      totalHistory.totalFeedback += items.numFeedback;
      totalHistory.totalIncorrectFeedback += items.numIncorrectFeedback ?? 0;
      totalHistory.totalAdditional += items.numAdditional;
      totalHistory.totalIncorrectAdditional += items.numIncorrectAdditional;
      totalHistory.totalMetaCognition += items.metacognition;
      totalHistory.totalMetaCognitionMiss += items.metacognitionMiss;
      totalHistory.totalParticipate += items.studyParticipate;
      totalHistory.totalParticipateTime += items.numStudyParticipate;
      totalHistory.totalAssignment += items.numAssignment ?? 0;
      totalHistory.totalIncorrectAssignment += items.numIncorrectAssignment ?? 0;

      learningHistoryItem.uuid = uuid;
      learningHistoryItem.learningSysId = learningSysId;
      learningHistoryItem.historyItem = items;
      learningHistoryDtos.push(learningHistoryItem);
    }

    const meanHisotryItem = AverageHistoryItem.create(totalHistory, classUuids.length);
    learningHistoryDtos.forEach((v) => (v.meanHistoryItem = meanHisotryItem));

    return learningHistoryDtos;
  }

  async getStudentStatistic(getLearningHistoryDto: GetLearningHistoryDto, userUuid: string): Promise<StatisticDto> {
    const { classUuids, learningSysId } = getLearningHistoryDto;
    const statisticItems: StatisticItem[] = [];
    let userConceptProgrress = 0;
    let classConceptProgrress = 0;

    const orgLearningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });
    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const learningSysIds = learningSyses.map((v) => v.id);
    const clsIds: string[] = [];
    for await (const learningSys of learningSyses) {
      const subsections = await this.learningService.sectionToSubsections(learningSys.id);
      const clsId = subsections.map((v) => v.cls_id!);
      clsIds.push(...clsId);
    }

    const studies = await this.studyQuery.getStudyByLearningSysIds(learningSysIds);
    const goal = await this.prisma.study_chapter_plan.findFirst({
      where: {
        uuid: userUuid,
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const concepts = await this.prisma.concept.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
    const commonConceptVids = await this.prisma.common_concept_video.findMany({
      where: {
        concept_id: {
          in: concepts.map((v) => v.id),
        },
      },
    });
    const vidIds = commonConceptVids.map((v) => v.id);
    const videoPlayTimes = await this.prisma.common_concept_video_play.groupBy({
      by: 'user_uuid',
      where: {
        common_concept_video_id: {
          in: vidIds,
        },
        ended_at: {
          not: null,
        },
      },
    });
    const playedUsers = videoPlayTimes.map((v) => v.user_uuid);
    const userPlayTime = playedUsers.filter((v) => v === userUuid);
    if (playedUsers.includes(userUuid)) userConceptProgrress += (userPlayTime.length / learningSyses.length) * 2.5;
    classConceptProgrress += (playedUsers.length / (learningSyses.length * classUuids.length)) * 2.5;

    const studyProblems = await this.prisma.study_problem.findMany({ where: { study_id: { in: studies.map((v) => v.id) } } });
    const studyPerforms = await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblems.map((v) => v.id),
        },
        user_uuid: {
          in: classUuids,
        },
        solving_end: {
          not: null,
        },
      },
    });
    const userPerforms = studyPerforms.filter((v) => v.user_uuid === userUuid);

    const isCorrects = studyPerforms.filter((v) => v.is_correct === 1);
    const userCorrects = userPerforms.filter((v) => v.is_correct === 1);

    const meanCorrectRate = Math.floor((isCorrects.length / studyPerforms.length) * 10);
    const userCorrectRate = Math.floor((userCorrects.length / userPerforms.length) * 10);
    statisticItems.push(StatisticItem.create('CORRECT_RATE', meanCorrectRate, goal?.correct_rate ?? 0, userCorrectRate));

    const metacognitions = studyPerforms.filter((v) => v.confidence === 1);
    const classMetacognitions = metacognitions.filter((v) => v.is_correct === 1);
    const userMetacognitions = metacognitions.filter((v) => v.user_uuid === userUuid);
    const userCorrectMeta = userMetacognitions.filter((v) => v.is_correct === 1);
    const meanMetacognitionRate = Math.floor((classMetacognitions.length / metacognitions.length) * 10);
    const userMetacognitionRate = Math.floor((userCorrectMeta.length / userMetacognitions.length) * 10);
    statisticItems.push(StatisticItem.create('METACOGNITION', meanMetacognitionRate, goal?.correct_rate ?? 0, userMetacognitionRate));

    const userStudied = userPerforms.filter((v) => v.solving_end);
    const classStudied = studyPerforms.filter((v) => v.solving_end);
    const userProgress = Math.floor((userStudied.length / userPerforms.length) * 7.5 + userConceptProgrress);
    const classProgress = Math.floor((classStudied.length / studyPerforms.length) * 7.5 + classConceptProgrress);
    statisticItems.push(StatisticItem.create('PROGRESS', classProgress, goal?.correct_rate ?? 0, userProgress));

    const achievements = await this.prisma.user_achievement.findMany({
      include: {
        learning_level: true,
      },
      where: {
        user_uuid: {
          in: classUuids,
        },
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    const userAchievement = achievements.find((v) => v.user_uuid === userUuid);
    const achievementLevels = classUuids.map((v) => {
      const lastestAchievement = achievements.find((e) => e.user_uuid === v);
      if (!lastestAchievement) return 0;
      return lastestAchievement.learning_level.level;
    });
    const userAchievementLevel = userAchievement?.learning_level.level ?? null;
    const meanAchievement = Math.floor(achievementLevels.reduce((previous, current) => previous + current, 0) / classUuids.length);

    statisticItems.push(StatisticItem.create('LEVEL', meanAchievement, goal?.achievement_level ?? 0, userAchievementLevel!));

    return StatisticDto.create(learningSysId, orgLearningSys!.name, statisticItems);
  }

  async getLast3Statistics(getLearningHistoryDto: GetLearningHistoryDto, userUuid: string): Promise<StatisticDto[]> {
    const statisticsDtos: StatisticDto[] = [];
    let recent3LearningSys: learning_sys[];

    const checkLearningSys = await this.learningSysQuery.getById(getLearningHistoryDto.learningSysId);
    if (!checkLearningSys) throw new NotFoundException('단원정보를 찾을 수 없습니다.');

    if (checkLearningSys?.type === UnitType.UNIT) {
      recent3LearningSys = await this.learningSysQuery.getRecent3UnitNodesByLearningSysId(checkLearningSys.id);
    } else {
      const node = await this.learningSysMapQueryRepository.getNodeByLearningSysId(checkLearningSys.id);
      const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(node.id);
      const learningSysIds = recent3Nodes.map((v) => v.learning_sys_id);
      recent3LearningSys = await this.learningSysQuery.getByIds(learningSysIds);
    }

    for await (const learningSys of recent3LearningSys) {
      getLearningHistoryDto.learningSysId = learningSys.id;
      const statisticDto = await this.getStudentStatistic(getLearningHistoryDto, userUuid);
      statisticsDtos.push(statisticDto);
    }
    return statisticsDtos;
  }

  async getClassStatistic(getLearningHistoryDto: GetLearningHistoryDto): Promise<StatisticDto> {
    const { classUuids, learningSysId } = getLearningHistoryDto;
    const statisticItems: StatisticItem[] = [];
    let classConceptProgrress = 0;

    const orgLearningSys = await this.prisma.learning_sys.findFirst({ where: { id: learningSysId } });
    const learningSyses = await this.learningService.getSectionBelowLearningSys(learningSysId);
    const learningSysIds = learningSyses.map((v) => v.id);
    const clsIds: string[] = [];
    for await (const learningSys of learningSyses) {
      const subsections = await this.learningService.sectionToSubsections(learningSys.id);
      const clsId = subsections.map((v) => v.cls_id!);
      clsIds.push(...clsId);
    }
    const studies = await this.studyQuery.getStudyByLearningSysIds(learningSysIds);
    const goals = await this.prisma.study_chapter_plan.findMany({
      where: {
        uuid: {
          in: classUuids,
        },
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const concepts = await this.prisma.concept.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
    const commonConceptVids = await this.prisma.common_concept_video.findMany({
      where: {
        concept_id: {
          in: concepts.map((v) => v.id),
        },
      },
    });
    const vidIds = commonConceptVids.map((v) => v.id);
    const videoPlayTimes = await this.prisma.common_concept_video_play.groupBy({
      by: 'user_uuid',
      where: {
        common_concept_video_id: {
          in: vidIds,
        },
        ended_at: {
          not: null,
        },
      },
    });
    const playedUsers = videoPlayTimes.map((v) => v.user_uuid);
    classConceptProgrress += (playedUsers.length / (learningSyses.length * classUuids.length)) * 2.5;

    const studyProblems = await this.prisma.study_problem.findMany({ where: { study_id: { in: studies.map((v) => v.id) } } });
    const studyPerforms = await this.prisma.study_perform.findMany({
      where: {
        study_problem_id: {
          in: studyProblems.map((v) => v.id),
        },
        user_uuid: {
          in: classUuids,
        },
      },
    });

    const isCorrects = studyPerforms.filter((v) => v.is_correct === 1);
    const meanCorrectRate = Math.floor((isCorrects.length / studyPerforms.length) * 10);
    const meanCorrectGoal = Math.floor(goals.map((v) => v.correct_rate).reduce((previous, current) => previous + current, 0) / classUuids.length);

    statisticItems.push(StatisticItem.create('CORRECT_RATE', meanCorrectRate, meanCorrectGoal));

    const metacognitions = studyPerforms.filter((v) => v.confidence === 1 && v.is_correct === 1);
    const meanMetacognitionRate = Math.floor((metacognitions.length / studyPerforms.length) * 10);
    const meanMetaGoal = Math.floor(goals.map((v) => v.metarecognition_rate).reduce((previous, current) => previous + current, 0) / classUuids.length);

    statisticItems.push(StatisticItem.create('METACOGNITION', meanMetacognitionRate, meanMetaGoal));

    const classStudied = studyPerforms.filter((v) => v.solving_end);
    const classProgress = Math.floor((classStudied.length / studyPerforms.length) * 7.5 + classConceptProgrress);
    const meanProgressGoal = Math.floor(goals.map((v) => v.progress_rate).reduce((previous, current) => previous + current, 0) / classUuids.length);

    statisticItems.push(StatisticItem.create('PROGRESS', classProgress, meanProgressGoal));

    const achievements = await this.prisma.user_achievement.findMany({
      include: {
        learning_level: true,
      },
      where: {
        user_uuid: {
          in: classUuids,
        },
        learning_sys_id: {
          in: learningSysIds,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const achievementLevels = achievements.map((v) => v.learning_level.level);
    const meanAchievement = Math.floor(achievementLevels.reduce((previous, current) => previous + current, 0) / classUuids.length);
    const meanAchievementGoal = Math.floor(goals.map((v) => v.achievement_level).reduce((previous, current) => previous + current, 0) / classUuids.length);

    statisticItems.push(StatisticItem.create('LEVEL', meanAchievement, meanAchievementGoal));

    return StatisticDto.create(learningSysId, orgLearningSys!.name, statisticItems);
  }

  async getLast3ClassStatistics(getLearningHistoryDto: GetLearningHistoryDto): Promise<StatisticDto[]> {
    const { learningSysId } = getLearningHistoryDto;
    const statisticsDtos: StatisticDto[] = [];
    let recent3LearningSys: learning_sys[];

    const checkLearningSys = await this.learningSysQuery.getById(learningSysId);

    if (!checkLearningSys) throw new NotFoundException('단원정보를 찾을 수 없습니다.');

    if (checkLearningSys?.type === UnitType.UNIT) {
      recent3LearningSys = await this.learningSysQuery.getRecent3UnitNodesByLearningSysId(checkLearningSys.id);
    } else {
      const node = await this.learningSysMapQueryRepository.getNodeByLearningSysId(checkLearningSys.id);
      const recent3Nodes = await this.learningSysMapQueryRepository.getRecent3NodesByNodeId(node.id);
      const learningSysIds = recent3Nodes.map((v) => v.learning_sys_id);
      recent3LearningSys = await this.learningSysQuery.getByIds(learningSysIds);
    }

    for await (const learningSys of recent3LearningSys) {
      getLearningHistoryDto.learningSysId = learningSys.id;
      const statisticDto = await this.getClassStatistic(getLearningHistoryDto);
      statisticsDtos.push(statisticDto);
    }
    return statisticsDtos;
  }

  async getMVP(getAccumulateDto: GetAccumulateDto) {
    const { classUuids } = getAccumulateDto;

    const dto = new MvpDto();
    const top = 5;
    const uuidIdx = [...Array(classUuids.length).keys()];
    const uuidMap: Map<number, string> = new Map();
    for (let i = 0; i < classUuids.length; i++) {
      const key = uuidIdx[i];
      const value = classUuids[i];
      uuidMap.set(key, value);
    }

    const studyPerforms = await this.studyQuery.getStudyPerformByUuids(classUuids);
    const question = await this.prisma.question.findMany({
      where: {
        question_user_uuid: {
          in: classUuids,
        },
      },
    });
    const answer = await this.prisma.shared_solution_video.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });

    const conceptVideoLike = await this.prisma.concept_video_like.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const conceptReferenceLike = await this.prisma.concept_reference_like.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const commonConceptLike = await this.prisma.common_concept_video_like.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const announcementLike = await this.prisma.announcement_content_like.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });

    const conceptVideoComment = await this.prisma.concept_video_comment.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const conceptReferenceComment = await this.prisma.concept_video_comment.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const commonConceptComment = await this.prisma.common_concept_video_comment.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });
    const announcementComment = await this.prisma.announcement_comment.findMany({
      where: {
        user_uuid: {
          in: classUuids,
        },
      },
    });

    const correcRateMap: Map<number, number> = new Map();
    const solveCountMap: Map<number, number> = new Map();
    const qnaMap: Map<number, number> = new Map();
    const snsMap: Map<number, number> = new Map();
    for (let i = 0; i < classUuids.length; i++) {
      let userLikes = 0;
      let userComments = 0;
      const userPerforms = studyPerforms.filter((v) => v.user_uuid === classUuids[i] && v.solving_end !== null);
      const correct = userPerforms.filter((v) => v.is_correct === 1);
      const correcRate = Math.floor((correct.length / userPerforms.length) * 100);

      const userQuestion = question.filter((v) => v.question_user_uuid === classUuids[i]);
      const userAnswer = answer.filter((v) => v.user_uuid === classUuids[i]);

      userLikes += conceptVideoLike.filter((v) => v.user_uuid === classUuids[i]).length;
      userLikes += conceptReferenceLike.filter((v) => v.user_uuid === classUuids[i]).length;
      userLikes += commonConceptLike.filter((v) => v.user_uuid === classUuids[i]).length;
      userLikes += announcementLike.filter((v) => v.user_uuid === classUuids[i]).length;
      userComments += conceptVideoComment.filter((v) => v.user_uuid === classUuids[i]).length;
      userComments += conceptReferenceComment.filter((v) => v.user_uuid === classUuids[i]).length;
      userComments += commonConceptComment.filter((v) => v.user_uuid === classUuids[i]).length;
      userComments += announcementComment.filter((v) => v.user_uuid === classUuids[i]).length;

      correcRateMap.set(correcRate, i);
      solveCountMap.set(userPerforms.length, i);
      qnaMap.set(userQuestion.length + userAnswer.length, i);
      snsMap.set(userLikes + userComments, i);
    }

    const sortedCorrectRate = Array.from(correcRateMap.keys())
      .sort((a, b) => b - a)
      .slice(0, top);
    const sortedSolveCount = Array.from(solveCountMap.keys())
      .sort((a, b) => b - a)
      .slice(0, top);
    const sortedQna = Array.from(qnaMap.keys())
      .sort((a, b) => b - a)
      .slice(0, top);
    const sortedSns = Array.from(snsMap.keys())
      .sort((a, b) => b - a)
      .slice(0, top);

    const topCorrectRate = sortedCorrectRate.map((v) => {
      const topUserIdx = correcRateMap.get(v)!;
      return uuidMap.get(topUserIdx)!;
    });
    const topSolveCount = sortedSolveCount.map((v) => {
      const topUserIdx = solveCountMap.get(v)!;
      return uuidMap.get(topUserIdx)!;
    });
    const topQna = sortedQna.map((v) => {
      const topUserIdx = qnaMap.get(v)!;
      return uuidMap.get(topUserIdx)!;
    });
    const topSns = sortedSns.map((v) => {
      const topUserIdx = snsMap.get(v)!;
      return uuidMap.get(topUserIdx)!;
    });

    dto.CorrectRate = topCorrectRate;
    dto.NumSolve = topSolveCount;
    dto.QnA = topQna;
    dto.SNS = topSns;

    return dto;
  }

  async getAchievementStandard(getAchievementStandardDto: GetAchievementStandardDto, uuid: string): Promise<studentAchievementStandardResponseDto> {
    const studyObject = await this.prisma.study.findMany({
      where: {
        learning_sys_id: getAchievementStandardDto.learning_sys_id,
      },
    });
    const studyIds = studyObject.map((data) => data.id);
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studyIds,
        },
      },
    });
    const studyProblemIds = studyProblems.map((data) => data.id);
    const studyedDatas = await this.prisma.study_perform.findMany({
      where: {
        user_uuid: uuid,
        study_problem_id: {
          in: studyProblemIds,
        },
      },
    });

    const myStudyedProblemIds = studyedDatas.map((data) => data.study_problem_id);

    const problemDatas = await this.prisma.problem.findMany({
      where: {
        id: {
          in: myStudyedProblemIds,
        },
      },
    });
    const DifficultyScores = problemDatas.map((data) => {
      let rstValue = 0;
      switch (data.difficulty) {
        case EProblemDifficulty.HIGHEST:
          rstValue = 4;
          break;
        case EProblemDifficulty.HIGH:
          rstValue = 3;
          break;
        case EProblemDifficulty.MIDDLE:
          rstValue = 2;
          break;
        case EProblemDifficulty.LOW:
          rstValue = 1;
          break;
      }
      return rstValue;
    });

    const sumDifficulty = DifficultyScores.reduce((total, current) => total + current, 0);
    const currectCount = studyedDatas.map((data) => data.is_correct).filter((data) => data === 1);
    const avgCorrect = currectCount.length / studyedDatas.length;
    const avgDifficulty = sumDifficulty / studyedDatas.length;

    const achievementStandardScore = avgCorrect * avgDifficulty;
    let achievementStandardLevel: AchievementLevel;
    if (achievementStandardScore >= 210) {
      achievementStandardLevel = 'A';
    } else if (achievementStandardScore >= 180) {
      achievementStandardLevel = 'B';
    } else if (achievementStandardScore >= 100) {
      achievementStandardLevel = 'C';
    } else if (achievementStandardScore >= 70) {
      achievementStandardLevel = 'D';
    } else {
      achievementStandardLevel = 'E';
    }

    const achievementId = await this.prisma.learning_sys.findFirst({
      where: {
        parent_id: getAchievementStandardDto.learning_sys_id,
      },
    });
    if (!achievementId) {
      throw new BadRequestException('존재하지 않는 소단원 id입니다.');
    }
    if (!achievementId.achievement_id) {
      throw new BadRequestException('존재하지 않는 소단원 id입니다.');
    }
    const achievementStandard = await this.prisma.achievement_standard.findFirst({
      where: {
        achievement_id: achievementId.achievement_id,
        achievement_level: achievementStandardLevel,
      },
    });
    if (!achievementStandard) throw new BadRequestException('존재하지 않는 성취 기준 데이터입니다.');

    const res = new studentAchievementStandardResponseDto();
    res.achievementStandard = achievementStandard;
    res.achievementStandardScore = achievementStandardScore;
    res.problemCount = studyedDatas.length;
    return res;
  }

  async getAchievementStandardUsers(getAchievementStandardUsersDto: GetAchievementStandardUsersDto): Promise<Promise<studentAchievementStandardResponseDto>[]> {
    const { classUuids } = getAchievementStandardUsersDto;
    const studyObject = await this.prisma.study.findMany({
      where: {
        learning_sys_id: getAchievementStandardUsersDto.learning_sys_id,
      },
    });
    const studyIds = studyObject.map((data) => data.id);
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studyIds,
        },
      },
    });
    const studyProblemIds = studyProblems.map((data) => data.id);

    return classUuids.map(async (uuid) => {
      const studyedDatas = await this.prisma.study_perform.findMany({
        where: {
          user_uuid: uuid,
          study_problem_id: {
            in: studyProblemIds,
          },
        },
      });

      const myStudyedProblemIds = studyedDatas.map((data) => data.study_problem_id);

      const problemDatas = await this.prisma.problem.findMany({
        where: {
          id: {
            in: myStudyedProblemIds,
          },
        },
      });
      const DifficultyScores = problemDatas.map((data) => {
        let rstValue = 0;
        switch (data.difficulty) {
          case EProblemDifficulty.HIGHEST:
            rstValue = 4;
            break;
          case EProblemDifficulty.HIGH:
            rstValue = 3;
            break;
          case EProblemDifficulty.MIDDLE:
            rstValue = 2;
            break;
          case EProblemDifficulty.LOW:
            rstValue = 1;
            break;
        }
        return rstValue;
      });

      const sumDifficulty = DifficultyScores.reduce((total, current) => total + current, 0);
      const currectCount = studyedDatas.map((data) => data.is_correct).filter((data) => data === 1);
      const avgCorrect = currectCount.length / studyedDatas.length;
      const avgDifficulty = sumDifficulty / studyedDatas.length;

      const achievementStandardScore = avgCorrect * avgDifficulty;
      let achievementStandardLevel: AchievementLevel;
      if (achievementStandardScore >= 210) {
        achievementStandardLevel = 'A';
      } else if (achievementStandardScore >= 180) {
        achievementStandardLevel = 'B';
      } else if (achievementStandardScore >= 100) {
        achievementStandardLevel = 'C';
      } else if (achievementStandardScore >= 70) {
        achievementStandardLevel = 'D';
      } else {
        achievementStandardLevel = 'E';
      }

      const achievementId = await this.prisma.learning_sys.findFirst({
        where: {
          parent_id: getAchievementStandardUsersDto.learning_sys_id,
        },
      });
      if (!achievementId) {
        throw new BadRequestException('존재하지 않는 소단원 id입니다.');
      }
      if (!achievementId.achievement_id) {
        throw new BadRequestException('존재하지 않는 소단원 id입니다.');
      }
      const achievementStandard = await this.prisma.achievement_standard.findFirst({
        where: {
          achievement_id: achievementId.achievement_id,
          achievement_level: achievementStandardLevel,
        },
      });
      if (!achievementStandard) throw new BadRequestException('존재하지 않는 성취 기준 데이터입니다.');

      const res = new studentAchievementStandardResponseDto();
      res.achievementStandard = achievementStandard;
      res.achievementStandardScore = achievementStandardScore;
      res.problemCount = studyedDatas.length;
      return res;
    });
  }

  async getStudentPerformsByLearningSysId(dto: GetTeacherDashboardProblemsDto, teacherUuid: string) {
    const { learning_sys_id, type, uuid } = dto;
    const currentUser = await this.userService.isUuidValid(teacherUuid);
    const studentUser = await this.userService.isUuidValid(uuid);

    if (type === 'ASSIGNMENT') {
      //get assignment
      const assignmentGaves = await this.prisma.assignment_gave.findMany({
        where: {
          learning_sys_id,
        },
      });
      const assignmentGavesId = assignmentGaves.map((v) => v.id);
      const assignmentGivenUsers = await this.prisma.assignment_gave_user.findMany({
        where: {
          assignment_gave_id: {
            in: assignmentGavesId,
          },
          user_uuid: uuid,
        },
      });
      if (!assignmentGivenUsers) throw new NotFoundException('해당 학생에게 해당 소단원에 부여된 과제가 없습니다.');
      const assignmentBridges = await this.prisma.assignment_problem.findMany({
        where: {
          assignment_gave_user_id: {
            in: assignmentGivenUsers.map((v) => v.id),
          },
          status: 'SUBMIT',
        },
        include: {
          assignment_perform: true,
        },
      });
      const tmp = [];
      for await (const bridge of assignmentBridges) {
        if (bridge.assignment_perform) {
          const problem = await this.prisma.problem.findFirst({
            where: {
              id: bridge.problem_id,
            },
          });
          if (problem) {
            const learning_sys = await this.prisma.learning_sys.findFirst({
              where: {
                cls_id: problem.cls_id,
              },
            });
            tmp.push({ ...bridge, problem, learning_sys, perform: bridge.assignment_perform, assignment_perform: undefined });
          }
        }
      }
      return tmp;
    } else if (type === 'BASIC' || type === 'CONFIRM' || type === 'FEEDBACK') {
      //학습 문제
      const studies = await this.studyQuery.getStudiesByLearningSysIdsAndType([learning_sys_id], type as StudyType);
      if (!studies) throw new NotFoundException('Study를 찾을 수 없습니다.');

      const studyId = studies.map((v) => v.id)[0];
      const studyBridges = await this.studyQuery.getStudyProblemsByStudyId(studyId);
      const problemClsIds = studyBridges.map((v) => v.problem.cls_id);
      const problemsLearningSys = await this.prisma.learning_sys.findMany({
        where: {
          cls_id: {
            in: problemClsIds,
          },
        },
      });

      const studyBridgeIds = studyBridges.map((v) => v.id);
      if (!studyBridgeIds) throw new NotFoundException('Study와 연결된 문제를 찾을 수 없습니다.');

      const studyPerforms = await this.studyQuery.getStudyPerformsByStudyProblemIdsAndUuid(studyBridgeIds, studentUser.user_uuid);
      const resp = [];
      for (const perform of studyPerforms) {
        const currentBridge: any = studyBridges.find((v) => v.id === perform.study_problem_id);
        if (currentBridge) {
          currentBridge.perform = perform;
          currentBridge.learning_sys = problemsLearningSys.find((v) => v.cls_id === currentBridge.problem.cls_id);
          resp.push(currentBridge);
        }
      }
      return resp;
    } else {
      throw new NotAcceptableException();
    }
  }

  async getStudentConceptVideosByLearningSysId(dto: GetTeacherDashboardConceptVideosDto, teacherUuid: string) {
    const { learning_sys_id, uuid } = dto;
    const currentUser = await this.userService.isUuidValid(teacherUuid);
    const studentUser = await this.userService.isUuidValid(uuid);

    const concept = await this.prisma.concept_perform.findMany({
      where: {
        learning_sys_id,
        user_uuid: studentUser.user_uuid,
      },
    });
    const conceptIds = concept.map((v) => v.concept_id);
    return await this.prisma.concept_video.findMany({
      where: {
        concept_id: {
          in: conceptIds,
        },
        user_uuid: studentUser.user_uuid,
      },
      include: {
        concept: true,
        concept_video_data: true,
        concept_video_like: true,
        concept_video_share: true,
      },
    });
  }
}
type AchievementLevel = 'A' | 'B' | 'C' | 'D' | 'E';
