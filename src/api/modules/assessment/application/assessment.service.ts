import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UseFilters,
} from '@nestjs/common';
import {
  AssessmentDoneDto,
  AssessmentResultTableRowDto,
  AssessmentResultTableRowProblem,
  CreateAssessmentPerformDto,
  CreateComprehensiveAssessmentDto,
  CreateDiagnosticAssessmentDto,
  CreateUnitAssessmentDto,
  GenerateResultTableDto,
  GetAssessmentResultDto,
  GetDiagnosticAssessmentDto,
  GetUnitAssessmentDto,
  problemWithLearningSys,
  UpdateAnswerOfAssessmentPerformDto,
} from './dto';
import { PrismaService } from 'src/prisma';
import { UpdateAnswerOfAssessmentPerformResponseDto } from './dto/updateAnswerOfAssessmentPerformResponse.dto';
import { CreateAssessmentPerformResponseDto } from './dto/createAssessmentPerformResponse.dto';
import { AssessmentType, ProblemType, assessment_perform, assessment_problem, learning_sys, problem } from '@prisma/client';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { Role } from 'src/libs/decorators/role.enum';
import { EDifficulty } from '../../problem';
import { EAssessmentExist, EAssessmentType } from '../infrastructure/assessment.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AssessmentStatus } from '../infrastructure/assessmentStatus.entity';
import { AssessmentProblem, EAnswerType, EProblemType } from '../infrastructure/assessmentProblem.entity';
import { StudentAssessmentPerformStatus } from '../infrastructure/studentAssessmentPerformStatus.entity';
import { convertUTC9Date } from 'src/libs/utils';

