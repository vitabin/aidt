import { BadRequestException, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { convertGrade, SchoolDivision } from '../utils/gradeConverter';

export const schoolClassOfStudentHeaderKey = 'Class-Info';

export const SchoolClassHeader = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const classInfoString = request.headers[schoolClassOfStudentHeaderKey.toLowerCase()];
  const regex = /\b[A-Za-z]-\d{1,2}-\d{1,2}\b/;
  const host = request.headers.host === 'localhost:3000' ? 'm-1-1.dev-matu.site' : request.headers.host;
  const matchedHost = host.match(regex);
  if (!matchedHost) {
    throw new BadRequestException(`Host ${host} is not valid!`);
  }
  const subDomain = matchedHost[0];
  const schoolType = subDomain.split('-')[0];
  const grade = subDomain.split('-')[1];
  const semester = subDomain.split('-')[2];
  if (!classInfoString) {
    throw new BadRequestException('Class-Info header is missing. It should be <school_id>-<user_grade>-<user_class>');
  }
  const split = classInfoString.split('-');

  if (split.length !== 3) {
    throw new BadRequestException('Class-Info header is invalid. It should be <school_id>-<user_grade>-<user_class>');
  }

  if (process.env.NODE_ENV === 'production' && split[1] !== grade) {
    throw new BadRequestException('grade data in Class-Info header and subdomain do not match.');
  }

  return {
    school_id: split[0],
    user_grade: convertGrade(parseInt(split[1]), subdomainParticleToDivision(schoolType)).toString(),
    user_class: split[2],
    semester: parseInt(semester),
  };
});

export const classInfoHeaderDesc = {
  name: schoolClassOfStudentHeaderKey,
  description:
    '[공공API] 학급 정보를 주시면 됩니다. 학생이라면 /aidt_userinfo/student/all, 교사라면 /aidt_userinfo/teacher/all 을 호출하셔서 <school_id>-<user_grade>-<user_class> 형태로 주시면 됩니다.\n교사인 경우에는 현재 조회하려는 학급의 정보만 선택하여 주시기 바랍니다.',
  required: true,
  schema: {
    example: 'K100000383-2-3',
  },
};

function subdomainParticleToDivision(particle: string): SchoolDivision {
  if (particle === 'e') {
    return SchoolDivision.ELEMENTARY;
  } else if (particle === 'm') {
    return SchoolDivision.MIDDLE;
  } else if (particle === 'h') {
    return SchoolDivision.HIGH;
  } else {
    throw new Error('unknown school type');
  }
}
