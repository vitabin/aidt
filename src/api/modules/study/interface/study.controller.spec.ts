/* eslint-disable sonarjs/no-duplicate-string */
import { Test, TestingModule } from '@nestjs/testing';
import { StudyController } from './study.controller';
import { StudyService } from '../application/study.service';
import {
  GenerateAnalysisTableDto,
  GetParticipationProblemDto,
  CreateReferenceDataDto,
  CreateReferenceDataResponseDto,
  EditReferenceDataDto,
  GetReferenceDataDto,
  GetReferenceDataResponseDto,
} from '../application';
import { StudyType } from '@prisma/client';
import { EDifficulty, GetQuestionBankDto, ProblemDto, ProblemQuestionType } from '../../problem';
import { EProblemSolvingScope } from '../submodules/shared-video/infrastructure/concept-video.entity';
import { WinstonModule } from 'nest-winston';
import { AnalysisTableRowDto } from '../application/dto/analysis-table-row.dto';
import { AnalysisTableRowProblem } from '../application/dto/analysis-table-row-problem';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ReferenceData } from '../infrastructure';

describe('StudyController', () => {
  let studyController: StudyController;
  let studyService: DeepMockProxy<StudyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyController],
      imports: [WinstonModule.forRoot({})],
      providers: [
        {
          provide: StudyService,
          useValue: mockDeep<StudyService>(),
        },
      ],
    }).compile();

    studyController = module.get<StudyController>(StudyController);
    studyService = module.get(StudyService);
  });

  it('컨트롤러가 정의되어 있어야 합니다', () => {
    expect(studyController).toBeDefined();
  });

  describe('getBankedQuestions', () => {
    it('문제 목록을 반환해야 합니다', async () => {
      const dto: Partial<GetQuestionBankDto> = {
        learningSysId: 1234,
        problemId: 1234,
        problemType: ProblemQuestionType.BASIC,
        difficulty: EDifficulty.HIGHEST.code,
      };
      const result: ProblemDto[] = [
        /* 문제 리스트 초기화 */
      ];
      jest.spyOn(studyService, 'getBankedQuestions').mockResolvedValue(result);

      expect(await studyController.getBankedQuestions(dto as GetQuestionBankDto, 'uuid')).toBe(result);
      expect(studyService.getBankedQuestions).toHaveBeenCalledWith(dto, 'uuid');
    });
  });

  describe('generateAnalysisTable', () => {
    it('문제 분석표를 생성하여 반환해야 합니다', async () => {
      const dto: Partial<GenerateAnalysisTableDto> = {
        learning_sys_id: 1234,
      };
      const uuid = 'some-uuid';
      const problems: Partial<AnalysisTableRowProblem>[] = [
        {
          is_correct: 1,
          confidence: 0.5,
          difficulty: 'LOW',
          problem_id: 1234,
          study_perform_id: 1234,
          study_problem_id: 1234,
        },
      ];
      const result: Partial<AnalysisTableRowDto>[] = [
        {
          correction_rate: 50,
          progress_rate: 0,
          problems: problems as AnalysisTableRowProblem[],
          uuid: 'uuid',
        },
      ];
      jest.spyOn(studyService, 'generateAnalysisTable').mockResolvedValue(result as AnalysisTableRowDto[]);

      expect(await studyController.generateAnalysisTable(dto as GenerateAnalysisTableDto, uuid)).toBe(result);
      expect(studyService.generateAnalysisTable).toHaveBeenCalledWith(dto);
    });
  });

  describe('createReferenceData', () => {
    it('참고 자료를 생성해야 합니다', async () => {
      const dto: CreateReferenceDataDto = {
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file1', 'path/to/file2'],
        scope: EProblemSolvingScope.ALL,
        learningSysId: 1234,
      };
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      const result: CreateReferenceDataResponseDto = {
        id: 1234,
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file1', 'path/to/file2'],
        scope: EProblemSolvingScope.ALL,
      };
      jest.spyOn(studyService, 'createReferenceData').mockResolvedValue(result);

      expect(await studyController.createReferenceData(dto, uuid, classInfo)).toBe(result);
      expect(studyService.createReferenceData).toHaveBeenCalledWith(dto, uuid, classInfo);
    });
  });

  describe('getReferenceData', () => {
    it('참고 자료를 조회해야 합니다', async () => {
      const dto: GetReferenceDataDto = {
        learningSysId: 1234,
        page: 1,
        pageSize: 10,
      };
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      const result: GetReferenceDataResponseDto = {
        currentPage: 1,
        totalPage: 1,
        data: [
          {
            id: 1234,
            title: 'Title',
            createdAt: new Date(),
            viewCount: 0,
            scope: EProblemSolvingScope.ALL,
          },
        ],
      };
      jest.spyOn(studyService, 'getReferenceData').mockResolvedValue(result);

      expect(await studyController.getReferenceData(dto, uuid, classInfo)).toBe(result);
      expect(studyService.getReferenceData).toHaveBeenCalledWith(dto, uuid, classInfo);
    });
  });

  describe('getReferenceDataDetail', () => {
    it('참고 자료 상세 조회를 해야 합니다', async () => {
      const id = 1234;
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      const result = {
        id: 1234,
        title: 'Title',
        content: 'Content',
        filePaths: ['path/to/file1', 'path/to/file2'],
        scope: EProblemSolvingScope.ALL,
        createdAt: new Date(),
        viewCount: 0,
        userUuid: 'uuid',
      };
      jest.spyOn(studyService, 'getReferenceDataDetail').mockResolvedValue(result);

      expect(await studyController.getReferenceDataDetail(id, uuid, classInfo)).toBe(result);
      expect(studyService.getReferenceDataDetail).toHaveBeenCalledWith(id, uuid, classInfo);
    });
  });

  describe('likeReferenceData', () => {
    it('참고 자료에 좋아요/좋아요 해제를 해야 합니다', async () => {
      const referenceDataId = 1234;
      const like = true;
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(studyService, 'likeReferenceData').mockResolvedValue(undefined);

      expect(await studyController.likeReferenceData(referenceDataId, like, uuid, classInfo)).toBe(undefined);
      expect(studyService.likeReferenceData).toHaveBeenCalledWith(referenceDataId, like, uuid, classInfo);
    });
  });

  describe('deleteReferenceData', () => {
    it('참고 자료를 삭제해야 합니다', async () => {
      const id = 1234;
      const uuid = 'some-uuid';
      jest.spyOn(studyService, 'deleteReferenceData').mockResolvedValue(undefined);

      expect(await studyController.deleteReferenceData(id, uuid)).toBe(undefined);
      expect(studyService.deleteReferenceData).toHaveBeenCalledWith(id, uuid);
    });
  });

  describe('editReferenceData', () => {
    it('참고 자료를 수정해야 합니다', async () => {
      const dto: EditReferenceDataDto = {
        title: 'New Title',
        content: 'New Content',
        filePaths: ['path/to/newfile1', 'path/to/newfile2'],
      };
      const id = 1234;
      const uuid = 'some-uuid';
      const result = {
        class_table_id: 1234,
        concept_id: 5678,
        created_at: new Date(),
        id: 1234,
        learning_sys_id: 1234,
        scope: EProblemSolvingScope.ALL,
        uuid: 'uuid',
        concept_reference_data: {
          concept_reference_file: [
            {
              concept_reference_data_id: 1234,
              created_at: new Date(),
              id: 1234,
              path: 'path/to/newfile1',
            },
            {
              concept_reference_data_id: 1234,
              created_at: new Date(),
              id: 1234,
              path: 'path/to/newfile2',
            },
          ],
          concept_reference_id: 1234,
          content_data: 'New Content',
          content_title: 'New Title',
          created_at: new Date(),
          deleted_at: null,
          id: 1234,
          like_count: 0,
          updated_at: new Date(),
          view_count: 0,
        },
      };
      jest.spyOn(studyService, 'editReferenceData').mockResolvedValue(result);
      const expected: ReferenceData = {
        content: 'New Content',
        createdAt: new Date(),
        id: 1234,
        scope: EProblemSolvingScope.ALL,
        title: 'New Title',
        userUuid: 'uuid',
        viewCount: 0,
        filePaths: ['path/to/newfile1', 'path/to/newfile2'],
      };
      expect(await studyController.editReferenceData(dto, id, uuid)).toStrictEqual(expected);
      expect(studyService.editReferenceData).toHaveBeenCalledWith(dto, uuid, id);
    });
  });

  describe('getBasicProblem', () => {
    it('기본문제를 반환해야 합니다', async () => {
      const dto: GetParticipationProblemDto = {
        user_uuid: 'uuid',
        learning_sys_id: 1234,
      };
      const result: ProblemDto[] = [
        /* 문제 리스트 초기화 */
      ];
      jest.spyOn(studyService, 'getParticipationProblem').mockResolvedValue(result);

      expect(await studyController.getBasicProblem(dto)).toBe(result);
      expect(studyService.getParticipationProblem).toHaveBeenCalledWith(dto, StudyType.BASIC);
    });
  });

  describe('getConfirmProblem', () => {
    it('확인문제를 반환해야 합니다', async () => {
      const dto: GetParticipationProblemDto = {
        user_uuid: 'uuid',
        learning_sys_id: 1234,
      };
      const result: ProblemDto[] = [
        /* 문제 리스트 초기화 */
      ];
      jest.spyOn(studyService, 'getParticipationProblem').mockResolvedValue(result);

      expect(await studyController.getConfirmProblem(dto)).toBe(result);
      expect(studyService.getParticipationProblem).toHaveBeenCalledWith(dto, StudyType.CONFIRM);
    });
  });

  describe('getFeedbackProblem', () => {
    it('피드백문제를 반환해야 합니다', async () => {
      const dto: GetParticipationProblemDto = {
        user_uuid: 'uuid',
        learning_sys_id: 1234,
      };
      const result: ProblemDto[] = [
        /* 문제 리스트 초기화 */
      ];
      jest.spyOn(studyService, 'getParticipationProblem').mockResolvedValue(result);

      expect(await studyController.getFeedbackProblem(dto)).toBe(result);
      expect(studyService.getParticipationProblem).toHaveBeenCalledWith(dto, StudyType.FEEDBACK);
    });
  });

  describe('viewReferenceData', () => {
    it('참고 자료의 조회수를 증가시켜야 합니다', async () => {
      const referenceDataId = 1234;
      const uuid = 'some-uuid';
      const classInfo: ClassInfo = {
        school_id: '1234',
        user_class: '5678',
        user_grade: '10',
        semester: 1,
      };
      jest.spyOn(studyService, 'increaseViewCountForReferenceData').mockResolvedValue(undefined);

      expect(await studyController.viewReferenceData(referenceDataId, uuid, classInfo)).toBe(undefined);
      expect(studyService.increaseViewCountForReferenceData).toHaveBeenCalledWith(referenceDataId, uuid, classInfo);
    });
  });
});
