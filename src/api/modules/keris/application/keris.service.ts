import { Injectable } from '@nestjs/common';
import { AccessToken } from '../../transfer/infrastructure';
import { Role } from 'src/libs/decorators/role.enum';
import { ConfigService } from '@nestjs/config';
import { ClassList, ClassSchedules, StudentInfo, TeacherInfo } from '../infrastructure/entity';

@Injectable()
export class KerisService {
  constructor(private readonly configService: ConfigService) {}
  async getUserInfo(accessToken: AccessToken, role: Role, userId: string): Promise<StudentInfo | TeacherInfo> {
    if (role === Role.Parent) {
      throw Error('학부모는 불가능합니다.');
    }

    const res = await fetch(this.configService.get('KERIS_API_HOST') + (role === Role.Student ? 'aidt_userinfo/student/all' : 'aidt_userinfo/teacher/all'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        user_id: userId,
      }),
    });

    const body = await res.json();

    return role === Role.Student
      ? {
          userName: body.user_name,
          schoolName: body.school_name,
          schoolId: body.school_id,
          userDivision: body.user_division,
          userGrade: body.user_grade,
          userClass: body.user_class,
          userNumber: body.user_number,
          userGender: body.user_gender,
        }
      : {
          userName: body.user_name,
          schoolName: body.school_name,
          schoolId: body.school_id,
        };
  }

  async sendScoreForCurriculum(curriculumId: string, accessToken: AccessToken, userId: string, score: number, partnerId: string) {
    await fetch(this.configService.get('KERIS_API_HOST') + 'aidt_dashboard/curriculum_score', {
      headers: {
        'Partner-ID': partnerId,
      },
      body: JSON.stringify({
        access_token: accessToken,
        user_id: userId,
        curriculum: curriculumId,
        score,
        timestamp: new Date().toLocaleString('ko-KR'),
      }),
      method: 'POST',
    });
  }

  async getClassInfo(accessToken: AccessToken, userId: string, partnerId: string): Promise<ClassList> {
    const payload = {
      access_token: accessToken,
      user_id: userId,
    };
    const res = await fetch(this.configService.get('KERIS_API_HOST') + '/aidt_userinfo/teacher/class_list', {
      method: 'POST',
      headers: {
        'Partner-ID': partnerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();

    return ClassList.fromJSON(body);
  }

  async getClassSchedule(accessToken: AccessToken, user_uuid: string, partnerId: string): Promise<ClassSchedules> {
    const res = await fetch(this.configService.get('KERIS_API_HOST') + '/aidt_userinfo/teacher/schedule', {
      method: 'POST',
      headers: {
        'Partner-ID': partnerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        user_id: user_uuid,
      }),
    });

    const body = await res.json();

    return ClassSchedules.fromJSON(body);
  }
}
