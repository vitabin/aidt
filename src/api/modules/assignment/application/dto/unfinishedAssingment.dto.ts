import { ApiProperty } from '@nestjs/swagger';
import { assignment_finish } from '@prisma/client';

export class UnfinishedAssignmentDto {
  @ApiProperty({ description: '학생 uuid' })
  uuid!: string;

  @ApiProperty({ description: '과제 완료 객체들의 배열입니다. 과제 완료 시점이 담겨있습니다.' })
  assignment_finish!: assignment_finish[];

  static create(uuid: string, assignment_finish: assignment_finish[]) {
    const dto = new UnfinishedAssignmentDto();
    dto.uuid = uuid;
    dto.assignment_finish = assignment_finish;
    return dto;
  }
}
