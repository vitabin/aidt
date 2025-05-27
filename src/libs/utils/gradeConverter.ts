export enum SchoolDivision {
  ELEMENTARY = 2,
  MIDDLE = 3,
  HIGH = 4,
}

export function schoolDivisionFromgrade(grade: number): SchoolDivision {
  if (grade < 6) {
    return SchoolDivision.ELEMENTARY;
  } else if (grade < 9) {
    return SchoolDivision.MIDDLE;
  } else {
    return SchoolDivision.HIGH;
  }
}

export function convertGrade(grade: number, schoolType: SchoolDivision): number {
  if (schoolType === SchoolDivision.ELEMENTARY) {
    return grade;
  } else if (schoolType === SchoolDivision.MIDDLE) {
    return grade + 6;
  } else if (schoolType === SchoolDivision.HIGH) {
    return grade + 9;
  } else {
    throw new Error('unknown school type');
  }
}

export function extractInfoFromKerisClassroomName(input: string): {
  grade: number;
  className: string;
} {
  const regex = /^(\d+)학년 (\d+)반 교실$/;
  const match = input.match(regex);

  if (match) {
    const grade = parseInt(match[1], 10); // N as number
    const className = match[2]; // M as string
    return { grade, className };
  } else {
    throw new Error('String format is incorrect');
  }
}

export function convertGradeAndSchoolNameInto12Grade(grade: number, schoolName: string): number {
  let schoolDivision = SchoolDivision.ELEMENTARY;
  if (schoolName.includes('중학교')) {
    schoolDivision = SchoolDivision.MIDDLE;
  } else if (schoolName.includes('고등학교')) {
    schoolDivision = SchoolDivision.HIGH;
  }

  return convertGrade(grade, schoolDivision);
}
