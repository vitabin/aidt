import { assignment_finish, AssignmentType } from '@prisma/client';

export class AssignmentExistDto {
  uuid!: string;

  learningSysId!: number;

  assignmentId!: number;

  assignmentType!: AssignmentType;

  assignmentFinish: assignment_finish | null = null;

  static create(uuid: string, learningSysId: number, assignmentId: number, assignmnetType: AssignmentType, assignmentFinish: assignment_finish | null) {
    const dto = new AssignmentExistDto();
    dto.uuid = uuid;
    dto.learningSysId = learningSysId;
    dto.assignmentId = assignmentId;
    dto.assignmentType = assignmnetType;
    dto.assignmentFinish = assignmentFinish;

    return dto;
  }
}
