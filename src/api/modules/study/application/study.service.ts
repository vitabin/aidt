import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import {
  AchievementType,
  Difficulty,
  StudyType,
  UnitType,
  learning_level,
  problem,
  study,
  study_chapter_plan,
  study_perform,
  study_problem,
} from '@prisma/client';
import { GetQuestionBankDto, ProblemQuestionType } from '../../problem/application/dto/getProblemBank.dto';
import { EDifficulty, ProblemQueryRepository, ProblemTo } from '../../problem/infrastructure';
import {
  CreateCommentForConceptDto,
  CreateOrUpdateStudyChapterPlanDto,
  CreateReferenceDataDto,
  CreateReferenceDataResponseDto,
  CreateStudyPerform,
  EditCommentForReferenceDataDto,
  EditReferenceDataDto,
  GetCommentForReferenceDataDto,
  GetCommentsOfVideoDto,
  GetCommentsOfVideoResponseDto,
  GetParticipationProblemDto,
  GetReferenceDataDto,
  GetSharedVideoForConceptDto,
  GetSolutionOfProblemDto,
  GetSolutionOfProblemResponseDto,
  GetStudyChapterPlanDto,
  GetVideosOfProblemDto,
  GetVideosOfProblemResponseDto,
  StudyChapterPlanDto,
  UpdateCommentForConceptDto,
} from './dto';
import { PinSharedVideoOnTopDto } from '../submodules/shared-video/application/dto/pin-shared-video-on-top.dto';
import { ProblemDto } from '../../problem';
import { GenerateAnalysisTableDto } from './dto/generate-analysis-table.dto';
import { AnalysisTableRowDto } from './dto/analysis-table-row.dto';
import { PrismaService } from 'src/prisma';
import { AnalysisTableRowProblem } from './dto/analysis-table-row-problem';
import { LikeSharedVideoDto } from '../submodules/shared-video/application/dto/like-shared-video.dto';
import { LikeSharedVideoResponseDto } from '../submodules/shared-video/application/dto/like-shared-video-response.dto';
import {
  CommentEntity,
  ConceptVideo,
  EProblemSolvingScope,
  ReferenceData,
  StudyQueryRepository,
  fromDBProblemSolvingScope,
  fromDBVideoProcessingStatus,
} from '../infrastructure';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { GetReferenceDataResponseDto } from './dto/getReferenceDataResponse.dto';
import { CreateSharedVideoForConceptDto, GetCommentsForConceptDto, GetSharedVideoForConceptResponseDto } from '../submodules/shared-video/application/dto';
import { LearningLevelQueryRepository, LearningSysQueryRepository } from '../../learning';
import { UserAchievementQueryRepository } from '../../user_achievement/infrastructure';
import { SubmitStudyDto } from './dto/submitStudy.dto';
import { LearningService } from '../../learning/application/learning.service';
import { randomChoice } from 'src/libs/utils';
import { compareDifficulties } from 'src/libs/utils/compare';

