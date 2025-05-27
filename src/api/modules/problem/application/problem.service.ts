import { HttpException, Injectable } from '@nestjs/common';
import { problem, study } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { StudyQueryRepository } from '../../study/infrastructure';
import { CorrectRate, GetByProblemIdDto, GetProblemsFilterDto, GetWrongProblemsDto, ProblemDto } from '../application/dto';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from '../infrastructure';
import { LearningService } from '../../learning/application/learning.service';
import { GetConceptProblemDto } from './dto/getConceptProblem.dto';
import { toStudyType } from '../../assessment/infrastructure/assessmentProblem.entity';
import { StudyWithPerform } from '../../assessment/application/dto/studyWithPerform.dto';

@Injectable()
export class ProblemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studyQueryRepository: StudyQueryRepository,
    private readonly problemQueryRepository: ProblemQueryRepository,
    private readonly problemSolvingQueryRepository: ProblemSolvingQueryRepository,
    private readonly learningService: LearningService,
  ) {}

  async getProblemById(dto: GetByProblemIdDto): Promise<problem | null> {
    return await this.problemQueryRepository.getProblemById(dto.id);
  }

  async getFromStudyRow(id: number, column: keyof study) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) throw new HttpException('해당 문제는 존재하지 않습니다.', 400);

    const studyFromProblem = await this.studyQueryRepository.getStudyByProblemId(problem.id);

    if (!studyFromProblem) throw new HttpException('문제와 연관된 Study가 존재하지 않습니다.', 400);
    if (!studyFromProblem[column]) throw new HttpException(`컬럼 '${column}'이 존재하지 않습니다.`, 400);

    return {
      [column]: studyFromProblem[column],
    };
  }

  async getProblems(filter: GetProblemsFilterDto): Promise<problem[]> {
    const { curriculum, unit_id, difficulty, answer_type, include_deleted, take, page, include_study } = filter;

    const filterSql: any = {
      curriculum,
      difficulty,
      answer_type,
      unit_id,
    };

    if (include_deleted != 'true') {
      filterSql.deleted_at = {
        equals: null,
      };
    }
    return await this.problemQueryRepository.getPagedProblemsByFilter(filterSql, page, take, include_study);
  }

  // async getFromSolvingRows(dto: GetByProblemIdDto, uuid: string, column: keyof problem_solving) {
  //   const solvingRows = await this.prisma.problem_solving.findMany({
  //     where: {
  //       problem_id: dto.id,
  //       user_uuid: uuid,
  //     },
  //   });

  //   if (!solvingRows) throw new HttpException('문제와 연관된 Solving Rows가 존재하지 않습니다.', 400);

  //   // Get video paths from solving rows return to array
  //   return solvingRows.map((row) => row[column]);
  // }

  // async updateProblemSolvingVideo(dto: UpdateProblemSolvingVideoDto, uuid: string): Promise<problem_solving> {
  //   return await this.problemSolvingQueryRepository.updateOrCreateProblemSolvingVideo(dto, uuid);
  // }

  async getWrongProblems(dto: GetWrongProblemsDto, uuid: string): Promise<StudyWithPerform[]> {
    return await this.problemQueryRepository.getWrongProblemsByLearningSysId(dto, uuid);
  }

  async getStudiedProblems(getConceptProblemDto: GetConceptProblemDto, uuid: string): Promise<ProblemDto[]> {
    const { learningSysId, type } = getConceptProblemDto;

    const problemDtos: ProblemDto[] = [];
    const studyType = toStudyType(type);
    const learningSysIds = [learningSysId];

    if (type === 'METACOGNITION') {
      const study = await this.studyQueryRepository.getStudiesByLearningSysIds(learningSysIds);
      const studyIds = study.map((v) => v.id);
      const studyProblems = await this.studyQueryRepository.getStudyProblesmWithPerforms(studyIds, [uuid]);
      const userProblems = studyProblems.filter((v) => v.study_perform.length);
      const vaildProblems = userProblems.filter((v) => v.study_perform[0].confidence === 1 && v.study_perform[0].is_correct === 0);
      const problemIds = studyProblems.map((v) => v.problem_id);
      const orgProblems = await this.problemQueryRepository.getProblemByIds(problemIds);
      orgProblems.reverse();

      for await (const problem of orgProblems) {
        const currentVaildProblem = vaildProblems.find((v) => v.problem_id === problem.id);
        if (!currentVaildProblem) continue;
        const problemDto = ProblemDto.from(problem);
        if (currentVaildProblem.study_perform[0]) {
          problemDto.study_perform = currentVaildProblem.study_perform[0];
        } else {
          problemDto.study_perform = null;
        }
        problemDto.study_id = currentVaildProblem.study_id;
        problemDto.learning_sys = (await this.prisma.learning_sys.findFirst({ where: { cls_id: problem.cls_id } }))!;
        problemDtos.push(problemDto);
      }
      return problemDtos;
    } else {
      const study = await this.studyQueryRepository.getStudiesByLearningSysIdsAndType(learningSysIds, studyType);
      const studyIds = study.map((v) => v.id);
      const studyProblems = await this.studyQueryRepository.getStudyProblemsByStudyIdsAndUuidWithPerform(studyIds, uuid);
      const vaildStudyProblem = studyProblems.filter((v) => v.study_perform.length);
      const problemIds = vaildStudyProblem.map((v) => v.problem_id);
      const bridgeIds = vaildStudyProblem.map((v) => v.id);
      const myPerforms = await this.studyQueryRepository.getStudyPerformsByStudyProblemIdsAndUuid(bridgeIds, uuid);
      const orgProblems = await this.problemQueryRepository.getProblemByIds(problemIds);

      for await (const perform of myPerforms) {
        const currentBridge = vaildStudyProblem.find((v) => v.id === perform.study_problem_id);
        if (!currentBridge) continue;
        const currentProblem = orgProblems.find((v) => v.id === currentBridge?.problem_id);
        if (!currentProblem) continue;

        const problemDto = ProblemDto.from(currentProblem);
        if (perform.is_correct >= 0) {
          //이미 풀었다면
          problemDto.study_perform = perform;
        } else {
          problemDto.study_perform = null;
        }
        problemDto.study_id = currentBridge.study_id;
        problemDto.learning_sys = (await this.prisma.learning_sys.findFirst({ where: { cls_id: currentProblem.cls_id } }))!;
        problemDtos.push(problemDto);
      }
      return problemDtos;
    }
  }

  async correcRate(problemId: number): Promise<CorrectRate> {
    const inStudy = await this.studyQueryRepository.getStudyPerformsByProblemId(problemId);
    return CorrectRate.create(inStudy);
  }
}