const noLearningMapWarning = '해당 학급 해당 학기에 해당하는 학습맵이 DB에 없습니다.';
const noClassWarning = '학급 정보가 없습니다.';
@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * <기획서에 적혀있는 평가의 종류>
   * Study :
   * 소단원 기본문제
   * 소단원 확인문제
   * 소단원 피드백문제
   * 소단원 오답노트
   * 중단원 피드백문제
   * 추가문제
   * -
   * Assessment:
   * 학력진단평가 - 학기 초 최초 평가
   * 대단원 형성평가 - 대단원마다 평가
   * 학기총괄평가 - 모든 대단원을 대상으로 한 총합 평가
   */

  /**
   * 마지막에 문제를 모두 풀고 제출 버튼을 눌렀을 때 처리하는 서비스 코드
   * 이미 해당 문제를 띄운 시점에서 createAssessmentPerform를 통해 assessment_perform 테이블에 기록이 되어 있으므로
   * 마지막에 제출을 한다면 해당 문제의 답안과 solving_end 컬럼만 UPDATE 시켜주면 된다.
   * @param dto AssessmentPerformSubmission[] 여러개의 문제 답안을 담은 배열이다.
   * @param uuid 현재 uuid
   * @returns 업데이트 된 assessment_perform의 id 배열과 성공 여부를 반환한다.
   */
  @UseFilters(NotFoundException, BadRequestException)
  async updateAnswerOfAssessmentPerform(dto: UpdateAnswerOfAssessmentPerformDto, uuid: string): Promise<UpdateAnswerOfAssessmentPerformResponseDto> {
    //loop over dto.submissions
    const currentUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });

    if (!currentUser) throw new NotFoundException('해당 유저를 찾을 수 없습니다.');

    const updatedIds: Array<number> = [];
    const currentAssessmentId = dto.submissions[0].assessment_id;
    if (!currentAssessmentId) throw new BadRequestException('적어도 하나의 문제는 제출해주세요.');

    const currentAssessment = await this.prisma.assessment.findFirst({
      where: {
        id: currentAssessmentId,
      },
    });
    if (!currentAssessment) throw new NotFoundException('해당 평가를 찾을 수 없습니다.');

    const assessmentProblems = await this.prisma.assessment_problem.count({
      where: {
        assessment_id: currentAssessmentId,
      },
    });
    if (assessmentProblems !== dto.submissions.length) throw new BadRequestException('모든 문제를 제출해주세요.');

    for await (const submission of dto.submissions) {
      //여기서 for await을 써주지 않으면 비동기 처리가 제대로 되지 않으므로 주의.
      const assessmentProblem = await this.prisma.assessment_problem.findFirst({
        where: {
          problem_id: submission.problem_id,
          assessment_id: submission.assessment_id,
        },
      });
      if (assessmentProblem) {
        const updateTarget = await this.prisma.assessment_perform.findFirst({
          where: {
            assessment_problem_id: assessmentProblem.id,
            user_uuid: uuid,
          },
        });
        if (updateTarget) {
          const problemData = await this.prisma.problem.findFirst({
            where: {
              id: assessmentProblem.problem_id,
            },
          });
          const isCorrect = problemData?.answer_data === submission.answer ? 1 : 0;
          const updated = await this.prisma.assessment_perform.update({
            where: {
              id: updateTarget?.id,
            },
            data: {
              submission_answer: submission.answer,
              solving_end: new Date(),
              is_correct: isCorrect,
            },
          });
          //문제 풀이 완료한 시각과 submission_answer를 업데이트 해준다.
          updatedIds.push(updated.id);
        } else {
          const problemData = await this.prisma.problem.findFirst({
            where: {
              id: assessmentProblem.problem_id,
            },
          });
          const isCorrect = problemData?.answer_data === submission.answer ? 1 : 0;
          await this.prisma.assessment_perform.create({
            data: {
              user_uuid: uuid,
              submission_answer: submission.answer,
              solving_end: new Date(),
              solving_start: new Date(),
              assessment_problem_id: assessmentProblem.id,
              is_correct: isCorrect,
            },
          });
        }
      }
    }

    const performs = await this.prisma.assessment_perform.findMany({
      where: {
        id: {
          in: updatedIds,
        },
      },
    });

    const myScore = performs.filter((v) => v.is_correct === 1).length * 5;
    const learningLevel = await this.prisma.learning_level.findFirst({
      where: {
        achievement_score_from: {
          lte: myScore,
        },
        achievement_score_to: {
          gte: myScore,
        },
      },
    });

    const currentType = currentAssessment.type === 'UNIT' ? 'UNIT_END' : currentAssessment.type;
    await this.prisma.user_achievement.create({
      data: {
        user_uuid: uuid,
        learning_level_id: learningLevel?.id || 1,
        learning_level_group_id: 1,
        is_force_apply: false,
        learning_map_id: currentUser.learning_map_id || 1,
        achievement_type: currentType,
        achievement_score: myScore,
      },
    });

    return {
      updatedIds,
    };
  }

  @UseFilters(NotFoundException, BadRequestException)
  async createAssessmentPerform(dto: CreateAssessmentPerformDto, uuid: string): Promise<CreateAssessmentPerformResponseDto> {
    /**
     * 프론트에서 해당 문제를 띄우면 문제 푼 시각을 기록하도록 되어 있는데
     * 사용자가 문제를 왔다갔다 하면서 해당 문제를 여러번 듸울 수 있으므로
     * 최초에 문제를 띄운 시점에서만 assessment_perform 테이블에 기록하고
     * 그 다움에 문제를 띄우면 이미 기록이 있는지 확인하여 기존의 기록을 반환한다.
     */
    const assessmentProblem = await this.prisma.assessment_problem.findFirst({
      where: {
        problem_id: dto.problem_id,
        assessment_id: dto.assessment_id,
      },
    });
    if (!assessmentProblem) throw new NotFoundException('해당 문제가 평가 내에 없습니다.');
    const checkAlreadyCreated = await this.prisma.assessment_perform.findFirst({
      where: {
        assessment_problem_id: assessmentProblem.id,
        user_uuid: uuid,
      },
    });
    if (!checkAlreadyCreated) {
      //만약 문제를 최초로 띄운 시점이라면 create
      const result = await this.prisma.assessment_perform.create({
        data: {
          assessment_problem_id: assessmentProblem.id,
          user_uuid: uuid,
          solving_start: new Date(),
          submission_answer: '',
        },
      });
      return {
        assessment_perform_id: result.id,
        already_created: false,
      };
    } else {
      return {
        assessment_perform_id: checkAlreadyCreated.id,
        already_created: true,
      };
    }
  }

  async getAssessmentResult(dto: GetAssessmentResultDto, uuid: string): Promise<AssessmentDoneDto> {
    const resultDto = new AssessmentDoneDto();
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: dto.assessment_id,
      },
    });
    if (!assessment) throw new NotFoundException();

    const problemsInAssessment = await this.prisma.assessment_problem.findMany({
      where: {
        assessment_id: dto.assessment_id,
        assessment_perform: {
          some: {
            user_uuid: uuid,
          },
        },
      },
      include: {
        assessment_perform: true,
      },
    });

    const performsInAssessment = await this.prisma.assessment_perform.findMany({
      where: {
        assessment_problem_id: {
          in: problemsInAssessment.map((v) => v.id),
        },
      },
    });

    const problems = await this.prisma.problem.findMany({
      where: {
        id: {
          in: problemsInAssessment.map((v) => v.problem_id),
        },
      },
    });

    const problemClsIds = problems.map((v) => v.cls_id);
    const learningSys = await this.prisma.learning_sys.findFirst({
      where: {
        cls_id: {
          in: problemClsIds,
        },
      },
    });

    const problemsWithLearningSys: problemWithLearningSys[] = [];

    for (const problem of problems) {
      const tmpProblem = problem as problemWithLearningSys;
      if (learningSys) {
        tmpProblem.learning_sys = learningSys;
      }
      problemsWithLearningSys.push(tmpProblem);
    }

    const numberOfParticipants = new Set(performsInAssessment.map((v) => v.user_uuid)).values.length;

    //일단 내 점수를 계산한다.
    const myPerforms = performsInAssessment.filter((v) => v.user_uuid === uuid);
    const myScore = myPerforms.filter((v) => v.is_correct === 1).length * 5;
    const myAchievementLevel = Math.ceil(myScore / 10);

    const averageScore = Math.ceil(
      (performsInAssessment.filter((v) => v.is_correct === 1).length / (problemsInAssessment.length * numberOfParticipants)) * 100,
    );

    resultDto.score = myScore;
    resultDto.averageScore = averageScore || 0;
    resultDto.achievementLevel = myAchievementLevel;
    resultDto.problems = problemsWithLearningSys;
    resultDto.performs = problemsInAssessment;
    return resultDto;
  }

  @UseFilters(NotFoundException, BadRequestException)
  async generateResultTable(dto: GenerateResultTableDto, uuid: string): Promise<Array<AssessmentResultTableRowDto>> {
    if (uuid) {
      //Return Type 을 가지는 배열 선언
      const assessmentResultTableRows: Array<AssessmentResultTableRowDto> = [];

      //QUERY: 맨 처음에 assessment_id 를 받아서 관련된 assessment_problem들을 가져온다.
      const assessmentProblems = await this.prisma.assessment_problem.findMany({
        where: {
          assessment_id: dto.assessment_id,
        },
        orderBy: {
          id: 'asc', //TODO: 학생들이 푼 문제 순서대로 정렬해야 하는데 기준이 없음.
        },
      });
      if (assessmentProblems.length === 0) throw new NotFoundException('평가와 연관된 문제가 없습니다.');

      //QUERY: assessment_problem들을 가져왔으므로 assessment_perform 테이블에서 해당 문제들을 푼 사용자들의 정보를 가져온다.
      const assessmentPerforms = await this.prisma.assessment_perform.findMany({
        where: {
          assessment_problem_id: {
            in: assessmentProblems.map((v) => v.id),
          },
        },
        orderBy: {
          assessment_problem_id: 'asc', //TODO: 학생들이 푼 문제 순서대로 정렬해야 하는데 기준이 없음.
        },
      });

      /*
      QUERY: 문제 난이도 정보도 가져와야 하므로 assessment_problem 테이블의 problem_id를 이용하여 problem 테이블에서 가져온다.
      FK를 이용하지 않는 이유는 prisma에서 join을 사용할 때 성능이 떨어지기 때문이다. 
      (만약 prisma include를 사용한다면 동일 문제 id가 나올때마다 db를 조회하여 같은 정보를 여러번 가져오므로 성능이 떨어진다.)
      그러므로 problems를 따로 가져와서 필요할 때 마다 직접 메모리에 올라와 있는 배열을 조회하여 가져오는 것이 성능에 좋다.
      */
      const problems = await this.prisma.problem.findMany({
        where: {
          id: {
            in: assessmentProblems.map((v) => v.problem_id),
          },
        },
      });

      // 이제 assessmentPerforms를 loop 돌면서 user_uuid를 기준으로 한 오브젝트에 모아주는 방식을 통해
      // AssessmentResultTableRowDto 타입으로 다시 만들어준다.
      for await (const assessmentPerform of assessmentPerforms) {
        //assesmentResultTableRows에 assessmentPerform.user_uuid를 가진 오브젝트가 있는지 확인
        const index = assessmentResultTableRows.findIndex((v) => v.user_uuid === assessmentPerform.user_uuid);
        let currentRow: AssessmentResultTableRowDto;
        let isNew = false;
        if (index >= 0) {
          //이미 가지고 있다면
          currentRow = assessmentResultTableRows[index];
        } else {
          //없다면 새로 생성
          isNew = true;
          currentRow = new AssessmentResultTableRowDto();
          currentRow.user_uuid = assessmentPerform.user_uuid;
          currentRow.correction_rate = 0;
          currentRow.assessment_problems = [];
        }

        const currentPerformProblemId = assessmentProblems.find((v) => v.id === assessmentPerform.assessment_problem_id)?.problem_id;
        if (!currentPerformProblemId) throw new NotFoundException(`(${assessmentPerform.id}) 평가 수행과 연관된 문제를 찾을 수 없습니다.`);

        const currentProblem = problems.find((v) => v.id === currentPerformProblemId);
        const currentProblemDifficulty = currentProblem?.difficulty;
        if (!currentProblemDifficulty) throw new NotFoundException(`(${currentPerformProblemId}) 문제의 난이도를 찾을 수 없습니다.`);

        const learningSys = await this.prisma.learning_sys.findFirst({
          where: {
            cls_id: currentProblem.cls_id,
          },
        });
        if (!learningSys) throw new NotFoundException(`(${currentProblem.cls_id}) 학습 체계를 찾을 수 없습니다.`);

        const currentRowProblem = this.generateTableRowProblem(assessmentPerform, currentProblem, currentProblemDifficulty, learningSys);

        currentRow.assessment_problems.push(currentRowProblem);
        if (isNew) assessmentResultTableRows.push(currentRow);
      }

      //정답률을 계산
      this.calculateCorrectionRates(assessmentResultTableRows);

      return assessmentResultTableRows;
    } else {
      throw new BadRequestException();
    }
  }

  async createAssessment(dto: CreateDiagnosticAssessmentDto, classInfo: ClassInfo) {
    const { durationInSecond } = dto;
    // 학급 정보를 불러옵니다.
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    // 해당하는 학습맵을 불러옵니다.

    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        semester: {
          grade: schoolClass.grade!,
          semester: classInfo.semester.toString(),
        },
        school_class: {
          some: {
            id: schoolClass.id,
          },
        },
      },
    });

    if (!learningMap) throw new NotFoundException(noLearningMapWarning);

    let clsIds: Array<string | undefined> = [];
    let assessmentType: EAssessmentType = EAssessmentType.DIAGNOSTIC;

    const commonAssessmentGenerateFilter: {
      target_grade: number;
      target_semester: number;
      type: ProblemType;
    } = {
      target_grade: parseInt(schoolClass.grade!),
      target_semester: classInfo.semester,
      type: ProblemType.DIAGNOSTIC,
    };

    if (dto.type === 'COMPREHENSIVE') {
      commonAssessmentGenerateFilter.type = ProblemType.COMPREHENSIVE;
      assessmentType = EAssessmentType.COMPREHENSIVE;
    }

    if (dto.type === 'UNIT') {
      const currentLearningSys = await this.prisma.learning_sys.findFirst({
        where: {
          id: dto.learning_sys_id,
        },
      });
      if (!currentLearningSys) throw new NotFoundException('해당 학습 체계를 찾을 수 없습니다.');

      const learnigSystems = await this.prisma.learning_sys.findMany({
        where: {
          full_name: {
            startsWith: currentLearningSys.full_name,
          },
        },
      });
      clsIds = learnigSystems
        .map((v) => {
          if (v.cls_id) return v.cls_id;
        })
        .filter((v) => v !== undefined);
      if (clsIds.length === 0) throw new NotFoundException('해당 대단원 밑에 출제할 확장소단원이 없습니다.');

      assessmentType = EAssessmentType.UNIT;
      commonAssessmentGenerateFilter.type = ProblemType.UNIT_END;
    }

    // 문제들을 찾습니다.
    const problems = await this.prisma.problem.findMany({
      where: commonAssessmentGenerateFilter,
    });
    let processedProblems = [];

    if (clsIds.length > 0) {
      processedProblems = problems.filter((v) => clsIds.includes(v.cls_id)).splice(0, 20);
    } else {
      //get 20 of problems
      processedProblems = problems.splice(0, 20);
    }

    const creatingTime = new Date();

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.assessment.create({
        data: {
          type: dto.type,
          created_at: creatingTime,
          begun_at: dto.beginAt,
          assessment_problem: {
            createMany: {
              data: processedProblems.map((v) => ({
                problem_id: v.id,
              })),
            },
          },
          assessment_class: {
            create: {
              school_class_id: schoolClass.id,
            },
          },
          learning_map_id: learningMap.id,
          learning_sys_id: dto.learning_sys_id || 0,
          duration_in_second: durationInSecond,
        },
      });
      // Calculate TTL
      const now = convertUTC9Date();
      const begunAt = convertUTC9Date(dto.beginAt);
      const timeDifference = Math.max((now.getTime() - begunAt.getTime()) / 1000, 0);
      const ttl = durationInSecond + timeDifference;

      await this.cacheManager.set(
        this.formRedisKeyForAssessment(schoolClass.id, assessmentType),
        this.formRedisValueForAssessment(result.id, creatingTime, result.duration_in_second),
        ttl * 1000, // Convert to milliseconds
      );

      return result;
    });
  }

  async startDiagnosticAssessment(id: number, classInfo: ClassInfo) {
    // 학급 정보를 불러옵니다.
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new HttpException(noClassWarning, 404);

    // 먼저 해당 진단평가가 존재하는지 찾아봅니다.
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: id,
        type: AssessmentType.DIAGNOSTIC,
        learning_map_id: schoolClass.learning_map_id,
      },
    });

    if (!assessment) throw new HttpException('해당 학급에서 출제된 ${id}에 해당하는 진단평가가 존재하지 않습니다.', 404);

    if (assessment.begun_at !== null) throw new HttpException('이미 시작된 진단평가입니다.', HttpStatus.CONFLICT);

    return await this.prisma.assessment.update({
      where: {
        id: id,
      },
      data: {
        begun_at: new Date(),
      },
    });
  }

  async createUnitAssessment(dto: CreateUnitAssessmentDto, classInfo: ClassInfo) {
    const { curriculumId, durationInSecond } = dto;

    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    const problems = await this.prisma.problem.findMany({
      where: {
        type: ProblemType.UNIT_END,
        cls_id: {
          startsWith: curriculumId,
        },
      },
      take: 20,
    });

    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        school_class: {
          some: {
            id: schoolClass.id,
          },
        },
      },
    });

    if (!learningMap) throw new NotFoundException(noLearningMapWarning);

    const creatingTime = new Date();

    return await this.prisma.$transaction(async (tx) => {
      const startTime = new Date();
      const result = await tx.assessment.create({
        data: {
          type: AssessmentType.UNIT,
          created_at: creatingTime,
          begun_at: startTime,
          assessment_problem: {
            createMany: {
              data: problems.map((v) => ({
                problem_id: v.id,
              })),
            },
          },
          assessment_class: {
            create: {
              school_class_id: schoolClass.id,
            },
          },
          learning_map_id: learningMap.id,
          duration_in_second: durationInSecond,
        },
      });
      // Calculate TTL
      const now = new Date();
      const begunAt = new Date(startTime);
      const timeDifference = Math.max((now.getTime() - begunAt.getTime()) / 1000, 0);
      const ttl = durationInSecond + timeDifference;

      await this.cacheManager.set(
        this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.UNIT),
        this.formRedisValueForAssessment(result.id, begunAt, result.duration_in_second),
        ttl * 1000, // Convert to milliseconds
      );

      return result;
    });
  }

  async createComprehensiveAssessment(dto: CreateComprehensiveAssessmentDto, classInfo: ClassInfo) {
    const { durationInSecond } = dto;
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });
    if (!schoolClass) throw new NotFoundException(noClassWarning);
    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        semester: {
          grade: schoolClass.grade!,
          semester: classInfo.semester.toString(),
        },
        school_class: {
          some: {
            id: schoolClass.id,
          },
        },
      },
    });

    if (!learningMap) throw new NotFoundException(noLearningMapWarning);

    const correspondingCurriculumIds = await this.prisma.learning_sys.findMany({
      where: {
        learning_map_node: {
          some: {
            learning_map_id: learningMap.id,
          },
        },
      },
      select: {
        cls_id: true,
      },
    });

    if (!correspondingCurriculumIds) throw new NotFoundException('해당 학습맵에 해당하는 학습 체계를 찾을 수 없습니다.');

    // 해당 표준학습체계에 해당하는 문제들 중 총괄평가용 문제를 20개 뽑아옵니다.
    const problems = await this.prisma.problem.findMany({
      where: {
        target_grade: parseInt(schoolClass.grade!),
        target_semester: classInfo.semester,
        type: ProblemType.COMPREHENSIVE,
        cls_id: {
          in: correspondingCurriculumIds.map((v) => v.cls_id ?? ''),
        },
      },
      take: 20,
    });

    const creatingTime = new Date();

    return await this.prisma.$transaction(async (tx) => {
      const result = await tx.assessment.create({
        data: {
          type: AssessmentType.COMPREHENSIVE,
          created_at: creatingTime,
          begun_at: creatingTime,
          assessment_problem: {
            createMany: {
              data: problems.map((v) => ({
                problem_id: v.id,
              })),
            },
          },
          assessment_class: {
            create: {
              school_class_id: schoolClass.id,
            },
          },
          learning_map_id: learningMap.id,
          duration_in_second: durationInSecond,
        },
      });

      // Calculate TTL
      const now = new Date();
      const timeDifference = Math.max((now.getTime() - creatingTime.getTime()) / 1000, 0);
      const ttl = durationInSecond + timeDifference;

      await this.cacheManager.set(
        this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.COMPREHENSIVE),
        this.formRedisValueForAssessment(result.id, creatingTime, result.duration_in_second),
        ttl * 1000, // Convert to milliseconds
      );

      return result;
    });
  }

  /* 이 메서드에서는 해당 학급, 해당 학기에 출제된 진단평가를 조회합니다.
   */
  async getDiagnosticAssessment(dto: GetDiagnosticAssessmentDto, role: Role, classInfo: ClassInfo, uuid: string): Promise<DiagnosticReturnType | null> {
    const assessment = await this.getAssessmentByClassInfoAndType(classInfo, dto.type, dto.learning_sys_id);
    if (!assessment) return null;

    let assessmentStatus = null;

    if (role === Role.Student) {
      const assessmentProblems = await this.prisma.assessment_problem.findMany({
        where: {
          assessment_id: assessment.id,
        },
      });
      const assessmentProblemsIds = assessmentProblems.map((v) => v.id);
      if (assessmentProblemsIds.length === 0) return null;
      const assessmentPerform = await this.prisma.assessment_perform.findFirst({
        where: {
          user_uuid: uuid,
          assessment_problem_id: {
            in: assessmentProblemsIds,
          },
        },
      });

      assessmentStatus = this.makeStatus(assessment, assessmentPerform, assessmentStatus);
    }

    return {
      assessment: assessment,
      status: assessmentStatus,
    };
  }

  async diagnosticAssessmentDone(classInfo: ClassInfo, uuid: string) {
    const assessment = await this.getAssessmentByClassInfoAndType(classInfo, AssessmentType.DIAGNOSTIC);
    if (!assessment) return null;

    const assessmentProblems = await this.prisma.assessment_problem.findMany({
      where: {
        assessment_id: assessment.id,
      },
    });

    const assessmentPrblemsIds = assessmentProblems.map((v) => v.id);

    const myAssessmentPerforms = await this.prisma.assessment_perform.count({
      where: {
        user_uuid: uuid,
        assessment_problem_id: {
          in: assessmentPrblemsIds,
        },
      },
    });

    return myAssessmentPerforms === assessmentProblems.length;
  }

  /**
   * ClassInfo로 학력진단평가를 찾아오는 메서드입니다.
   * 자주쓸거같아서 따로 빼뒀습니다
   * 작업자 : 왕정희
   * @param classInfo 클래스인포
   * @returns assessment row
   */
  async getAssessmentByClassInfoAndType(classInfo: ClassInfo, type: AssessmentType, learningSysId?: number) {
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    // 해당 학기, 학급에 대응하는 학습맵을 불러옵니다.
    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        semester: {
          grade: schoolClass.grade!,
          semester: classInfo.semester.toString(),
        },
        school_class: {
          some: {
            id: schoolClass.id,
          },
        },
      },
    });

    if (!learningMap) throw new NotFoundException(noLearningMapWarning);

    return await this.prisma.assessment.findFirst({
      where: {
        type,
        learning_map_id: learningMap.id,
        learning_sys_id: learningSysId || undefined,
        assessment_class: {
          some: {
            school_class_id: schoolClass.id,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private makeStatus(
    assessment: {
      id: number;
      type: AssessmentType;
      learning_map_id: number | null;
      created_at: Date;
      begun_at: Date | null;
      duration_in_second: number;
    },
    assessmentPerform: {
      id: number;
      user_uuid: string;
      assessment_problem_id: number;
      solving_start: Date | null;
      solving_end: Date | null;
      submission_answer: string;
      is_correct: number | null;
      created_at: Date;
    } | null,
    assessmentStatus: any,
  ) {
    if (new Date(assessment.begun_at!.getTime() + assessment.duration_in_second! * 1000) <= new Date()) {
      if (!assessmentPerform) {
        assessmentStatus = StudentAssessmentPerformStatus.FINISHED_WITHOUT_PARTICIPATION;
      } else {
        assessmentStatus = StudentAssessmentPerformStatus.FINISHED;
      }
    } else {
      if (assessment.begun_at!.getTime() > new Date().getTime() || !assessmentPerform) {
        assessmentStatus = StudentAssessmentPerformStatus.BEFORE_START;
      } else {
        assessmentStatus = StudentAssessmentPerformStatus.IN_PROGRESS;
      }
    }
    return assessmentStatus;
  }

  async getUnitAssessment(dto: GetUnitAssessmentDto, classInfo: ClassInfo, role: Role, uuid: string) {
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        type: AssessmentType.UNIT,
        assessment_problem: {
          every: {
            problem: {
              cls_id: {
                startsWith: dto.curriculumId,
              },
            },
          },
        },
        assessment_class: {
          some: {
            school_class_id: schoolClass.id,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!assessment) return null;

    let assessmentStatus = null;

    if (role === Role.Student) {
      const assessmentPerform = await this.prisma.assessment_perform.findFirst({
        where: {
          user_uuid: uuid,
        },
        include: {
          assessment_problem: true,
        },
      });

      assessmentStatus = this.makeStatus(assessment, assessmentPerform, assessmentStatus);
    }

    return { assessment: assessment, status: assessmentStatus };
  }

  private async calculateCorrectionRates(assessmentResultTableRows: AssessmentResultTableRowDto[]) {
    //array는 메모리 주소 reference가 오므로 굳이 return해서 새로 대입할 필요가 없다.
    for await (const row of assessmentResultTableRows) {
      const correctCount = row.assessment_problems.filter((v) => v.is_correct).length;
      row.correction_rate = Math.round((correctCount / row.assessment_problems.length) * 100);
    }
  }

  private generateTableRowProblem(assessmentPerform: assessment_perform, problem: problem, difficulty: string, currentLearningSys: learning_sys) {
    const currentRowProblem = new AssessmentResultTableRowProblem();
    currentRowProblem.assessment_perform = assessmentPerform;
    currentRowProblem.assessment_problem_id = assessmentPerform.assessment_problem_id;
    currentRowProblem.problem = problem;
    currentRowProblem.learning_sys = currentLearningSys;
    //is_correct는 TINYINT 1,0 으로 하기로 결정.
    currentRowProblem.is_correct = assessmentPerform.is_correct === 1 ? true : false;
    currentRowProblem.difficulty = difficulty;
    return currentRowProblem;
  }

  async getComprehensiveAssessment(classInfo: ClassInfo, role: Role, uuid: string) {
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        school_class: {
          some: {
            id: schoolClass.id,
          },
        },
        semester: {
          semester: classInfo.semester.toString(),
          grade: classInfo.user_grade,
        },
      },
    });

    if (!learningMap) throw new NotFoundException(noLearningMapWarning);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        type: AssessmentType.COMPREHENSIVE,
        learning_map_id: learningMap.id,
        assessment_class: {
          some: {
            school_class_id: schoolClass.id,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!assessment) return null;

    let assessmentStatus = undefined;

    if (role === Role.Student) {
      const assessmentPerform = await this.prisma.assessment_perform.findFirst({
        where: {
          user_uuid: uuid,
        },
        include: {
          assessment_problem: true,
        },
      });

      assessmentStatus = this.makeStatus(assessment, assessmentPerform, assessmentStatus);
    }

    return { assessment: assessment, status: assessmentStatus };
  }

  async getAssessmentProblems(id: number, classInfo: ClassInfo): Promise<AssessmentProblem[]> {
    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: id,
        assessment_class: {
          some: {
            school_class: {
              school: {
                school_id: classInfo.school_id,
              },
              class: classInfo.user_class,
              grade: classInfo.user_grade,
            },
          },
        },
      },
      include: {
        assessment_problem: {
          include: {
            problem: true,
          },
        },
      },
    });

    if (!assessment) throw new NotFoundException('평가를 찾을 수 없습니다.');

    return assessment.assessment_problem.map((v) => {
      return {
        answerType: v.problem.answer_type as EAnswerType,
        correctAnswer: v.problem.answer_data,
        original_problem_id: v.problem_id,
        createdAt: v.created_at,
        id: v.id,
        problemType: v.problem.type as EProblemType,
        curriculumId: v.problem.cls_id,
        aiHint: v.problem.ai_hint ?? undefined,
        difficulty: EDifficulty.getFromPrisma(v.problem.difficulty),
        explanation: v.problem.explanation ?? undefined,
        solutionDetail: v.problem.detail_solution ?? undefined,
        latexData: v.problem.latex_data,
        originalProblemId: v.problem_id,
      };
    });
  }

  async getAssessmentStatus(classInfo: ClassInfo): Promise<AssessmentStatus[]> {
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new InternalServerErrorException(noClassWarning);

    const assessmentsInClass = await this.prisma.assessment_class.findMany({
      where: {
        school_class_id: schoolClass.id,
      },
    });

    const assessmentIdsInClass: number[] = assessmentsInClass.map((v) => v.assessment_id).filter((v) => v !== null) as number[];

    if (assessmentIdsInClass.length === 0) return [];

    const assessments = await this.prisma.assessment.findMany({
      where: {
        id: {
          in: assessmentIdsInClass,
        },
      },
    });

    // redis 임시 off
    // const diagnostic = this.extractAssessmentInfoFromRedisValue(
    //   await this.cacheManager.get<string>(this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.DIAGNOSTIC)),
    // );
    // const unit = this.extractAssessmentInfoFromRedisValue(
    //   await this.cacheManager.get<string>(this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.UNIT)),
    // );
    // const comprehensive = this.extractAssessmentInfoFromRedisValue(
    //   await this.cacheManager.get<string>(this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.COMPREHENSIVE)),
    // );
    // if (!diagnostic && !unit && !comprehensive) return [];

    const result = [];

    for (const assessment of assessments) {
      //if now < begun_at + duration_in_second, status = "IN_PROGRESS"
      //if now > begun_at + duration_in_second, status = "FINISHED"
      if (!assessment.begun_at) throw new InternalServerErrorException('평가 시작 시간이 없습니다.');
      const now = new Date();
      const end = new Date(assessment.begun_at.getTime() + assessment.duration_in_second * 1000);
      const status = now > end ? 'FINISHED' : 'IN_PROGRESS';

      result.push({
        assessmentId: assessment.id,
        type: assessment.type as EAssessmentType,
        begunAt: assessment.begun_at,
        durationInSecond: assessment.duration_in_second,
        status,
        learning_sys_id: assessment.learning_sys_id || 0,
      });
    }
    return result;
  }

  async checkAssessmentStatus(classInfo: ClassInfo) {
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new InternalServerErrorException(noClassWarning);

    const diagnostic = this.extractAssessmentInfoFromRedisValue(
      await this.cacheManager.get<string>(this.formRedisKeyForAssessment(schoolClass.id, EAssessmentType.DIAGNOSTIC)),
    );

    if (!diagnostic) {
      return {
        assessmentExist: EAssessmentExist.NONE,
      };
    } else {
      return {
        assessmentExist: EAssessmentExist.EXIST,
      };
    }
  }

  formRedisKeyForAssessment(schoolClassId: number, type: EAssessmentType): string {
    return `assessment-schoolClassId:${schoolClassId}-${type}`;
  }

  extractAssessmentInfoFromRedisValue(value?: string): AssessmentInfoFromRedis | undefined {
    if (!value) return undefined;
    const [begunAt, assessmentId, durationInSecond] = value.split('-');
    return { assessmentId: Number(assessmentId), begunAt: new Date(begunAt), durationInSecond: Number(durationInSecond) };
  }

  formRedisValueForAssessment(assessmentId: number, begunAt: Date, durationInSecond: number): string {
    return `${begunAt}-${assessmentId}-${durationInSecond}`;
  }

  async startDiagnosticNow(id: number, classInfo: ClassInfo) {
    // 학급 정보를 찾습니다.
    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        class: classInfo.user_class,
        school: {
          school_id: classInfo.school_id,
        },
      },
    });

    if (!schoolClass) throw new NotFoundException(noClassWarning);

    // 해당 학급에 해당 id를 가진 평가가 있는지 찾아봅니다.

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: id,
        type: AssessmentType.DIAGNOSTIC,
        learning_map_id: schoolClass.learning_map_id,
      },
    });

    if (!assessment) throw new NotFoundException('평가를 찾을 수 없습니다.');

    // 이미 시작했거나 종료된 평가면 에러를 띄웁니다.

    if (assessment.begun_at !== null && assessment.begun_at.getTime() + assessment.duration_in_second * 1000 > Date.now()) {
      throw new ConflictException('이미 종료된 평가입니다.');
    }

    if (assessment.begun_at !== null && assessment.begun_at.getTime() > Date.now()) {
      throw new ConflictException('이미 시작된 평가입니다.');
    }

    // 위의 검증을 모두 거쳤으면 begun_at 을 지금으로 변경합니다.
    return await this.prisma.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        begun_at: new Date(),
      },
      select: {
        begun_at: true,
      },
    });
  }
}

interface AssessmentInfoFromRedis {
  assessmentId: number;
  begunAt: Date;
  durationInSecond: number;
}

export interface DiagnosticReturnType {
  assessment: {
    id: number;
    type: AssessmentType;
    begun_at: Date | null;
    duration_in_second: number | null;
    created_at: Date;
    assessment_problem?: (assessment_problem & { problem: problem })[];
  };
  status?: StudentAssessmentPerformStatus | null;
}