@Injectable()
export class StudyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly problemQuery: ProblemQueryRepository,
    private readonly learningService: LearningService,
    private readonly studyQueryRepository: StudyQueryRepository,
    private readonly learningSysRepository: LearningSysQueryRepository,
    private readonly userAchievementQueryRepository: UserAchievementQueryRepository,
    private readonly learningLevelQueryRepository: LearningLevelQueryRepository,
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

  async searchBankedQuestions(getQuestionBankDto: GetQuestionBankDto, uuid: string, problemTo: ProblemTo): Promise<ProblemDto[]> {
    const { difficulty, problemId, problemType } = getQuestionBankDto;
    let inferiorClsId = undefined;
    let newDifficulty = difficulty;
    const currentUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUser) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (currentUser.learning_map_id === null) throw new NotFoundException('사용자에게 연결된 학습 맵이 없습니다.');

    const orgProblem = await this.problemQuery.getProblemById(problemId);
    if (problemType === ProblemQuestionType.INFERIOR) {
      const clsId = orgProblem.cls_id;
      const currentLearningMap = await this.prisma.learning_map.findFirst({
        where: {
          id: currentUser.learning_map_id,
        },
      });
      const subsection = await this.prisma.learning_sys.findFirst({
        where: {
          cls_id: clsId,
          learning_sys_doc_id: currentLearningMap?.learning_sys_doc_id,
        },
      });
      const pre_learning_map = await this.prisma.pre_learning_map.findFirst({
        where: {
          learning_sys_id: subsection!.id,
        },
      });
      inferiorClsId = pre_learning_map?.lv1_cls_id;
      newDifficulty = difficulty;
    }
    if (getQuestionBankDto.problemType === ProblemQuestionType.BASIC) {
      newDifficulty = EDifficulty.getBasic(difficulty);
    }
    if (getQuestionBankDto.problemType === ProblemQuestionType.ADVANCED) {
      newDifficulty = EDifficulty.getAdvanced(difficulty);
    }

    const problems = await this.problemQuery.getProblemsByDifficultyAndUnitId(newDifficulty, inferiorClsId ?? orgProblem.cls_id!);

    return problems
      .map((v) => {
        const problemDto = ProblemDto.from(v);
        if (problemTo.studyId) {
          problemDto.study_id = problemTo.studyId;
        } else {
          problemDto.assignment_id = problemTo.assignmentId;
        }
        return problemDto;
      })
      .sort((a, b) => b.problem_id - a.problem_id)
      .slice(0, 20);
  }

  async getBankedQuestions(getQuestionBankDto: GetQuestionBankDto, uuid: string): Promise<ProblemDto[]> {
    const { learningSysId } = getQuestionBankDto;
    const problemTo = new ProblemTo();
    const study_check = await this.studyQueryRepository.getStudyByLearningSysIdAndType(learningSysId, StudyType.ADDITIONAL);

    if (!study_check) {
      const createdStudy = await this.studyQueryRepository.createStudy(learningSysId, StudyType.ADDITIONAL);
      const subsections = await this.learningService.sectionToSubsections(learningSysId);
      const subsectionIds = subsections.map((v) => v.id);
      const clsIds = subsections.map((v) => v.cls_id!);
      const preLearningMap = await this.prisma.pre_learning_map.findMany({
        where: {
          learning_sys_id: {
            in: subsectionIds,
          },
        },
      });
      preLearningMap.forEach((v) => {
        const preClsIds = [v.lv1_cls_id!, v.lv2_cls_id!, v.lv3_cls_id!];
        clsIds.push(...preClsIds.filter((e) => e));
      });
      const problems = await this.problemQuery.getProblemByClsIds(clsIds);
      await this.studyQueryRepository.createStudyProblems(createdStudy.id, problems);
    }

    const study = await this.studyQueryRepository.getStudyByLearningSysIdAndType(learningSysId, StudyType.ADDITIONAL);

    if (!study) throw new NotFoundException('현재단원의 학습정보를 찾을 수 없습니다.');

    problemTo.studyId = study.id;
    const searchProblem = await this.searchBankedQuestions(getQuestionBankDto, uuid, problemTo);
    const problemIds = searchProblem.map((v) => v.problem_id);
    const studyProblem = await this.studyQueryRepository.getStudyProblemsByStudyIdAndProblemIds(study.id, problemIds);
    await Promise.all(
      studyProblem.map(async (v) => {
        const perform = CreateStudyPerform.create(v.id, uuid);
        return await this.studyQueryRepository.createStudyPerform(perform);
      }),
    );
    return Promise.all(
      searchProblem.map(async (v) => {
        const learningSys = await this.prisma.learning_sys.findFirst({
          where: {
            cls_id: v.cls_id,
          },
        });
        v.learning_sys = learningSys!;
        return v;
      }),
    );
  }

  /**
   * @params GetSharedVideoForConceptDto
   * @returns problem_solving
   *
   *
   */
  async getSharedVideoForConcept(dto: GetSharedVideoForConceptDto, uuid: string, classInfo: ClassInfo): Promise<GetSharedVideoForConceptResponseDto> {
    const result = await this.studyQueryRepository.getSharedVideoForConcept(dto, uuid, classInfo);
    return {
      totalPage: result.totalPage,
      videos: result.videos.map((v) => {
        return {
          created_at: v.created_at,
          id: v.id,
          cls_id: v.concept.cls_id,
          scope: fromDBProblemSolvingScope(v.scope),
          status: fromDBVideoProcessingStatus(v.status),
          user_uuid: v.user_uuid,
          video_path: v.video_path,
          deleted_at: v.deleted_at,
          pinned: v.concept_video_share!.pinned,
          comment_count: v.concept_video_data?._count.concept_video_comment === null ? 0 : v.concept_video_data!._count.concept_video_comment,
          like_count: v.concept_video_data?.like_count === null ? 0 : v.concept_video_data!.like_count,
          haveLiked: v.concept_video_like?.length > 0,
        };
      }),
    };
  }

  async pinSharedVideoOnTop(dto: PinSharedVideoOnTopDto, classInfo: ClassInfo, videoId: number) {
    return await this.studyQueryRepository.pinSharedVideoOnTop(dto, classInfo, videoId);
  }

  async createSharedVideoForConcept(dto: CreateSharedVideoForConceptDto, uuid: string, classInfo: ClassInfo): Promise<ConceptVideo> {
    const result = await this.studyQueryRepository.createSharedVideoForConcept(dto, uuid, classInfo);
    return {
      id: result.id,
      created_at: result.created_at,
      cls_id: result.concept.cls_id,
      scope: fromDBProblemSolvingScope(result.scope),
      status: fromDBVideoProcessingStatus(result.status),
      user_uuid: result.user_uuid,
      video_path: result.video_path,
      deleted_at: result.deleted_at,
      pinned: false,
      comment_count: 0,
      like_count: 0,
      haveLiked: false,
    };
  }

  async likeSharedVideo(dto: LikeSharedVideoDto, uuid: string): Promise<LikeSharedVideoResponseDto> {
    const result = await this.studyQueryRepository.likeSharedVideo(dto, uuid);

    return {
      concept_video_id: result[0].concept_video_id,
      like_count: result[1].like_count,
    };
  }

  async createCommentForConcept(dto: CreateCommentForConceptDto, uuid: string, videoId: number): Promise<CommentEntity> {
    const result = await this.studyQueryRepository.createCommentForConcept(dto, uuid, videoId);

    return {
      id: result.id,
      created_at: result.created_at,
      content: result.content,
      updated_at: result.updated_at,
      uuid: result.user_uuid,
    };
  }

  async updateCommentForConcept(dto: UpdateCommentForConceptDto, uuid: string, commentId: number): Promise<CommentEntity> {
    const result = await this.studyQueryRepository.updateCommentForConcept(dto, uuid, commentId);
    return {
      content: result.content,
      created_at: result.created_at,
      id: result.id,
      updated_at: result.updated_at!,
      uuid: result.user_uuid,
    };
  }

  async generateAnalysisTable(dto: GenerateAnalysisTableDto): Promise<Array<AnalysisTableRowDto>> {
    //소단원과 학습문제 타입(피드백,진단 등)으로 검색
    const studies = await this.prisma.study.findMany({
      where: {
        learning_sys_id: dto.learning_sys_id,
        type: dto.type,
      },
    });
    if (studies.length === 0) throw new HttpException('학습 정보를 찾을 수 없습니다.', 404);

    const generatedTableRows: Array<AnalysisTableRowDto> = [];
    //소단원과 학습문제 타입으로 학습을 수행한 이력을 모두 가져온다.
    for await (const study of studies) {
      const studyRow: AnalysisTableRowDto = new AnalysisTableRowDto();
      //study_id로 연관된 study_problem 들을 모두 가져온다.
      //study 객체 하나하나는 학생 한명을 위해 만들어지므로, 아래에서 study problems를 조회하여 study perform을 가져온다 해도 모두 동일한 사람의 것임.

      const studyProblems = await this.prisma.study_problem.findMany({
        where: {
          study_id: study.id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      for await (const studyProblem of studyProblems) {
        //이제 Problem_id를 가져올 수 있으므로 해당 아이디로 problem들을 조회한다.
        const studyPerform = await this.prisma.study_perform.findFirst({
          where: {
            study_problem_id: studyProblem.id,
            user_uuid: {
              in: dto.uuids,
            },
          },
        });
        const problem = await this.prisma.problem.findFirst({
          where: {
            id: studyProblem.problem_id,
          },
        });
        if (!problem) continue;
        if (!studyPerform) continue;

        const studyRowProblem: AnalysisTableRowProblem = new AnalysisTableRowProblem();
        studyRowProblem.confidence = studyPerform.confidence;
        studyRowProblem.is_correct = studyPerform.is_correct;
        studyRowProblem.difficulty = problem.difficulty;
        studyRowProblem.problem_id = problem.id;
        studyRowProblem.study_perform_id = studyPerform.id;
        studyRowProblem.study_problem_id = studyProblem.id;
        studyRowProblem.problem_type = problem.type;

        //이제 두번째 루프에 들어와서야 uuid를 가져올 수 있다.
        studyRow.uuid = studyPerform.user_uuid;
        //각 studyRow에 sturyRowProblem를 추가한다.
        studyRow.problems.push(studyRowProblem);
      }
      // studyRow 내부의 problem들을 위에서 for-loop으로 모두 가져왔으므로 이제서야 correction_rate를 계산할 수 있다.
      // is_correct를 TINYINT(1)로 하기로 약속했으므로, 1이면 정답이다.
      studyRow.correction_rate = Math.round((studyRow.problems.filter((p) => p.is_correct === 1).length / studyRow.problems.length) * 100);
      studyRow.progress_rate = 0; //TODO: 진도율 계산 구현 필요
      generatedTableRows.push(studyRow);
    }

    /**
     * example structure :
     * [
     *  {
     *    uuid: 'example-uuid-1',
     *    correction_rate: 100,
     *    problems:[
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>
     *    ]
     *  }:<AnalysisTableRowDto>,
     *  {
     *    uuid: 'example-uuid-2',
     *    correction_rate: 50,
     *    problems:[
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>,
     *      {문제정보, 정답여부, 자신감, 난이도 등}:<AnalysisTableRowProblem>
     *    ]
     *  }:<AnalysisTableRowDto>
     * ]
     */
    return generatedTableRows;
  }

  protected async generateStudy({ learning_sys_id, study_type }: { learning_sys_id: number; study_type: StudyType }) {
    const createdStudy = await this.studyQueryRepository.createStudy(learning_sys_id, study_type);
    const subsections = await this.learningService.sectionToSubsections(learning_sys_id);
    const subsectionIds = subsections.map((v) => v.id);
    const clsIds = subsections.map((v) => v.cls_id!);
    const preLearningMap = await this.prisma.pre_learning_map.findMany({
      where: {
        learning_sys_id: {
          in: subsectionIds,
        },
      },
    });
    preLearningMap.forEach((v) => {
      const preClsIds = [v.lv1_cls_id!, v.lv2_cls_id!, v.lv3_cls_id!];
      clsIds.push(...preClsIds.filter((e) => e));
    });
    const problems = await this.problemQuery.getProblemByClsIds(clsIds);
    await this.studyQueryRepository.createStudyProblems(createdStudy.id, problems);
  }

  /**
   * 피드백 문제를 생성한다.
   */
  protected async generatedFeedbackProblems({
    learning_sys_id,
    user_uuid,
    validatedStudy,
  }: {
    learning_sys_id: number;
    user_uuid: string;
    validatedStudy: study;
  }) {
    const ProblemDtos: ProblemDto[] = [];

    const targetStudies = await this.studyQueryRepository.getStudiesByLearningSysId(learning_sys_id);
    const basic = targetStudies.find((v) => v.type === StudyType.BASIC);
    const confirm = targetStudies.find((v) => v.type === StudyType.CONFIRM);
    const feedback = targetStudies.find((v) => v.type === StudyType.FEEDBACK);

    //문제 풀을 만든다.
    const basicProbs = await this.studyQueryRepository.getStudyProblemsByStudyId(basic!.id);
    const basicProbIds = basicProbs.map((v) => v.id);
    const confirmProbs = await this.studyQueryRepository.getStudyProblemsByStudyId(confirm!.id);
    const confirmProbIds = confirmProbs.map((v) => v.id);
    const basicAndConfirmPool = [...basicProbs, ...confirmProbs];
    const feedbackProbs = await this.studyQueryRepository.getStudyProblemsByStudyId(feedback!.id);

    //나의 performs를 가져온다.
    const basicPerforms = await this.studyQueryRepository.getStudyPerformsByStudyProblemIdsAndUuid(basicProbIds, user_uuid);
    const confirmPerforms = await this.studyQueryRepository.getStudyPerformsByStudyProblemIdsAndUuid(confirmProbIds, user_uuid);
    const isDone = [...basicPerforms.map((v) => v.solving_end), ...confirmPerforms.map((v) => v.solving_end)];

    if (isDone.some((bool) => !bool) || isDone.length !== 8)
      throw new NotAcceptableException('기본문제, 확인문제를 모두 풀어야만 피드백문제를 풀 수 있습니다.');

    const incorrectProbIds: number[] = [];
    for (let index = 0; index < 4; index++) {
      const basicPerform = basicPerforms[index];
      const confirmPerform = confirmPerforms[index];

      //기본, 확인문제 같은 인덱스에서 둘 다 맞았다면 넘어간다.
      if (confirmPerform.is_correct && basicPerform.is_correct) continue;

      //확인 문제의 아이디를 넣어준다.
      incorrectProbIds.push(basicAndConfirmPool.find((v) => v.id === confirmPerform.study_problem_id)!.id);
    }

    //피드백 문제 생성
    const blacklist: Array<number> = [];
    for await (const myWrongProbId of incorrectProbIds) {
      const myWrongProb = confirmProbs.find((v) => v.id === myWrongProbId);
      const similarProb = feedbackProbs.find((v) => v.problem.difficulty === myWrongProb!.problem.difficulty && !blacklist.includes(v.id));
      blacklist.push(similarProb!.id);
      //perform 생성
      const feedbackPerform = CreateStudyPerform.create(similarProb!.id, user_uuid);
      const createdFeedbackPerform = await this.studyQueryRepository.createStudyPerform(feedbackPerform);

      //dto생성
      const problemDto = ProblemDto.from(similarProb!.problem);
      problemDto.study_id = validatedStudy.id;
      problemDto.study_perform = createdFeedbackPerform;
      ProblemDtos.push(problemDto);
    }
    return ProblemDtos;
  }

  protected async getAlreadySolvedPerforms({
    validatedStudyProblems,
    isPerformCreated,
    validatedStudy,
  }: {
    validatedStudyProblems: study_problem[];
    isPerformCreated: study_perform[];
    validatedStudy: study;
  }) {
    const ProblemDtos: ProblemDto[] = [];
    const problemIds = validatedStudyProblems.map((v) => v.problem_id);
    const problems = await this.problemQuery.getProblemByIds(problemIds);
    for (const problem of problems) {
      if (ProblemDtos.length === 4) break;
      const problemDto = ProblemDto.from(problem);
      const studyProblem = validatedStudyProblems.find((v) => v.problem_id === problem.id);
      const studyPerform = isPerformCreated.find((v) => v.study_problem_id === studyProblem?.id);
      if (studyPerform) {
        problemDto.study_id = validatedStudy.id;
        problemDto.study_perform = studyPerform;
        problemDto.learning_sys = (await this.prisma.learning_sys.findFirst({ where: { cls_id: problem.cls_id } }))!;
        ProblemDtos.push(problemDto);
      }
    }
    return ProblemDtos;
  }

  protected async generateBasicOrConfirm({
    user_uuid,
    unstudiedProblems,
    validatedStudy,
    learningLevel,
    learning_sys_id,
    problems,
  }: {
    user_uuid: string;
    unstudiedProblems: study_problem[];
    validatedStudy: study;
    learningLevel: learning_level;
    learning_sys_id: number;
    problems: problem[];
  }) {
    const ProblemDtos: ProblemDto[] = [];
    const studyProblems = await this.prisma.study_problem.findMany({
      where: {
        study_id: validatedStudy.id,
      },
    });
    const generatedPerforms = await this.prisma.study_perform.findMany({
      where: {
        user_uuid,
        study_problem_id: {
          in: studyProblems.map((v) => v.id),
        },
      },
    });
    if (generatedPerforms.length > 1) {
      for await (const studyPerform of generatedPerforms) {
        const bridge = studyProblems.find((v) => v.id === studyPerform.study_problem_id);
        if (!bridge) continue;
        const problem = await this.problemQuery.getProblemById(bridge!.problem_id);
        if (!problem) continue;
        const problemDto = ProblemDto.from(problem);
        problemDto.study_id = validatedStudy.id;
        problemDto.study_perform = studyPerform;
        problemDto.learning_sys = (await this.prisma.learning_sys.findFirst({ where: { cls_id: problem.cls_id } }))!;
        ProblemDtos.push(problemDto);
      }
      return ProblemDtos;
    } else {
      const targetProblems = await this.problemPortal(learningLevel, learning_sys_id, problems);
      if (!targetProblems.length) return [];
      for await (const targetProblem of targetProblems) {
        const perform = new CreateStudyPerform();
        perform.user_uuid = user_uuid;
        perform.study_problem_id = unstudiedProblems.find((v) => v.problem_id === targetProblem.id && v.study_id === validatedStudy.id)!.id;
        const studyPerform = await this.studyQueryRepository.createStudyPerform(perform);
        const problemDto = ProblemDto.from(targetProblem);
        problemDto.study_id = validatedStudy.id;
        problemDto.study_perform = studyPerform;
        problemDto.learning_sys = (await this.prisma.learning_sys.findFirst({ where: { cls_id: targetProblem.cls_id } }))!;
        ProblemDtos.push(problemDto);
      }
      ProblemDtos.sort((a, b) => compareDifficulties(a.difficulty, b.difficulty));
      return ProblemDtos;
    }
  }

  async getParticipationProblem(getParticipationProblemDto: GetParticipationProblemDto, study_type: StudyType): Promise<ProblemDto[]> {
    const { user_uuid, learning_sys_id } = getParticipationProblemDto;
    const study_check = await this.studyQueryRepository.getStudyByLearningSysIdAndType(learning_sys_id, study_type);
    const learningSys = await this.learningSysRepository.getById(learning_sys_id);

    if (!learningSys) throw new HttpException('주어진 정보에 맞는 학습체계가 DB에 존재하지 않습니다.', 404);
    if (learningSys.type === UnitType.SUBSECTION) throw new BadRequestException('소단원ID가 아닙니다.');

    //1.만약 study 테이블에 정보가 없다면 생성한다.
    if (!study_check) await this.generateStudy({ learning_sys_id, study_type });

    const validatedStudy = await this.studyQueryRepository.getStudyByLearningSysIdAndType(learning_sys_id, study_type);
    if (!validatedStudy) throw new HttpException('주어진 정보에 맞는 학습정보가 DB에 존재하지 않습니다.', 404);

    //2.study 정보를 가져온다. 단. 여기서 추가문제(문제은행)은 제외한다.
    const study = (await this.studyQueryRepository.getStudyWithStudyProblemByLearningSysId(learning_sys_id)).filter((v) => v.type !== StudyType.ADDITIONAL);
    const studyProblems = study.map((v) => v.study_problem).flat();
    const studyProblemIds = studyProblems.map((v) => v.id);
    const unstudiedProblems = await this.studyQueryRepository.getUnstudiedProblemsByIdsAndUuid(studyProblemIds, user_uuid);

    //3. 만약 피드백 문제 요청이라면, 피드백 문제를 반환
    if (study_type === StudyType.FEEDBACK) return this.generatedFeedbackProblems({ learning_sys_id, user_uuid, validatedStudy });

    //4. 기본문제,확인문제를 반환한다.
    const userAchievement = await this.userAchievementQueryRepository.getLastestByUuid(user_uuid);
    if (!userAchievement) throw new BadRequestException('먼저 학력진단평가 수행 또는 이전 소단원 학습이 필요합니다.');
    const learningLevel = await this.learningLevelQueryRepository.getById(userAchievement.learning_level_id);
    if (!learningLevel) throw new NotFoundException('주어진 정보에 맞는 학습단계가 DB에 존재하지 않습니다.');

    const unstudiedProblemIds = unstudiedProblems.filter((v) => v.study_id === validatedStudy.id).map((v) => v.problem_id);
    const problems = await this.problemQuery.getProblemByIds(unstudiedProblemIds);

    return this.generateBasicOrConfirm({ user_uuid, unstudiedProblems, validatedStudy, learningLevel, learning_sys_id, problems });
  }

  protected async getPreLearningMapsAndSubsections({ learningSysId }: { learningSysId: number }) {
    const subsections = await this.learningService.sectionToSubsections(learningSysId);
    const subsectionIds = subsections.map((v) => v.id);
    const preLearningMaps = await this.prisma.pre_learning_map.findMany({
      where: {
        learning_sys_id: {
          in: subsectionIds,
        },
      },
    });
    return {
      subsections,
      subsectionIds,
      preLearningMaps,
    };
  }

  protected getRandomProblemByClsIds(fullStack: problem[], currentStack: problem[], clsIds: (string | null)[]) {
    const processedClsIds = clsIds.filter((v) => v != null);
    const problem = fullStack.find((v) => v.cls_id === randomChoice(processedClsIds) && !currentStack.includes(v));
    fullStack.splice(fullStack.indexOf(problem!), 1);
    return problem;
  }

  protected async problemPortal(learningLevel: learning_level, learningSysId: number, problems: problem[]): Promise<problem[]> {
    const subsections = await this.learningService.sectionToSubsections(learningSysId);
    switch (learningLevel.level) {
      case 1: {
        const problem: problem[] = [];
        const { preLearningMaps } = await this.getPreLearningMapsAndSubsections({ learningSysId });
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const ppPrevClsIds = preLearningMaps.map((v) => v.lv3_cls_id); //전전전단원 cls_id
        const pPrevClsIds = preLearningMaps.map((v) => v.lv2_cls_id); //전전단원 cls_id
        const prevClsIds = preLearningMaps.map((v) => v.lv1_cls_id); //전단원 cls_id
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //전전전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, ppPrevClsIds)!);
        //예외포인트 -> 전전전단원의 문제가 없을 경우? 전단원에서 출제
        if (problem[0] === undefined) problem[0] = this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!;

        //전전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, pPrevClsIds)!);
        //예외포인트 -> 전전단원의 문제가 없을 경우? 전단원에서 출제
        if (problem[1] === undefined) problem[1] = this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!;

        //전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!);

        //본단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 2: {
        const problem: problem[] = [];
        const { preLearningMaps } = await this.getPreLearningMapsAndSubsections({ learningSysId });
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const pPrevClsIds = preLearningMaps.map((v) => v.lv2_cls_id); //전전단원 cls_id
        const prevClsIds = preLearningMaps.map((v) => v.lv1_cls_id); //전단원 cls_id
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //전전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, pPrevClsIds)!);
        //예외포인트 -> 전전단원의 문제가 없을 경우? 전단원에서 출제
        if (problem[0] === undefined) problem[0] = this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!;

        //전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!);

        //본단원 2개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 3: {
        const problem: problem[] = [];
        const { preLearningMaps } = await this.getPreLearningMapsAndSubsections({ learningSysId });
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const prevClsIds = preLearningMaps.map((v) => v.lv1_cls_id); //전단원 cls_id
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //전단원 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, prevClsIds)!);

        //본단원 3개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 4: {
        const problem: problem[] = [];
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //본단원 난이도 하 4개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 5: {
        const problem: problem[] = [];
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const midDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.MIDDLE);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //난이도는 낮은거 -> 높은거 순입니다.
        //본단원 난이도 하 2개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 중 2개
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 6: {
        const problem: problem[] = [];
        const lowDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.LOW);
        const midDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.MIDDLE);
        const highDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGH);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //난이도는 낮은거 -> 높은거 순입니다.
        //본단원 난이도 하 1개
        problem.push(this.getRandomProblemByClsIds(lowDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 중 2개
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 상 1개
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 7: {
        const problem: problem[] = [];
        const midDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.MIDDLE);
        const highDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGH);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //난이도는 낮은거 -> 높은거 순입니다.
        //본단원 난이도 중 2개
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 상 1개
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 8: {
        const problem: problem[] = [];
        const midDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.MIDDLE);
        const highDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGH);
        const highestDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGHEST);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //난이도는 낮은거 -> 높은거 순입니다.
        //본단원 난이도 중 1개
        problem.push(this.getRandomProblemByClsIds(midDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 상 2개
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 최상 1개
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 9: {
        const problem: problem[] = [];
        const highDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGH);
        const highestDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGHEST);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //난이도는 낮은거 -> 높은거 순입니다.

        //본단원 난이도 상 2개
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highDifficultyProblems, problem, currentClsIds)!);

        //본단원 난이도 최상 2개
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
      case 10: {
        const problem: problem[] = [];
        const highestDifficultyProblems = problems.filter((v) => v.difficulty === Difficulty.HIGHEST);
        const currentClsIds = subsections.map((v) => v.cls_id!); //본단원 cls_id

        //본단원 난이도 최상 4개
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        problem.push(this.getRandomProblemByClsIds(highestDifficultyProblems, problem, currentClsIds)!);
        return problem;
      }
    }
    return [];
  }

  async deleteCommentForConcept(uuid: string, commentId: number) {
    const result = await this.studyQueryRepository.deleteCommentForConcept(uuid, commentId);
    return { id: result.id };
  }

  async deleteSharedVideoForConcept(uuid: string, videoId: number) {
    const result = await this.studyQueryRepository.deleteSharedVideoForConcept(uuid, videoId);
    return { id: result.id };
  }

  async createReferenceData(dto: CreateReferenceDataDto, uuid: string, classInfo: ClassInfo): Promise<CreateReferenceDataResponseDto> {
    const result = await this.studyQueryRepository.createReferenceData(dto, uuid, classInfo);
    return {
      id: result.id,
      scope: result.scope as EProblemSolvingScope,
      content: result.concept_reference_data!.content_data,
      filePaths: result.concept_reference_data!.concept_reference_file.map((v) => v.path),
      title: result.concept_reference_data!.content_title,
    };
  }

  async getReferenceData(getReferenceDataDto: GetReferenceDataDto, uuid: string, classInfo: ClassInfo): Promise<GetReferenceDataResponseDto> {
    const result = await this.studyQueryRepository.getReferenceData(getReferenceDataDto, uuid, classInfo);

    return {
      currentPage: getReferenceDataDto.page,
      data: result.data.map((v) => {
        return {
          id: v.id,
          content: v.concept_reference_data!.content_data,
          scope: v.scope as EProblemSolvingScope,
          createdAt: v.created_at,
          title: v.concept_reference_data!.content_title,
          viewCount: v.concept_reference_data!.view_count,
          userUuid: v.uuid,
        };
      }),
      totalPage: result.totalCount / getReferenceDataDto.pageSize,
    };
  }

  async increaseViewCountForReferenceData(referenceDataId: number, uuid: string, classInfo: ClassInfo) {
    return await this.studyQueryRepository.increaseViewCountForReferenceData(referenceDataId, uuid, classInfo);
  }

  async increaseViewCountForSharedVideo(videoId: number, uuid: string, classInfo: ClassInfo) {
    return await this.studyQueryRepository.increaseViewCountForSharedVideo(videoId, uuid, classInfo);
  }

  async getReferenceDataDetail(id: number, uuid: string, classInfo: ClassInfo): Promise<ReferenceData> {
    const result = await this.studyQueryRepository.getReferenceDataDetail(id, uuid, classInfo);

    return {
      content: result.concept_reference_data!.content_data,
      filePaths: result.concept_reference_data!.concept_reference_file.map((v) => v.path),
      title: result.concept_reference_data!.content_title,
      scope: result.scope as EProblemSolvingScope,
      id: result.id,
      userUuid: result.uuid,
      viewCount: result.concept_reference_data!.view_count,
      createdAt: result.created_at,
      likeCount: result.concept_reference_data?.like_count ?? 0,
      commentCount: result._count.concept_reference_comment,
      haveILiked: result.concept_reference_like.length > 0,
    };
  }

  async deleteReferenceData(id: number, uuid: string) {
    await this.studyQueryRepository.deleteReferenceData(id, uuid);
  }
  async likeReferenceData(referenceDataId: number, like: boolean, uuid: string, classInfo: ClassInfo) {
    await this.studyQueryRepository.likeReferenceData(referenceDataId, like, uuid, classInfo);
  }
  async editReferenceData(dto: EditReferenceDataDto, uuid: string, id: number) {
    return await this.studyQueryRepository.editReferenceData(dto, uuid, id);
  }

  async submitStudyPerform(submitStudyDto: SubmitStudyDto, uuid: string) {
    const { confidence, answer, problemId, studyId } = submitStudyDto;

    const study = await this.studyQueryRepository.getStudyById(studyId);

    const studyProblem = await this.studyQueryRepository.getStudyProblemByStudyIdAndProblemId(studyId, problemId);

    if (!studyProblem) throw new NotFoundException('학습에 대한 문제 정보가 없습니다.');

    const orgProb = await this.problemQuery.getProblemById(problemId);

    if (!orgProb) throw new NotFoundException('문제를 찾을 수 없습니다.');

    const studyPerform = await this.studyQueryRepository.getStudyPerformByStudyProblemId(studyProblem.id, uuid);

    if (!studyPerform) throw new NotFoundException('학습 풀이 정보를 찾을 수 없습니다.');

    if (studyPerform.submission_answer && studyPerform.solving_end) {
      studyPerform.is_correct = answer === orgProb.answer_data ? 1 : 0;
      return studyPerform;
    }

    try {
      const newStudyPerform = await this.prisma.$transaction(async (prisma) => {
        return await prisma.study_perform.update({
          where: {
            id: studyPerform.id,
          },
          data: {
            is_correct: answer === orgProb.answer_data ? 1 : 0,
            confidence: confidence,
            solving_end: new Date(),
            submission_answer: answer,
          },
        });
      });

      if (study?.type === StudyType.FEEDBACK) {
        const studies = await this.studyQueryRepository.getStudyByLearningSysId(study.learning_sys_id);
        const noAdditional = studies.filter((v) => v.type !== StudyType.ADDITIONAL);
        const studyIds = noAdditional.map((v) => v.id);
        const studyProblems = await this.studyQueryRepository.getStudyProblemsByStudyIds(studyIds);
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerforms = await this.studyQueryRepository.getStudyPerformsByStudyProblemIdsAndUuid(studyProblemIds, uuid);
        const solvedPerforms = studyPerforms.filter((v) => v.is_correct !== -1);

        if (studyPerforms.length !== solvedPerforms.length) return newStudyPerform;
        const correctRate = Math.floor((solvedPerforms.filter((v) => v.is_correct === 1).length / studyPerforms.length) * 100);
        await this.adjustAchievementLevel({ uuid, correctRate, learning_sys_id: study.learning_sys_id });
      }

      if (study?.type === StudyType.CONFIRM) {
        const studies = await this.studyQueryRepository.getStudyByLearningSysId(study.learning_sys_id);
        const noAdditional = studies.filter((v) => v.type !== StudyType.ADDITIONAL);
        const studyIds = noAdditional.map((v) => v.id);
        const studyProblems = await this.studyQueryRepository.getStudyProblemsByStudyIds(studyIds);
        const studyProblemIds = studyProblems.map((v) => v.id);
        const studyPerforms = await this.studyQueryRepository.getStudyPerformsByStudyProblemIdsAndUuid(studyProblemIds, uuid);
        const solvedPerforms = studyPerforms.filter((v) => v.is_correct !== -1);
        const correctPerforms = solvedPerforms.filter((v) => v.is_correct === 1);
        if (solvedPerforms.length === 8 && correctPerforms.length === 8) {
          //8문제 전부 풀고 100점이라면?
          await this.adjustAchievementLevel({ uuid, correctRate: 100, learning_sys_id: study.learning_sys_id }); // 다맞췄으니 그냥 정답률 100으로 보낸다.
        }
      }
      return newStudyPerform;
    } catch (e) {
      throw new ConflictException('문제 제출 실패');
    } finally {
      await this.prisma.$disconnect();
    }
  }

  protected async adjustAchievementLevel({ uuid, correctRate, learning_sys_id }: { uuid: string; correctRate: number; learning_sys_id: number }) {
    const userAchievement = await this.userAchievementQueryRepository.getLastestByUuid(uuid);
    const learningLevel = await this.prisma.learning_level.findFirstOrThrow({ where: { level: userAchievement!.learning_level_id } });

    if (correctRate < 50 && learningLevel.level !== 1) {
      learningLevel.level -= 1;
    } else if (correctRate > 75 && learningLevel.level !== 10) {
      learningLevel.level += 1;
    }

    const newLevel = await this.prisma.learning_level.findFirstOrThrow({ where: { level: learningLevel.level } });
    const node = await this.prisma.learning_map_node.findFirst({ where: { learning_sys_id: learning_sys_id } });
    await this.prisma.user_achievement.create({
      data: {
        user_uuid: uuid,
        is_force_apply: false,
        learning_map_id: userAchievement!.learning_map_id,
        learning_map_node_id: node?.id,
        learning_level_group_id: userAchievement?.learning_level_group_id,
        learning_sys_id: learning_sys_id,
        learning_level_id: newLevel.id,
        achievement_type: AchievementType.UNIT_PROGRESS,
        achievement_score: correctRate,
      },
    });
  }

  async createOrUpdateStudyPlan(dto: CreateOrUpdateStudyChapterPlanDto, uuid: string): Promise<study_chapter_plan> {
    const currentUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUser || !currentUser.learning_map_id) throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        id: currentUser?.learning_map_id,
      },
    });
    if (!learningMap) throw new NotFoundException('학습맵 정보를 찾을 수 없습니다.');
    const semesterId = learningMap?.semester_id;
    const userStudyPlanExists = await this.prisma.study_chapter_plan.findFirst({
      where: {
        semester_id: semesterId,
        learning_sys_id: dto.learning_sys_id,
        uuid,
      },
    });

    if (userStudyPlanExists) {
      return await this.prisma.study_chapter_plan.update({
        where: {
          id: userStudyPlanExists.id,
        },
        data: {
          ...dto,
        },
      });
    } else {
      return await this.prisma.study_chapter_plan.create({
        data: {
          ...dto,
          uuid,
        },
      });
    }
  }

  async getStudyPlan(dto: GetStudyChapterPlanDto, uuid: string) {
    const studyChapterPlanDto = new StudyChapterPlanDto();
    //get semester
    const currentUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });
    if (!currentUser || !currentUser.learning_map_id) throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        id: currentUser?.learning_map_id,
      },
    });
    if (!learningMap) throw new NotFoundException('학습맵 정보를 찾을 수 없습니다.');
    const semesterId = learningMap?.semester_id;
    const currentPlan = await this.prisma.study_chapter_plan.findFirst({
      where: {
        semester_id: semesterId,
        learning_sys_id: dto.learning_sys_id,
        uuid: uuid,
      },
    });
    studyChapterPlanDto.current = currentPlan!;

    if (!currentPlan) studyChapterPlanDto.current = studyChapterPlanDto.noData(uuid, dto.learning_sys_id!);

    if (!dto.learning_sys_id) {
      studyChapterPlanDto.previous = studyChapterPlanDto.noData(uuid, dto.learning_sys_id!);
      return studyChapterPlanDto;
    }

    const node = await this.prisma.learning_map_node.findFirst({
      where: {
        learning_sys_id: dto.learning_sys_id,
      },
    });

    if (!node) throw new NotFoundException('단원 노드 정보를 찾을 수 없습니다.');
    if (!node.link_prev) {
      studyChapterPlanDto.previous = studyChapterPlanDto.noData(uuid, -1);
      return studyChapterPlanDto;
    }

    const previousNode = await this.prisma.learning_map_node.findFirst({
      where: {
        id: node.link_prev,
      },
    });

    const diagnosticHistory = await this.prisma.user_achievement.findFirst({
      where: {
        user_uuid: uuid,
        achievement_type: AchievementType.DIAGNOSTIC,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!diagnosticHistory) throw new NotFoundException('학력진단 평가를 수행한 이력이 없습니다.');

    const previousAchievementLevel = await this.prisma.user_achievement.findFirst({
      where: {
        learning_sys_id: previousNode?.learning_sys_id ? previousNode.learning_sys_id : diagnosticHistory.learning_level_id,
        user_uuid: uuid,
      },
    });

    if (previousNode && previousAchievementLevel) {
      const studies = await this.studyQueryRepository.getStudyByLearningSysId(previousNode.learning_sys_id);
      const studyProblems = await this.prisma.study_problem.findMany({ where: { study_id: { in: studies.map((v) => v.id) } } });
      const studyPerforms = await this.prisma.study_perform.findMany({
        where: {
          study_problem_id: {
            in: studyProblems.map((v) => v.id),
          },
          user_uuid: uuid,
          solving_end: {
            not: null,
          },
        },
      });
      const userCorrects = studyPerforms.filter((v) => v.is_correct === 1);
      const userCorrectRate = Math.floor((userCorrects.length / studyPerforms.length) * 10);
      const metacognitions = studyPerforms.filter((v) => v.confidence === 1);
      const userMetacognitions = metacognitions.filter((v) => v.is_correct === 1);
      const userMetacognitionRate = Math.floor((userMetacognitions.length / metacognitions.length) * 10);
      const userStudied = studyPerforms.filter((v) => v.solving_end);
      const subsections = await this.learningService.sectionToSubsections(previousNode.learning_sys_id);
      const clsIds = subsections.map((v) => v.cls_id!);
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
      const videoPlayTimes = await this.prisma.common_concept_video_play.findMany({
        where: {
          common_concept_video_id: {
            in: vidIds,
          },
          user_uuid: uuid,
        },
      });
      const userPlayTime = videoPlayTimes.filter((v) => v.ended_at !== null && v.ended_at !== undefined);
      const userConceptProgrress = (userPlayTime.length / videoPlayTimes.length) * 2.5;
      const userProgress = Math.floor((userStudied.length / studyPerforms.length) * 7.5 + userConceptProgrress);

      studyChapterPlanDto.previous = {
        id: 0,
        uuid: uuid,
        semester_id: 0,
        learning_sys_id: previousNode.learning_sys_id,
        progress_rate: userProgress,
        achievement_level: previousAchievementLevel.learning_level_id,
        correct_rate: userCorrectRate,
        metarecognition_rate: userMetacognitionRate,
      };
    }

    if (!previousNode) studyChapterPlanDto.previous = studyChapterPlanDto.noData(uuid, previousNode!.learning_sys_id);

    return studyChapterPlanDto;
  }

  async getCommentsForConcept(videoId: number, dto: GetCommentsForConceptDto) {
    const where = {
      concept_video_data: {
        concept_video_id: videoId,
      },
      deleted_at: null,
    };

    const totalCount = await this.prisma.concept_video_comment.count({ where: where, select: { id: true } });

    if (totalCount.id === 0) {
      return {
        totalPage: 1,
        currentPage: 1,
        comments: [],
      };
    }
    const comments = await this.prisma.concept_video_comment.findMany({
      where: where,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        user_uuid: true,
        created_at: true,
        content: true,
        updated_at: true,
      },
      take: dto.pageSize,
      skip: (dto.page - 1) * dto.pageSize,
    });

    const currentPage = dto.page;
    const totalPage = Math.ceil(totalCount.id / dto.pageSize);
    return {
      totalPage,
      currentPage,
      comments,
    };
  }

  async editCommentForReferenceData(commentId: number, uuid: string, content: string) {
    const comment = await this.prisma.concept_video_comment.findUnique({
      where: {
        id: commentId,
      },
    });
    if (!comment) throw new HttpException('댓글이 존재하지 않습니다.', HttpStatus.NOT_FOUND);
    if (comment.user_uuid !== uuid) throw new HttpException('작성자만 수정할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.concept_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: content,
        updated_at: new Date(),
      },
    });
  }
  async deleteCommentForReferenceData(commentId: number, uuid: string) {
    const comment = await this.prisma.concept_video_comment.findUnique({
      where: {
        id: commentId,
      },
    });
    if (!comment) throw new HttpException('댓글이 존재하지 않습니다.', HttpStatus.NOT_FOUND);
    if (comment.user_uuid !== uuid) throw new HttpException('작성자만 삭제할 수 있습니다.', HttpStatus.FORBIDDEN);

    await this.prisma.concept_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }
  async createCommentForReferenceData(referenceDataId: number, uuid: string, classInfo: ClassInfo, content: string) {
    const referenceData = await this.prisma.concept_reference.findUnique({
      where: {
        id: referenceDataId,
        class_table: {
          class: classInfo.user_class,
          grade: classInfo.user_grade,
          school: {
            school_id: classInfo.school_id,
          },
        },
      },
      select: {
        id: true,
        concept_reference_data: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!referenceData) throw new HttpException('참고자료가 존재하지 않습니다.', HttpStatus.NOT_FOUND);

    return await this.prisma.concept_video_comment.create({
      data: { concept_video_data_id: referenceData.concept_reference_data!.id, user_uuid: uuid, content: content },
    });
  }
  async getCommentForReferenceData(referenceDataId: number, classInfo: ClassInfo, dto: GetCommentForReferenceDataDto) {
    const referenceData = await this.prisma.concept_reference.findUnique({
      where: {
        id: referenceDataId,
        class_table: {
          class: classInfo.user_class,
          grade: classInfo.user_grade,
          school: {
            school_id: classInfo.school_id,
          },
        },
      },
      select: {
        id: true,
        concept_reference_data: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!referenceData) throw new HttpException('참고자료가 존재하지 않습니다.', HttpStatus.NOT_FOUND);

    const totalCount = await this.prisma.concept_video_comment.count({
      where: {
        concept_video_data_id: referenceData.concept_reference_data!.id,
        deleted_at: null,
      },
    });

    if (totalCount === 0) {
      return {
        totalPage: 1,
        currentPage: 1,
        comments: [],
      };
    }

    return {
      comments: await this.prisma.concept_video_comment.findMany({
        where: {
          concept_video_data_id: referenceData.concept_reference_data!.id,
          deleted_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          user_uuid: true,
          created_at: true,
          content: true,
          updated_at: true,
        },
        take: dto.pageSize,
        skip: (dto.page - 1) * dto.pageSize,
      }),
      currentPage: dto.page,
      totalPage: Math.ceil(totalCount / dto.pageSize),
    };
  }

  async getSolutionOfProblem(dto: GetSolutionOfProblemDto, uuid: string): Promise<GetSolutionOfProblemResponseDto> {
    const respectiveStudyPerform = await this.prisma.study_perform.findFirst({
      where: {
        study_problem: {
          problem_id: dto.problemId,
          study_id: dto.studyId,
        },
        user_uuid: uuid,
      },
      select: {
        id: true,
        is_correct: true,
        submission_answer: true,
        study_problem: {
          select: {
            problem: {
              select: {
                answer_data: true,
                difficulty: true,
                explanation: true,
                detail_solution: true,
              },
            },
          },
        },
      },
    });

    if (!respectiveStudyPerform) throw new NotFoundException('해당 문제에 대해 정답을 제출한 이력이 없습니다.');

    const globalCorrectCount = await this.prisma.study_perform.count({
      where: {
        study_problem: {
          problem_id: dto.problemId,
          study_id: dto.studyId,
        },
        is_correct: 1,
      },
    });

    const globalTotalCount = await this.prisma.study_perform.count({
      where: {
        study_problem: {
          problem_id: dto.problemId,
          study_id: dto.studyId,
        },
      },
    });

    let correctRate = 0;

    if (globalTotalCount !== 0) {
      correctRate = Math.floor((globalCorrectCount / globalTotalCount) * 100);
    }

    return {
      correctAnswer: respectiveStudyPerform.study_problem.problem.answer_data,
      problemId: dto.problemId,
      studyId: dto.studyId,
      submittedAnswer: respectiveStudyPerform.submission_answer ?? '',
      solution: respectiveStudyPerform.study_problem.problem.explanation ?? '',
      correctRate: correctRate,
    };
  }

  async getVideosOfProblem(dto: GetVideosOfProblemDto, uuid: string): Promise<GetVideosOfProblemResponseDto> {
    const studyProblem = await this.prisma.study_problem.findFirst({
      where: {
        problem_id: dto.problemId,
        study_id: dto.studyId,
      },
      select: {
        problem: {
          select: {
            cls_id: true,
          },
        },
      },
    });

    if (!studyProblem) throw new NotFoundException(`studyId: ${dto.studyId}, problemId: ${dto.problemId}에 해당하는 study_problem이 존재하지 않습니다.`);

    const concept = await this.prisma.concept.findMany({
      where: {
        cls_id: studyProblem.problem.cls_id,
      },
      select: { id: true },
    });

    if (!concept) throw new NotFoundException(`cls_id: ${studyProblem.problem.cls_id}에 해당하는 개념이 없습니다.`);

    const totalCount = await this.prisma.common_concept_video.count({
      where: {
        concept_id: {
          in: concept.map((c) => c.id),
        },
      },
    });

    if (totalCount === 0) {
      return {
        totalPage: 1,
        currentPage: 1,
        videos: [],
      };
    }

    const videos = await this.prisma.common_concept_video.findMany({
      where: {
        concept_id: {
          in: concept.map((c) => c.id),
        },
      },
      include: {
        common_concept_video_like: {
          where: {
            user_uuid: uuid,
          },
        },
        common_concept_video_data: {
          include: {
            _count: {
              select: {
                common_concept_video_comment: true,
              },
            },
          },
        },
      },
      orderBy: {
        common_concept_video_data: {
          view_count: 'desc',
        },
      },
    });

    return {
      totalPage: Math.ceil(totalCount / dto.pageSize),
      currentPage: dto.page,
      videos: videos.map((v) => {
        return {
          commentCount: v.common_concept_video_data?._count.common_concept_video_comment ?? 0,
          haveILiked: v.common_concept_video_like.length > 0,
          likeCount: v.common_concept_video_like.length,
          subtitlePath: v.subtitle_path,
          videoPath: v.video_path,
          commentary: v.commentary,
          id: v.id,
        };
      }),
    };
  }

  async getCommentsOfVideo(videoId: number, dto: GetCommentsOfVideoDto): Promise<GetCommentsOfVideoResponseDto> {
    const totalCount = await this.prisma.common_concept_video_comment.count({
      where: {
        common_concept_video_data: {
          common_concept_video_id: videoId,
        },
      },
    });

    if (totalCount === 0) {
      return {
        totalPage: 1,
        currentPage: 1,
        comments: [],
      };
    }

    const comments = await this.prisma.common_concept_video_comment.findMany({
      where: {
        common_concept_video_data: {
          common_concept_video_id: videoId,
        },
      },
      skip: (dto.page - 1) * dto.pageSize,
      take: dto.pageSize,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        updated_at: true,
        user_uuid: true,
      },
    });

    return {
      comments: comments.map((v) => {
        return {
          id: v.id,
          content: v.content,
          uuid: v.user_uuid,
          createdAt: v.created_at,
          created_at: v.created_at,
          updated_at: v.updated_at,
        };
      }),
      currentPage: dto.page,
      totalPage: Math.ceil(totalCount / dto.pageSize),
    };
  }

  async updateLikeForVideo(videoId: number, uuid: string, like: boolean): Promise<number> {
    if (like) {
      const like = await this.prisma.common_concept_video_like.findFirst({
        where: {
          common_concept_video_id: videoId,
          user_uuid: uuid,
        },
      });

      if (like) {
        throw new ConflictException('이미 좋아요를 누른 영상입니다.');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.common_concept_video_like.create({
          data: {
            common_concept_video_id: videoId,
            user_uuid: uuid,
          },
        });

        const data = await tx.common_concept_video_data.findUnique({
          where: {
            common_concept_video_id: videoId,
          },
        });

        if (!data) {
          await tx.common_concept_video_data.create({
            data: {
              common_concept_video_id: videoId,
              like_count: 0,
              view_count: 0,
            },
          });
        }

        return await tx.common_concept_video_data.update({
          where: {
            common_concept_video_id: videoId,
          },
          data: {
            like_count: {
              increment: 1,
            },
          },
        });
      });

      return result.like_count;
    } else {
      const like = await this.prisma.common_concept_video_like.findFirst({
        where: {
          common_concept_video_id: videoId,
          user_uuid: uuid,
        },
      });

      if (!like) {
        throw new ConflictException('좋아요를 누르지 않은 영상입니다.');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.common_concept_video_like.delete({
          where: {
            id: like.id,
          },
        });

        return await tx.common_concept_video_data.update({
          where: {
            common_concept_video_id: videoId,
          },
          data: {
            like_count: {
              decrement: 1,
            },
          },
        });
      });

      return result.like_count;
    }
  }

  async createCommentForVideo(videoId: number, dto: EditCommentForReferenceDataDto, uuid: string): Promise<CommentEntity> {
    const data = await this.prisma.common_concept_video_data.findUnique({
      where: {
        common_concept_video_id: videoId,
      },
    });

    if (!data) {
      await this.prisma.common_concept_video_data.create({
        data: {
          common_concept_video_id: videoId,
          like_count: 0,
          view_count: 0,
        },
      });
    }

    const result = await this.prisma.common_concept_video_comment.create({
      data: {
        content: dto.comment,
        common_concept_video_data: {
          connect: {
            common_concept_video_id: videoId,
          },
        },
        user_uuid: uuid,
      },
    });

    return {
      content: result.content,
      created_at: result.created_at,
      id: result.id,
      uuid: result.user_uuid,
      updated_at: result.updated_at,
    };
  }

  async deleteCommentForVideo(commentId: number, uuid: string) {
    const comment = await this.prisma.common_concept_video_comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new NotFoundException('존재하지 않는 댓글입니다.');
    }

    if (comment.user_uuid !== uuid) {
      throw new ForbiddenException('오직 작성자만 삭제할 수 있습니다.');
    }

    await this.prisma.common_concept_video_comment.delete({
      where: {
        id: commentId,
      },
    });
  }

  async editCommentForVideo(commentId: number, uuid: string, comment: string): Promise<CommentEntity> {
    const commentRow = await this.prisma.common_concept_video_comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!commentRow) {
      throw new NotFoundException('존재하지 않는 댓글입니다.');
    }

    if (commentRow.user_uuid !== uuid) {
      throw new ForbiddenException('오직 작성자만 수정할 수 있습니다.');
    }

    const result = await this.prisma.common_concept_video_comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: comment,
      },
    });

    return {
      content: result.content,
      created_at: result.created_at,
      id: result.id,
      uuid: result.user_uuid,
      updated_at: result.updated_at,
    };
  }

  async syncStudyProblemAndProblem() {
    const fail = [];
    const succese = [];

    const studyProblems = await this.prisma.study_problem.findMany();
    const postedProblemIds = [...new Set(studyProblems.map((v) => v.problem_id))];
    const unPostedProblems = await this.prisma.problem.findMany({
      where: {
        id: {
          notIn: postedProblemIds,
        },
      },
    });
    const clsIds = [...new Set(unPostedProblems.map((v) => v.cls_id))];
    const learningSyes = await this.prisma.learning_sys.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
    });
    const sectionIds = [...new Set(learningSyes.map((v) => v.parent_id!))];
    for await (const sectionId of sectionIds) {
      const studies = await this.studyQueryRepository.getStudyByLearningSysId(sectionId);
      const subsections = learningSyes.filter((v) => v.parent_id === sectionId);
      const clsId = subsections.map((v) => v.cls_id!);
      const problems = await this.problemQuery.getProblemByClsIds(clsId);
      for await (const study of studies) {
        try {
          await this.prisma.$transaction(async () => {
            await this.studyQueryRepository.createStudyProblems(study.id, problems);
          });
          succese.push(study.id);
        } catch {
          fail.push(study.id);
        }
      }

      return `싱크 성공: [${succese}] \n싱크 실패: [${fail}]`;
    }
  }
}
