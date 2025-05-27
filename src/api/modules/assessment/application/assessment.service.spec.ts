import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentService, DiagnosticReturnType } from './assessment.service';
import { PrismaService } from 'src/prisma';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import {
  AnswerType,
  AssessmentType,
  ContentStatus,
  Difficulty,
  ProblemType,
  UnitType,
  assessment,
  learning_map,
  learning_sys,
  problem,
  school_class,
} from '@prisma/client';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Role } from 'src/libs/decorators/role.enum';
import { CreateDiagnosticAssessmentDto, CreateComprehensiveAssessmentDto, CreateUnitAssessmentDto, GetDiagnosticAssessmentDto } from './dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { StudentAssessmentPerformStatus } from '../infrastructure/assessment.entity';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let prismaService: DeepMockProxy<PrismaService>;
  const noClassException = '학급이 조회되지 않으면 예외를 던집니다.';
  const noLearningMapException = '학습맵이 발견되지 않으면 예외를 던집니다.';
  const dto: CreateDiagnosticAssessmentDto = {
    durationInSecond: 60,
    beginAt: new Date(),
  };

  const classInfo: ClassInfo = {
    user_grade: '1',
    user_class: '1',
    school_id: '1',
    semester: 1,
  };

  const schoolClassMock: school_class = {
    class: '1',
    created_at: new Date(),
    grade: '1',
    id: 1,
    school_id: 1,
    learning_map_id: 1,
  };

  const learningMapMock: learning_map = {
    id: 1,
    created_at: new Date(),
    desc: '',
    learning_sys_doc_id: 1,
    name: 'sdfsd',
    semester_id: 1,
    subject: 'sdfsd',
  };

  const problemsMock: problem[] = [
    {
      id: 1,
      target_grade: 1,
      target_semester: 1,
      type: ProblemType.DIAGNOSTIC,
      answer_data: 'null',
      cls_id: '2134',
      created_at: new Date(),
      deleted_at: null,
      difficulty: Difficulty.HIGH,
      latex_data: 'sdfasdf',
      ai_hint: 'asdfasdf',
      detail_solution: 'asdfasdf',
      explanation: 'asdfasdf',
      answer_type: AnswerType.MULTISELECT,
      content_status: ContentStatus.ACTIVED,
      is_algeomath: true,
      is_ebs: true,
      manage_no: '1',
      updated_at: new Date(),
    },
    {
      id: 2,
      target_grade: 1,
      target_semester: 1,
      type: ProblemType.DIAGNOSTIC,
      answer_data: 'null',
      cls_id: '2134',
      created_at: new Date(),
      deleted_at: null,
      difficulty: Difficulty.HIGH,
      latex_data: 'sdfasdf',
      ai_hint: 'asdfasdf',
      detail_solution: 'asdfasdf',
      explanation: 'asdfasdf',
      answer_type: AnswerType.MULTISELECT,
      content_status: ContentStatus.ACTIVED,
      is_algeomath: true,
      is_ebs: true,
      manage_no: '2',
      updated_at: new Date(),
    },
  ];

  const assessmentMock: assessment = {
    id: 1,
    type: AssessmentType.DIAGNOSTIC,
    created_at: new Date(),
    begun_at: new Date(),
    duration_in_second: 60 * 60,
    learning_map_id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockDeep<Cache>(),
        },
      ],
    }).compile();

    service = module.get(AssessmentService);
    prismaService = module.get(PrismaService);
  });

  describe('createDiagnosisAssessment', () => {
    it('진단평가를 생성해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.problem.findMany.mockResolvedValue(problemsMock);
      prismaService.$transaction.mockResolvedValue(assessmentMock);

      await service.createAssessment(dto, classInfo);

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.learning_map.findFirst).toHaveBeenCalledWith({
        where: {
          semester: {
            grade: schoolClassMock.grade,
            semester: classInfo.semester.toString(),
          },
          school_class: {
            some: {
              id: schoolClassMock.id,
            },
          },
        },
      });

      expect(prismaService.problem.findMany).toHaveBeenCalledWith({
        where: {
          target_grade: parseInt(schoolClassMock.grade!),
          target_semester: classInfo.semester,
          type: ProblemType.DIAGNOSTIC,
        },
        take: 20,
      });

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.createAssessment(dto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it(noLearningMapException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(null);

      await expect(service.createAssessment(dto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
    });
  });

  describe('createUnitAssessment', () => {
    const unitDto: CreateUnitAssessmentDto = {
      curriculumId: 'math_1',
      durationInSecond: 3600,
    };

    const unitProblemsMock = [
      {
        id: 1,
        target_grade: 1,
        target_semester: 1,
        type: ProblemType.UNIT_END,
        answer_data: 'null',
        cls_id: '2134',
        created_at: new Date(),
        deleted_at: null,
        difficulty: Difficulty.HIGH,
        latex_data: 'sdfasdf',
        ai_hint: 'asdfasdf',
        detail_solution: 'asdfasdf',
        explanation: 'asdfasdf',
        answer_type: AnswerType.MULTISELECT,
        content_status: ContentStatus.ACTIVED,
        is_algeomath: true,
        is_ebs: true,
        manage_no: '2',
        updated_at: new Date(),
      },
    ];

    const unitAssessmentMock = {
      id: 1,
      type: AssessmentType.UNIT,
      created_at: new Date(),
      begun_at: new Date(),
      duration_in_second: 3600,
      learning_map_id: 1,
    };

    it('대단원 평가를 생성해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.problem.findMany.mockResolvedValue(unitProblemsMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.$transaction.mockResolvedValue(unitAssessmentMock);

      await service.createUnitAssessment(unitDto, classInfo);

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.problem.findMany).toHaveBeenCalledWith({
        where: {
          type: ProblemType.UNIT_END,
          cls_id: {
            startsWith: unitDto.curriculumId,
          },
        },
        take: 20,
      });

      expect(prismaService.learning_map.findFirst).toHaveBeenCalledWith({
        where: {
          school_class: {
            some: {
              id: schoolClassMock.id,
            },
          },
        },
      });

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.createUnitAssessment(unitDto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it(noLearningMapException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.problem.findMany.mockResolvedValue([]);
      prismaService.learning_map.findFirst.mockResolvedValue(null);

      await expect(service.createUnitAssessment(unitDto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.problem.findMany).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
    });
  });

  describe('createComprehensiveAssessment', () => {
    const comprehensiveDto: CreateComprehensiveAssessmentDto = {
      durationInSecond: 3600,
    };

    const comprehensiveProblemsMock = [
      {
        id: 1,
        target_grade: 1,
        target_semester: 1,
        type: ProblemType.COMPREHENSIVE,
        answer_data: 'null',
        cls_id: '2134',
        created_at: new Date(),
        deleted_at: null,
        difficulty: Difficulty.HIGH,
        latex_data: 'sdfasdf',
        ai_hint: 'asdfasdf',
        detail_solution: 'asdfasdf',
        explanation: 'asdfasdf',
        answer_type: AnswerType.MULTISELECT,
        content_status: ContentStatus.ACTIVED,
        is_algeomath: true,
        is_ebs: true,
        manage_no: '2',
        updated_at: new Date(),
      },
    ];

    const comprehensiveAssessmentMock = {
      id: 1,
      type: AssessmentType.COMPREHENSIVE,
      created_at: new Date(),
      begun_at: new Date(),
      duration_in_second: 3600,
      learning_map_id: 1,
    };

    const correspondingCurriculumIdsMock: learning_sys[] = [
      {
        id: 111,
        learning_sys_doc_id: 1,
        cls_id: '1234123',
        deleted_at: null,
        created_at: new Date(),
        type: UnitType.CHAPTER,
        name: 'name',
        full_name: 'full_name',
        index: 1,
        achievement_desc: 'achievement_desc',
        achievement_id: 'achievement_id',
        parent_id: 112,
        is_deleted: false,
        updated_at: new Date(),
        pre_learning_map_id: 1,
        grade: 1,
        semester: 1,
      },

      {
        id: 112,
        learning_sys_doc_id: 1,
        cls_id: '1234123',
        deleted_at: null,
        created_at: new Date(),
        type: UnitType.CHAPTER,
        name: 'name',
        full_name: 'full_name',
        index: 1,
        achievement_desc: 'achievement_desc',
        achievement_id: 'achievement_id',
        parent_id: 112,
        is_deleted: false,
        updated_at: new Date(),
        pre_learning_map_id: 1,
        grade: 1,
        semester: 1,
      },

      {
        id: 113,
        learning_sys_doc_id: 1,
        cls_id: '1234123',
        deleted_at: null,
        created_at: new Date(),
        type: UnitType.CHAPTER,
        name: 'name',
        full_name: 'full_name',
        index: 1,
        achievement_desc: 'achievement_desc',
        achievement_id: 'achievement_id',
        parent_id: 112,
        is_deleted: false,
        updated_at: new Date(),
        pre_learning_map_id: 1,
        grade: 1,
        semester: 1,
      },
    ];

    it('총괄 평가를 생성해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.problem.findMany.mockResolvedValue(comprehensiveProblemsMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.learning_sys.findMany.mockResolvedValue(correspondingCurriculumIdsMock);
      prismaService.$transaction.mockResolvedValue(comprehensiveAssessmentMock);

      await service.createComprehensiveAssessment(comprehensiveDto, classInfo);

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.problem.findMany).toHaveBeenCalledWith({
        where: {
          target_grade: parseInt(schoolClassMock.grade!),
          target_semester: classInfo.semester,
          type: ProblemType.COMPREHENSIVE,
          cls_id: {
            in: expect.any(Array),
          },
        },
        take: 20,
      });

      expect(prismaService.learning_map.findFirst).toHaveBeenCalledWith({
        where: {
          semester: {
            grade: schoolClassMock.grade,
            semester: classInfo.semester.toString(),
          },
          school_class: {
            some: {
              id: schoolClassMock.id,
            },
          },
        },
      });

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.createComprehensiveAssessment(comprehensiveDto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it(noLearningMapException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(null);

      await expect(service.createComprehensiveAssessment(comprehensiveDto, classInfo)).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
    });
  });

  describe('startDiagnosticAssessment', () => {
    const id = 1;

    it('진단평가를 시작해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.assessment.findFirst.mockResolvedValue({ ...assessmentMock, begun_at: null });
      prismaService.assessment.update.mockResolvedValue({ ...assessmentMock, begun_at: new Date() });

      const result = await service.startDiagnosticAssessment(id, classInfo);

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.assessment.findFirst).toHaveBeenCalledWith({
        where: {
          id: id,
          type: AssessmentType.DIAGNOSTIC,
          learning_map_id: schoolClassMock.learning_map_id,
        },
      });

      expect(prismaService.assessment.update).toHaveBeenCalledWith({
        where: { id: id },
        data: { begun_at: expect.any(Date) },
      });

      expect(result).toEqual({ ...assessmentMock, begun_at: expect.any(Date) });
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.startDiagnosticAssessment(id, classInfo)).rejects.toThrow(new HttpException('학급 정보가 없습니다.', 404));

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it('존재하지 않는 진단평가에 대해서는 예외를 던져야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.assessment.findFirst.mockResolvedValue(null);

      await expect(service.startDiagnosticAssessment(id, classInfo)).rejects.toThrow(
        new HttpException('해당 학급에서 출제된 ${id}에 해당하는 진단평가가 존재하지 않습니다.', 404),
      );

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.assessment.findFirst).toHaveBeenCalled();
    });

    it('이미 시작된 진단평가에 대해서는 예외를 던져야 합니다.', async () => {
      const begunAssessmentMock = { ...assessmentMock, begun_at: new Date() };

      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.assessment.findFirst.mockResolvedValue(begunAssessmentMock);

      await expect(service.startDiagnosticAssessment(id, classInfo)).rejects.toThrow(new HttpException('이미 시작된 진단평가입니다.', HttpStatus.CONFLICT));

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.assessment.findFirst).toHaveBeenCalled();
    });
  });

  describe('getDiagnosticAssessment', () => {
    const getDiagnosticAssessmentDto: GetDiagnosticAssessmentDto = {
      containingProblemsPreview: true,
    };

    it('진단평가를 조회해야 합니다.', async () => {
      const mockResult: DiagnosticReturnType = {
        assessment: {
          begun_at: new Date(),
          duration_in_second: 3600,
          created_at: new Date(),
          id: 1,
          type: AssessmentType.DIAGNOSTIC,
          assessment_problem: [
            {
              id: 1,
              assessment_id: 1,
              created_at: new Date(),
              problem_id: 1,
              problem: {
                id: 1,
                ai_hint: '',
                answer_data: '',
                cls_id: '',
                created_at: new Date(),
                deleted_at: null,
                detail_solution: '',
                difficulty: Difficulty.HIGH,
                explanation: '',
                latex_data: '',
                target_grade: 1,
                target_semester: 1,
                type: ProblemType.DIAGNOSTIC,
                answer_type: AnswerType.SELECT,
                content_status: ContentStatus.ACTIVED,
                updated_at: new Date(),
                is_algeomath: true,
                is_ebs: true,
                manage_no: '1',
              },
            },
            {
              id: 2,
              assessment_id: 1,
              created_at: new Date(),
              problem_id: 2,
              problem: {
                id: 2,
                ai_hint: '',
                answer_data: '',
                cls_id: '',
                created_at: new Date(),
                deleted_at: null,
                detail_solution: '',
                difficulty: Difficulty.HIGH,
                explanation: '',
                latex_data: '',
                target_grade: 1,
                target_semester: 1,
                type: ProblemType.DIAGNOSTIC,
                answer_type: AnswerType.SELECT,
                content_status: ContentStatus.ACTIVED,
                updated_at: new Date(),
                is_algeomath: true,
                is_ebs: true,
                manage_no: '2',
              },
            },
          ],
        },
        status: undefined,
      };

      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue({
        ...mockResult.assessment,
        learning_map_id: learningMapMock.id,
        duration_in_second: 3600,
      });

      const result = await service.getDiagnosticAssessment(getDiagnosticAssessmentDto, Role.Teacher, classInfo, 'some-uuid');

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.learning_map.findFirst).toHaveBeenCalledWith({
        where: {
          semester: {
            grade: schoolClassMock.grade!,
            semester: classInfo.semester.toString(),
          },
          school_class: {
            some: {
              id: schoolClassMock.id,
            },
          },
        },
      });

      expect(prismaService.assessment.findFirst).toHaveBeenCalledWith({
        where: {
          type: AssessmentType.DIAGNOSTIC,
          learning_map_id: learningMapMock.id,
          assessment_class: {
            some: {
              school_class_id: schoolClassMock.id,
            },
          },
        },
        include: {
          assessment_problem: {
            include: {
              problem: true,
            },
            select: {
              id: true,
            },
          },
        },
      });

      expect(result).toEqual({ ...mockResult, assessment: { ...mockResult.assessment, duration_in_second: 3600, learning_map_id: learningMapMock.id } });
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.getDiagnosticAssessment(getDiagnosticAssessmentDto, Role.Teacher, classInfo, 'some-uuid')).rejects.toThrow(
        new NotFoundException('학급 정보가 없습니다.'),
      );

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it(noLearningMapException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(null);

      await expect(service.getDiagnosticAssessment(getDiagnosticAssessmentDto, Role.Teacher, classInfo, 'some-uuid')).rejects.toThrow(
        new NotFoundException('해당 학급 해당 학기에 해당하는 학습맵이 DB에 없습니다.'),
      );

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
    });

    it('진단평가가 존재하지 않으면 null을 반환해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(null);

      const result = await service.getDiagnosticAssessment(getDiagnosticAssessmentDto, Role.Teacher, classInfo, 'some-uuid');

      expect(result).toBeNull();

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
      expect(prismaService.assessment.findFirst).toHaveBeenCalled();
    });

    it('교사가 아니거나 문제가 포함되지 않은 경우 문제를 포함하지 않은 진단평가를 조회해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(assessmentMock);

      const result = await service.getDiagnosticAssessment(
        { ...getDiagnosticAssessmentDto, containingProblemsPreview: false },
        Role.Student,
        classInfo,
        'some-uuid',
      );

      expect(prismaService.assessment.findFirst).toHaveBeenCalledWith({
        where: {
          type: AssessmentType.DIAGNOSTIC,
          learning_map_id: learningMapMock.id,
          assessment_class: {
            some: {
              school_class_id: schoolClassMock.id,
            },
          },
        },
        include: undefined,
      });

      expect(result).toEqual({
        assessment: assessmentMock,
        status: StudentAssessmentPerformStatus.BEFORE_START,
      });
    });
  });

  describe('getUnitAssessment', () => {
    const getUnitAssessmentDto = {
      curriculumId: 'math_1',
    };

    const unitAssessmentMock = {
      id: 1,
      type: AssessmentType.UNIT,
      created_at: new Date(),
      begun_at: new Date(),
      duration_in_second: 3600,
      learning_map_id: 1,
    };

    it('대단원 평가를 조회해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(unitAssessmentMock);

      const result = await service.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid');

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.assessment.findFirst).toHaveBeenCalledWith({
        where: {
          type: AssessmentType.UNIT,
          assessment_problem: {
            every: {
              problem: {
                cls_id: {
                  startsWith: getUnitAssessmentDto.curriculumId,
                },
              },
            },
          },
          assessment_class: {
            some: {
              school_class_id: schoolClassMock.id,
            },
          },
        },
      });

      expect(result).toEqual({
        assessment: unitAssessmentMock,
        status: undefined,
      });
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it('대단원 평가가 존재하지 않으면 null을 반환해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(null);

      const result = await service.getUnitAssessment(getUnitAssessmentDto, classInfo, Role.Teacher, 'some-uuid');

      expect(result).toBeNull();

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.assessment.findFirst).toHaveBeenCalled();
    });
  });

  describe('getComprehensiveAssessment', () => {
    const comprehensiveAssessmentMock = {
      id: 1,
      type: AssessmentType.COMPREHENSIVE,
      created_at: new Date(),
      begun_at: new Date(),
      duration_in_second: 3600,
      learning_map_id: 1,
    };

    it('총괄 평가를 조회해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(comprehensiveAssessmentMock);

      const result = await service.getComprehensiveAssessment(classInfo, Role.Teacher, 'some-uuid');

      expect(prismaService.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });

      expect(prismaService.learning_map.findFirst).toHaveBeenCalledWith({
        where: {
          semester: {
            grade: schoolClassMock.grade!,
            semester: classInfo.semester.toString(),
          },
          school_class: {
            some: {
              id: schoolClassMock.id,
            },
          },
        },
      });

      expect(prismaService.assessment.findFirst).toHaveBeenCalledWith({
        where: {
          type: AssessmentType.COMPREHENSIVE,
          learning_map_id: learningMapMock.id,
          assessment_class: {
            some: {
              school_class_id: schoolClassMock.id,
            },
          },
        },
      });

      expect(result).toEqual({
        assessment: comprehensiveAssessmentMock,
        status: undefined,
      });
    });

    it(noClassException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.getComprehensiveAssessment(classInfo, Role.Teacher, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
    });

    it(noLearningMapException, async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(null);

      await expect(service.getComprehensiveAssessment(classInfo, Role.Teacher, 'some-uuid')).rejects.toThrow(NotFoundException);

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
    });

    it('총괄 평가가 존재하지 않으면 null을 반환해야 합니다.', async () => {
      prismaService.school_class.findFirst.mockResolvedValue(schoolClassMock);
      prismaService.learning_map.findFirst.mockResolvedValue(learningMapMock);
      prismaService.assessment.findFirst.mockResolvedValue(null);

      const result = await service.getComprehensiveAssessment(classInfo, Role.Teacher, 'some-uuid');

      expect(result).toBeNull();

      expect(prismaService.school_class.findFirst).toHaveBeenCalled();
      expect(prismaService.learning_map.findFirst).toHaveBeenCalled();
      expect(prismaService.assessment.findFirst).toHaveBeenCalled();
    });
  });
});
