import { Injectable } from '@nestjs/common';
import { Difficulty, StudyType, problem, study } from '@prisma/client';
import { BaseRepository } from 'src/libs/base/base-query';
import { PrismaService } from 'src/prisma';
import { EDifficultyProps } from './problem.enum';
import { GetWrongProblemsDto } from '../application';
import { StudyWithPerform } from '../../assessment/application/dto/studyWithPerform.dto';

@Injectable()
export class ProblemQueryRepository extends BaseRepository<problem> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async getProblemById(id: number) {
    return await this.prisma.problem.findUniqueOrThrow({
      where: { id },
    });
  }

  async getProblemByClsId(clsId: string) {
    return await this.prisma.problem.findMany({
      where: { cls_id: clsId },
    });
  }

  async getProblemByClsIds(clsIds: string[]) {
    return await this.prisma.problem.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
  }

  async getProblemByIds(id: number[]) {
    return await this.prisma.problem.findMany({
      where: {
        id: {
          in: id,
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async getProblemWithStudyById(id: number) {
    return await this.prisma.problem.findUnique({
      where: { id },
      include: {
        study_problem: true,
      },
    });
  }

  //TODO: unit_id를 learning_sys_id로 변경하였는데 확인 부탁드립니다.
  async getProblemsByDifficultyAndUnitId(difficulty: EDifficultyProps, cls_id: string): Promise<problem[]> {
    return await this.prisma.problem.findMany({
      where: {
        difficulty: difficulty,
        cls_id: cls_id,
        deleted_at: null,
      },
      include: {
        study_problem: true,
      },
    });
  }

  async getPagedProblemsByFilter(filterSql: any, page: number, take: number, includeStudy: string = 'false'): Promise<problem[]> {
    const options = {
      where: filterSql,
      take: take,
      skip: (page - 1) * take,
      ...(includeStudy === 'true' ? { include: { study_problem: true } } : {}),
    };
    return await this.prisma.problem.findMany(options);
  }

  async findFirstOrThrow(where: any) {
    return await this.prisma.problem.findFirstOrThrow({ where });
  }

  async getWrongProblemsByLearningSysId(dto: GetWrongProblemsDto, uuid: string): Promise<StudyWithPerform[]> {
    //학습 시스템 ID로 학습한 문제들을 가져온다. + (문제 유형에 따라 필터링)
    const studyFilter: { learning_sys_id: number; type?: StudyType } = {
      learning_sys_id: dto.learning_sys_id,
    };
    if (dto.studyType) {
      studyFilter.type = dto.studyType;
    }
    const studies = await this.prisma.study.findMany({
      where: studyFilter,
    });
    const studyIds = studies.map((study: study) => study.id);

    //study_problems 테이블 조회
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        study_id: {
          in: studyIds,
        },
      },
    });
    const studyProblemIds = studyProblems.map((studyProblem) => studyProblem.id);

    //study_performs 조회하여 내가 풀었던 문제 중 오답을 가져온다.
    const studyPerforms = await this.prisma.study_perform.findMany({
      where: {
        user_uuid: uuid,
        study_problem_id: {
          in: studyProblemIds,
        },
        is_correct: 0,
      },
    });
    const studyPerformsStudyProblemIds = studyPerforms.map((studyPerform) => studyPerform.study_problem_id);

    //아까 불러온 studyProblems 안에서, studyPerformsStudyProblemIds 의 교집합을 구하면 내가 틀린 문제들을 가져올 수 있다.
    const wrongStudyProblemRows = studyProblems.filter((studyProblem) => studyPerformsStudyProblemIds.includes(studyProblem.id));

    //틀린 문제들만 있는 studyProblemRows를 통해 problem_id를 가져온다.
    const wrongProblemIds = wrongStudyProblemRows.map((wrongStudyProblem) => wrongStudyProblem.problem_id);

    const problemFilter: {
      id: {
        in: number[];
      };
      difficulty?: Difficulty;
    } = {
      id: {
        in: wrongProblemIds,
      },
    };

    if (dto.difficulty) {
      //만약 difficulty 필터값을 프론트에서 줬다면
      problemFilter['difficulty'] = dto.difficulty;
    }
    //이제 내가 틀린 문제들의 원본 데이터를 가져올 수 있다.
    const problems = await this.prisma.problem.findMany({
      where: problemFilter,
      orderBy: {
        id: 'asc',
      }, //저번에 id asc로 정렬하기로 약속하였습니다.
    });

    const tmpResult: StudyWithPerform[] = [];
    for (const problem of problems) {
      const studyProblem = wrongStudyProblemRows.find((studyProblem) => studyProblem.problem_id === problem.id);
      if (studyProblem) {
        tmpResult.push({
          problem,
          myPerform: studyPerforms.find((studyPerform) => studyPerform.study_problem_id === studyProblem.id),
        });
      }
    }

    return tmpResult;
  }
  async getProblemWithProblemSolvingByUuids(uuids: string[]) {
    return await this.prisma.problem.findMany({
      include: {
        shared_solution_video: {
          where: {
            user_uuid: {
              in: uuids,
            },
          },
        },
      },
    });
  }

  async getProblemWithProblemSolvingByUuid(uuid: string) {
    return await this.prisma.problem.findMany({
      include: {
        shared_solution_video: {
          where: {
            user_uuid: uuid,
          },
        },
      },
    });
  }
}
