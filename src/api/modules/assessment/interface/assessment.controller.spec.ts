import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentController } from './assessment.controller';
import { APP_GUARD } from '@nestjs/core';
import { AssessmentService, DiagnosticReturnType } from '../application';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { CreateDiagnosticAssessmentDto, CreateComprehensiveAssessmentDto, CreateUnitAssessmentDto, GetDiagnosticAssessmentDto } from '../application/dto';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { WinstonModule } from 'nest-winston';
import { AnswerType, AssessmentType, ContentStatus, Difficulty, ProblemType, assessment } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Role } from 'src/libs/decorators/role.enum';
import { Assessment, EAssessmentType, StudentAssessmentPerformStatus, toEAssessmentType } from '../infrastructure/assessment.entity';
import { toEAnswerType, toEProblemType } from '../infrastructure/problem.entity';
import { EDifficulty } from '../../problem';
import { NotFoundException } from '@nestjs/common';

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let service: DeepMockProxy<AssessmentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        {
          provide: AssessmentService,
          useValue: mockDeep(),
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    controller = module.get<AssessmentController>(AssessmentController);
    service = module.get(AssessmentService);
  });

  it('진단 평가를 생성해야 합니다.', async () => {
    const dto: CreateDiagnosticAssessmentDto = {
      durationInSecond: 60,
      beginAt: new Date(),
    };

    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 1,
    };

    const expectedResult: assessment = {
      begun_at: new Date(),
      duration_in_second: 60,
      learning_map_id: 1234567890,
      id: 1234567890,
      type: AssessmentType.DIAGNOSTIC,
      created_at: new Date(),
    };
    jest.spyOn(service, 'createDiagnosisAssessment').mockResolvedValue(expectedResult);

    const result = await controller.createDiagnosisAssessment(dto, classInfo);

    expect(result).toEqual({
      begunAt: expect.any(Date),
      endAt: expect.any(Date),
      id: 1234567890,
      type: AssessmentType.DIAGNOSTIC,
      createdAt: expect.any(Date),
    });
    expect(service.createAssessment).toHaveBeenCalledWith(dto, classInfo);
  });

  it('총괄 평가를 생성해야 합니다.', async () => {
    const dto: CreateComprehensiveAssessmentDto = {
      durationInSecond: 120,
    };

    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 1,
    };

    const expectedResult: assessment = {
      begun_at: new Date(),
      duration_in_second: 120,
      learning_map_id: 1234567890,
      id: 1234567890,
      type: AssessmentType.COMPREHENSIVE,
      created_at: new Date(),
    };
    jest.spyOn(service, 'createComprehensiveAssessment').mockResolvedValue(expectedResult);

    const result = await controller.createComprehensiveAssessment(dto, classInfo);

    expect(result).toEqual({
      begunAt: expect.any(Date),
      endAt: new Date(expectedResult.begun_at!.getTime() + 120 * 1000),
      id: 1234567890,
      type: AssessmentType.COMPREHENSIVE,
      createdAt: expect.any(Date),
    });
    expect(service.createComprehensiveAssessment).toHaveBeenCalledWith(dto, classInfo);
  });

  it('형성 평가를 생성해야 합니다.', async () => {
    const dto: CreateUnitAssessmentDto = {
      durationInSecond: 45,
      curriculumId: '1234567890',
    };

    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 1,
    };

    const expectedResult: assessment = {
      begun_at: new Date(),
      duration_in_second: 45,
      learning_map_id: 1234567890,
      id: 1234567890,
      type: AssessmentType.UNIT,
      created_at: new Date(),
    };
    jest.spyOn(service, 'createUnitAssessment').mockResolvedValue(expectedResult);

    const result = await controller.createUnitAssessment(dto, classInfo);

    expect(result).toEqual({
      begunAt: expect.any(Date),
      endAt: new Date(expectedResult.begun_at!.getTime() + 45 * 1000),
      id: 1234567890,
      type: AssessmentType.UNIT,
      createdAt: expect.any(Date),
    });
    expect(service.createUnitAssessment).toHaveBeenCalledWith(dto, classInfo);
  });

  describe('getDiagnosticAssessment', () => {
    const getDiagnosticAssessmentDto: GetDiagnosticAssessmentDto = {
      containingProblemsPreview: true,
    };

    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 1,
    };

    const expectedResultWithProblems: DiagnosticReturnType = {
      assessment: {
        id: 1234567890,
        type: AssessmentType.DIAGNOSTIC,
        begun_at: new Date(),
        created_at: new Date(),
        duration_in_second: 3600,
        assessment_problem: [
          {
            assessment_id: 1234567890,
            created_at: new Date(),
            id: 1234567890,
            problem_id: 1234567890,
            problem: {
              id: 1234567890,
              ai_hint: '',
              answer_data: '',
              answer_type: AnswerType.MULTISELECT,
              cls_id: '1234567890',
              content_status: ContentStatus.ACTIVED,
              created_at: new Date(),
              deleted_at: null,
              detail_solution: '',
              difficulty: Difficulty.HIGH,
              explanation: '',
              is_algeomath: true,
              is_ebs: true,
              latex_data: '',
              manage_no: '1',
              target_grade: 2,
              target_semester: 1,
              type: ProblemType.DIAGNOSTIC,
              updated_at: new Date(),
            },
          },
        ],
      },
      status: StudentAssessmentPerformStatus.BEFORE_START,
    };

    const response = {
      assessment: {
        createdAt: expectedResultWithProblems.assessment.created_at,
        id: expectedResultWithProblems.assessment.id,
        type: toEAssessmentType(expectedResultWithProblems.assessment.type),
        begunAt: expectedResultWithProblems.assessment.begun_at ?? undefined,
        endAt: expect.any(Date),
      },
      problems: [
        {
          answerType: toEAnswerType(expectedResultWithProblems.assessment.assessment_problem![0].problem.answer_type),
          correctAnswer: expectedResultWithProblems.assessment.assessment_problem![0].problem.answer_data,
          createdAt: expectedResultWithProblems.assessment.assessment_problem![0].created_at,
          difficulty: EDifficulty.getFromPrisma(expectedResultWithProblems.assessment.assessment_problem![0].problem.difficulty),
          id: expectedResultWithProblems.assessment.assessment_problem![0].problem.id,
          latexData: expectedResultWithProblems.assessment.assessment_problem![0].problem.latex_data,
          originalProblemId: expectedResultWithProblems.assessment.assessment_problem![0].problem.id,
          problemType: toEProblemType(expectedResultWithProblems.assessment.assessment_problem![0].problem.type),
          standardLearningSystemId: expectedResultWithProblems.assessment.assessment_problem![0].problem.cls_id,
          aiHint: expectedResultWithProblems.assessment.assessment_problem![0].problem.ai_hint!,
          explanation: expectedResultWithProblems.assessment.assessment_problem![0].problem.explanation!,
          solutionDetail: expectedResultWithProblems.assessment.assessment_problem![0].problem.detail_solution!,
        },
      ],
    };

    it('문제 미리보기를 포함한 진단 평가를 조회해야 합니다.', async () => {
      jest.spyOn(service, 'getDiagnosticAssessment').mockResolvedValue(expectedResultWithProblems);

      const result = await controller.getDiagnosticAssessment(getDiagnosticAssessmentDto, 'some-uuid', Role.Teacher, classInfo);

      expect(result).toEqual(response);
      expect(service.getDiagnosticAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getDiagnosticAssessmentDto),
        Role.Teacher,
        expect.objectContaining(classInfo),
        'some-uuid',
      );
    });

    it('문제 미리보기를 포함하지 않은 진단 평가를 조회해야 합니다.', async () => {
      const expectedResultWithoutProblems: DiagnosticReturnType = {
        assessment: {
          id: 1234567890,
          type: AssessmentType.DIAGNOSTIC,
          begun_at: new Date(),
          created_at: new Date(),
          duration_in_second: 3600,
        },
        status: StudentAssessmentPerformStatus.BEFORE_START,
      };
      jest.spyOn(service, 'getDiagnosticAssessment').mockResolvedValue(expectedResultWithoutProblems);

      const response = {
        assessment: {
          createdAt: expectedResultWithoutProblems.assessment.created_at,
          id: expectedResultWithoutProblems.assessment.id,
          type: toEAssessmentType(expectedResultWithoutProblems.assessment.type),
          begunAt: expectedResultWithoutProblems.assessment.begun_at ?? undefined,
          endAt: expect.any(Date),
        },
        problems: undefined,
      };

      const dto = { ...getDiagnosticAssessmentDto, containingProblemsPreview: false };

      const result = await controller.getDiagnosticAssessment(dto, 'some-uuid', Role.Student, classInfo);

      expect(result).toEqual(response);
      expect(service.getDiagnosticAssessment).toHaveBeenCalledWith(expect.objectContaining(dto), Role.Student, expect.objectContaining(classInfo), 'some-uuid');
    });

    it('진단 평가가 존재하지 않는 경우 null을 반환해야 합니다.', async () => {
      jest.spyOn(service, 'getDiagnosticAssessment').mockResolvedValue(null);

      const result = await controller.getDiagnosticAssessment(getDiagnosticAssessmentDto, 'some-uuid', Role.Teacher, classInfo);

      expect(result).toBeNull();
      expect(service.getDiagnosticAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getDiagnosticAssessmentDto),
        Role.Teacher,
        expect.objectContaining(classInfo),
        'some-uuid',
      );
    });
  });

  describe('getUnitAssessment', () => {
    const getUnitAssessmentDto = {
      curriculumId: 'math_1',
    };

    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 1,
    };

    const expectedResponse: Assessment = {
      id: 1,
      type: EAssessmentType.UNIT,
      createdAt: new Date(),
      begunAt: new Date(),
      endAt: new Date(new Date().getTime() + 3600 * 1000),
      perfomStatus: StudentAssessmentPerformStatus.BEFORE_START,
    };

    const expectedResult = {
      assessment: {
        id: 1,
        type: EAssessmentType.UNIT,
        begun_at: new Date(),
        created_at: new Date(),
        duration_in_second: 3600,
        learning_map_id: 1,
      },
      status: StudentAssessmentPerformStatus.BEFORE_START,
    };

    it('형성 평가를 조회해야 합니다.', async () => {
      jest.spyOn(service, 'getUnitAssessment').mockResolvedValue(expectedResult);

      const result = await controller.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid');

      expect(result).toEqual(expectedResponse);
      expect(service.getUnitAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getUnitAssessmentDto),
        expect.objectContaining(classInfo),
        Role.Teacher,
        'some-uuid',
      );
    });

    it('학급 정보가 없으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(service, 'getUnitAssessment').mockRejectedValue(new NotFoundException('학급 정보가 없습니다.'));

      await expect(controller.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(service.getUnitAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getUnitAssessmentDto),
        expect.objectContaining(classInfo),
        Role.Teacher,
        'some-uuid',
      );
    });

    it('학습 맵 정보가 없으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(service, 'getUnitAssessment').mockRejectedValue(new NotFoundException('학습 맵 정보가 없습니다.'));

      await expect(controller.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(service.getUnitAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getUnitAssessmentDto),
        expect.objectContaining(classInfo),
        Role.Teacher,
        'some-uuid',
      );
    });

    it('형성 평가가 존재하지 않으면 null을 반환해야 합니다.', async () => {
      jest.spyOn(service, 'getUnitAssessment').mockResolvedValue(null);

      const result = await controller.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid');

      expect(result).toBeNull();
      expect(service.getUnitAssessment).toHaveBeenCalledWith(
        expect.objectContaining(getUnitAssessmentDto),
        expect.objectContaining(classInfo),
        Role.Teacher,
        'some-uuid',
      );
    });
  });

  describe('getComprehensiveAssessment', () => {
    const classInfo: ClassInfo = {
      school_id: '1234567890',
      user_grade: 'A',
      user_class: 'B',
      semester: 2,
    };

    const comprehensiveAssessmentMock = {
      status: StudentAssessmentPerformStatus.BEFORE_START,
      assessment: {
        id: 1,
        type: EAssessmentType.COMPREHENSIVE,
        begun_at: new Date(),
        created_at: new Date(),
        duration_in_second: 3600,
        learning_map_id: 1,
      },
    };

    const expectedResult = {
      begunAt: comprehensiveAssessmentMock.assessment.begun_at,
      createdAt: comprehensiveAssessmentMock.assessment.created_at,
      endAt: new Date(comprehensiveAssessmentMock.assessment.begun_at.getTime() + comprehensiveAssessmentMock.assessment.duration_in_second * 1000),
      id: comprehensiveAssessmentMock.assessment.id,
      type: comprehensiveAssessmentMock.assessment.type,
      perfomStatus: comprehensiveAssessmentMock.status,
    };

    it('총괄 평가를 조회해야 합니다.', async () => {
      jest.spyOn(service, 'getComprehensiveAssessment').mockResolvedValue(comprehensiveAssessmentMock);

      const result = await controller.getComprehensiveAssessment(classInfo, Role.Student, 'some-uuid');

      expect(result).toEqual(expectedResult);
      expect(service.getComprehensiveAssessment).toHaveBeenCalledWith(expect.objectContaining(classInfo), Role.Student, 'some-uuid');
    });

    it('학급 정보가 없으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(service, 'getComprehensiveAssessment').mockRejectedValue(new NotFoundException('학급 정보가 없습니다.'));

      await expect(controller.getComprehensiveAssessment(classInfo, Role.Student, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(service.getComprehensiveAssessment).toHaveBeenCalledWith(expect.objectContaining(classInfo), Role.Student, 'some-uuid');
    });

    it('학습 맵 정보가 없으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(service, 'getComprehensiveAssessment').mockRejectedValue(new NotFoundException('학습 맵 정보가 없습니다.'));

      await expect(controller.getComprehensiveAssessment(classInfo, Role.Student, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(service.getComprehensiveAssessment).toHaveBeenCalledWith(expect.objectContaining(classInfo), Role.Student, 'some-uuid');
    });

    it('총괄 평가가 존재하지 않으면 null을 반환해야 합니다.', async () => {
      jest.spyOn(service, 'getComprehensiveAssessment').mockResolvedValue(null);

      const result = await controller.getComprehensiveAssessment(classInfo, Role.Student, 'some-uuid');

      expect(result).toBeNull();
      expect(service.getComprehensiveAssessment).toHaveBeenCalledWith(expect.objectContaining(classInfo), Role.Student, 'some-uuid');
    });
  });
});
