import { IsString } from 'class-validator';

export class CreateAssignmentNotificationsRespDto {
  @IsString({ each: true })
  message!: string;
}
