import { IsNumber, Min } from 'class-validator';

export class DeleteMyNotificationDto {
  @IsNumber()
  @Min(1)
  notification_id!: number;
}
