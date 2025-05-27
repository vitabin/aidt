/* eslint-disable sonarjs/no-duplicate-string */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizeDto, CreateDreamJobDto, GetDreamJobsDto, PostUserStatusDto } from './dto';
import { PrismaService } from 'src/prisma';
import { school_class, user } from '@prisma/client';
import { RespAuthorizeUuidDto } from './dto/';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { Role } from 'src/libs/decorators/role.enum';
import { KerisService } from '../../keris/application/keris.service';
import { convertGradeAndSchoolNameInto12Grade, schoolDivisionFromgrade } from 'src/libs/utils/gradeConverter';
import { CreateDreamJobBulkDto } from './dto/create-dream-job-bulk.dto';
import { AssessmentService } from '../../assessment/application';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kerisService: KerisService,
    private readonly assessmentService: AssessmentService,
  ) {}

  /**
   * 받아온 uuid가 존재하는지 확인하는 내부 함수이다. 존재하지 않으면 BadRequestException을 throw한다.
   * 이 함수는 가장 기초적인 유효성 검사이므로 이 함수를 Authentication 검증용으로 사용하지 마세요.
   * TODO: 이 함수를 조금 더 수정하면 탈퇴한 회원이나, 차단당한 회원을 여기서 걸러내는 등의 검증이 가능하다.
   * @param user_uuid uuid
   * @returns true or throw BadRequestException
   */
  async isUuidValid(user_uuid: string): Promise<user> {
    const user = await this.prisma.user.findUnique({
      where: {
        user_uuid,
      },
    });
    if (!user) {
      throw new BadRequestException('uuid not exists');
    }
    return user;
  }

  /**
   * 학생 희망노트의 장래희망을 추가하는 함수이다.
   * @param dto CreateDreamJobDto
   * @param uuid uuid
   * @returns user_plan_note 객체 하나를 반환한다.
   */
  async createDreamJob(dto: CreateDreamJobDto, uuid: string) {
    await this.isUuidValid(uuid);
    const lastPlanNote = await this.prisma.user_plan_note.findFirst({
      where: {
        user_uuid: uuid,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let jobString = '';
    let reasonString = '';

    if (lastPlanNote) {
      jobString = lastPlanNote?.dream_jobs || '';
      reasonString = lastPlanNote?.dream_reason || '';
    }

    const jobs = jobString.split('|');
    const reasons = reasonString.split('|');
    jobs[dto.index] = dto.job;
    reasons[dto.index] = dto.reason || '';

    return await this.prisma.user_plan_note.create({
      data: {
        user_uuid: uuid,
        dream_jobs: this.processDreamAssociatedString(jobs),
        dream_reason: this.processDreamAssociatedString(reasons),
      },
    });
  }

  /**
   * 학생 희망노트의 장래희망을 한번에 여러개 추가하는 함수이다.
   * @param dto CreateDreamJobDto
   * @param uuid uuid
   * @returns user_plan_note 객체 하나를 반환한다.
   */
  async createDreamJobBulk(dto: CreateDreamJobBulkDto, uuid: string) {
    await this.isUuidValid(uuid);

    const jobs = dto.jobs.split('|');
    if (!jobs[0] || jobs[0].trim() === '') {
      throw new BadRequestException('장래희망 1지망은 반드시 적어주세요.');
    }
    const reasons = (dto.reasons || '').split('|');

    return await this.prisma.user_plan_note.create({
      data: {
        user_uuid: uuid,
        dream_jobs: this.processDreamAssociatedString(jobs),
        dream_reason: this.processDreamAssociatedString(reasons),
      },
    });
  }

  /**
   * dto.jobs 로 받아온 1지망,2지망,3지망을 가공하여 '|'로 join하는 내부 함수이다.
   * @param arr dto.jobs 배열
   * @returns '1지망|2지망|3지망' 형식으로 반환한다.
   */
  private processDreamAssociatedString(arr: string[]): string {
    return arr
      .map((item) => {
        // 원소 내부의 '|' 문자 제거
        let newItem = item.replace(/\|/g, '');
        // 원소가 40글자를 넘으면 자름
        if (newItem.length > 40) {
          newItem = newItem.substring(0, 40);
        }
        return newItem;
      })
      .join('|'); // 처리된 원소들을 '|'로 join
  }

  /**
   * 유저가 소단원 학습을 시작하려면, 학력진단평가를 완료해야만한다.
   * 이게 완료되었는지 확인하는 함수이다.
   * @param uuid uuid
   */
  async canUserStartStudy(classInfo: ClassInfo, uuid: string) {
    const user = await this.isUuidValid(uuid);
    return await this.assessmentService.diagnosticAssessmentDone(classInfo, user.user_uuid);
  }

  /**
   * 학생 희망노트의 장래희망을 조회하는 함수이다.
   * @param dto GetDreamJobsDto
   * @param uuid uuid
   * @returns user_plan_note 객체들을 배열로 반환한다.
   */
  async getDreamJobs(dto: GetDreamJobsDto, uuid: string) {
    await this.isUuidValid(uuid);
    const take = dto.take;
    return await this.prisma.user_plan_note.findMany({
      where: {
        user_uuid: uuid,
      },
      orderBy: {
        created_at: 'desc',
      },
      take,
    });
  }

  async authorizeMemberUuid(user_uuid: string, role: Role, classInfo: ClassInfo, dto: AuthorizeDto): Promise<RespAuthorizeUuidDto> {
    // 먼저 학급이 존재하는지 확인합니다.

    const school_class = await this.prisma.school_class.findFirst({
      where: {
        grade: classInfo.user_grade,
        school: {
          school_id: classInfo.school_id,
        },
        class: classInfo.user_class,
      },
    });

    if (!school_class) {
      // 학급이 존재하지 않는데 학생이 로그인 한 경우 에러 코드를 던집니다.
      // 그게 아니라 교사가 로그인 한 경우 Keris API를 통해 학급 정보를 얻어와 학급을 생성합니다.
      if (role === Role.Teacher) {
        await this.constructSchoolAndClass(classInfo, dto);
      } else {
        throw new NotFoundException('생성된 학급 정보가 없습니다.');
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        user_uuid,
      },
    });

    // 기존 존재 선생님 로그인
    if (role === Role.Teacher && existingUser) {
      if (existingUser.learning_map_id === null) throw new NotFoundException('선생님의 learning_map_id가 없습니다.');
      const currentTeacherLearningMap = await this.prisma.learning_map.findFirst({
        where: {
          id: existingUser.learning_map_id,
        },
      });
      if (!currentTeacherLearningMap) throw new NotFoundException('해당 학습 맵을 찾을 수 없습니다.');
      return {
        created: false,
        user: existingUser,
        learning_map: currentTeacherLearningMap,
      };
    }

    //기존에 미존재
    if (!existingUser) {
      const learningMap = await this.prisma.learning_map.findFirst({
        where: {
          school_class: {
            some: {
              school: {
                school_id: classInfo.school_id,
              },
              class: classInfo.user_class,
              grade: classInfo.user_grade,
            },
          },
        },
        select: {
          id: true,
          learning_map_node: true,
        },
      });

      if (!learningMap) {
        throw new NotFoundException(
          `${classInfo.school_id}, ${classInfo.user_grade}학년 ${classInfo.user_class}반 ${classInfo.semester}학기에 적용할 수 있는 학습맵이 없습니다.`,
        );
      }

      const firstLearningMapNode = learningMap.learning_map_node.find((node) => {
        return node.link_prev === null;
      });

      if (!firstLearningMapNode) {
        throw new NotFoundException(
          `${classInfo.school_id}, ${classInfo.user_grade}학년 ${classInfo.user_class}반 ${classInfo.semester}학기,${learningMap.id} 학습맵에 선행 노드가 존재하지 않는(첫 번째) 노드가 없습니다.`,
        );
      }
      const newUser = await this.prisma.user.create({
        data: {
          user_uuid,
          learning_map_id: learningMap.id,
          current_learning_node_id: firstLearningMapNode.id,
        },
      });
      const currentLearningMap = await this.prisma.learning_map.findFirst({
        where: {
          id: learningMap.id,
        },
      });
      if (!currentLearningMap) throw new NotFoundException('해당 학습 맵을 찾을 수 없습니다.');
      return {
        created: true,
        user: newUser,
        learning_map: currentLearningMap,
      };
    } else {
      if (existingUser.learning_map_id === null) throw new NotFoundException('유저의 learning_map_id가 없습니다.');
      const currentLearningMap = await this.prisma.learning_map.findFirst({
        where: {
          id: existingUser.learning_map_id,
        },
      });
      if (!currentLearningMap) throw new NotFoundException('해당 학습 맵을 찾을 수 없습니다.');
      return {
        created: false,
        user: existingUser,
        learning_map: currentLearningMap,
      };
    }
  }
  async constructSchoolAndClass(classInfo: ClassInfo, dto: AuthorizeDto) {
    // const classList = await this.kerisService.getClassInfo(accessToken, user_uuid, partnerId);
    // if (!classList.classInfos || classList.classInfos.length === 0) {
    //   throw new NotFoundException('교사의 학급 목록이 없습니다.');
    // }

    // const classSchedule = await this.kerisService.getClassSchedule(accessToken, user_uuid, partnerId);

    // if (classSchedule.schedule_infos.length === 0) {
    //   throw new NotFoundException('교사에게 할당된 수업시간표가 없습니다.');
    // }

    if (!dto.schedule_info || dto.schedule_info.length === 0 || !dto.school_name || !dto.semester) {
      throw new BadRequestException('교사가 보내야하는 필수 정보가 없습니다.');
    }
    // 2024기준 2025년 learning_map이 존재하지 않기때문
    const currentYear = new Date().getFullYear() === 2024 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const properLearningMap = await this.prisma.learning_map.findFirst({
      where: {
        semester: {
          grade: classInfo.user_grade,
          year: currentYear.toString(),
          semester: dto.semester.toString(), //new Date().getMonth() >= 8 ? '2' : '1',
        },
      },
    });

    //learning map이 존재하지 않으면
    if (!properLearningMap) {
      throw new NotFoundException(
        `${currentYear}년도 ${classInfo.user_grade}학년 ${dto.semester}학기 ${classInfo.user_class}반에 해당하는 학습맵이 DB에 없습니다.`,
      );
    }

    const existingSchool = await this.prisma.school.findFirst({
      where: {
        school_id: classInfo.school_id,
      },
    });

    const schoolClassList: school_class[] = [];
    const gradeNum = dto.schedule_info[0].classroom_name.split('학년')[0]; //고등학교 1학년, 중학교 1학년 등. 9학년 10학년 이런식으로 표기된 학년이 아님!
    // 학교, 학급을 생성합니다.
    await this.prisma.$transaction(async (tx) => {
      if (!existingSchool) {
        const result = await tx.school.create({
          data: {
            school_id: classInfo.school_id,
            school_name: dto.school_name, //classList.classInfos![0].school_name,
            division_type: schoolDivisionFromgrade(convertGradeAndSchoolNameInto12Grade(parseInt(gradeNum), dto.school_name || '')).toString(),
            school_class: {
              createMany: {
                data: (dto.schedule_info || []).map((classInfo) => {
                  //classInfo.classroom_name = "X학년 X반 교실"
                  const gradeNum = classInfo.classroom_name.split('학년')[0];
                  const classNum = classInfo.classroom_name.split('학년 ')[1].split('반')[0];
                  return {
                    class: classNum,
                    grade: convertGradeAndSchoolNameInto12Grade(parseInt(gradeNum), dto.school_name || '').toString(),
                    learning_map_id: properLearningMap.id,
                  };
                }),
                skipDuplicates: true,
              },
            },
          },
          select: {
            school_class: true,
          },
        });

        schoolClassList.push(...result.school_class);
      } else {
        await tx.school_class.createMany({
          data: (dto.schedule_info || []).map((classInfo) => {
            //classInfo.classroom_name = "X학년 X반 교실"
            const gradeNum = classInfo.classroom_name.split('학년')[0];
            const classNum = classInfo.classroom_name.split('학년 ')[1].split('반')[0];
            return {
              class: classNum,
              grade: convertGradeAndSchoolNameInto12Grade(parseInt(gradeNum), dto.school_name || '').toString(),
              learning_map_id: properLearningMap.id,
              school_id: existingSchool.id,
            };
          }),
          skipDuplicates: true,
        });
        schoolClassList.push(...(await tx.school_class.findMany({ where: { school_id: existingSchool.id } })));
      }

      //학급 스케쥴을 생성합니다.
      for (const schedule of dto.schedule_info || []) {
        const grade = schedule.classroom_name.split('학년')[0];
        const classNum = schedule.classroom_name.split('학년 ')[1].split('반')[0];
        //const className = classInfo.classroom_name;

        // const respectiveSchedule = classSchedule.schedule_infos.find((schedule) => {
        //   extractedInfo = extractInfoFromKerisClassroomName(schedule.classroom_name);
        //   return (
        //     schedule.school_name === classInfo.school_name &&
        //     extractedInfo.className === classInfo.user_class &&
        //     convertGradeAndSchoolNameInto12Grade(extractedInfo.grade, schedule.school_name) === parseInt(classInfo.user_grade)
        //   );
        // });
        const schoolClass = schoolClassList.find((schoolClass) => {
          return (
            schoolClass.class === classNum && parseInt(schoolClass.grade!) === convertGradeAndSchoolNameInto12Grade(parseInt(grade), dto.school_name || '')
          );
        });
        await tx.class_schedule.create({
          data: {
            class_id: schoolClass!.id,
            class_period: schedule.class_period.toString(),
            classroom_name: schedule.classroom_name,
            subject_name: schedule.subject_name,
            day_week: schedule.day_week,
          },
        });
      }
    });
  }

  async getDreamJobsAccumulated(uuid: string) {
    const result = await this.prisma.user_plan_note.findMany({
      where: {
        user_uuid: uuid,
      },
      select: {
        dream_jobs: true,
      },
    });

    const jobCountPair: { [key: string]: number } = {};
    for (let i = 0; i < result.length; i++) {
      const dreamJobsString = result[i].dream_jobs;
      if (dreamJobsString) {
        const dreamJobs = dreamJobsString.split('|');
        for (let j = 0; j < dreamJobs.length; j++) {
          if (dreamJobs[j]) {
            jobCountPair[dreamJobs[j]] = (jobCountPair[dreamJobs[j]] || 0) + 1;
          }
        }
      }
    }

    const sortedEntries = Object.entries(jobCountPair)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return Object.fromEntries(sortedEntries);
  }

  async updateUserStatus(uuid: string, dto: PostUserStatusDto) {
    return await this.prisma.user_status.create({
      data: {
        mental_state: dto.mentalState,
        user_uuid: uuid,
        physical_state: dto.physicalState,
        status_message: dto.statusMessage,
      },
    });
  }

  async getSemesterId(uuid: string) {
    const currentUser = await this.isUuidValid(uuid);
    if (!currentUser) throw new BadRequestException('getSemesterId : uuid not exists');
    if (!currentUser.learning_map_id) throw new BadRequestException('getSemesterId : User`s learning map id not exists');

    const learningMap = await this.prisma.learning_map.findFirst({
      where: {
        id: currentUser.learning_map_id,
      },
    });
    if (!learningMap) throw new BadRequestException('getSemesterId : learning map not exists');

    return learningMap.semester_id;
  }

  async getRecentUserStatus(uuid: string) {
    const res = await this.prisma.user_status.findMany({
      where: {
        user_uuid: uuid,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 3,
    });

    if (res.length === 0) return null;

    const myDreamsDto = new GetDreamJobsDto();
    myDreamsDto.take = 3;
    const myDreams = await this.getDreamJobs(myDreamsDto, uuid);

    return {
      statusMessage: res[0].status_message,
      physicalStates: res.map((item) => item.physical_state),
      mentalStates: res.map((item) => item.mental_state),
      dreamJobs: myDreams,
    };
  }
}
