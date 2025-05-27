import { IsNumber, Min } from 'class-validator';

export class ReadMyNotificationDto {
  @IsNumber()
  @Min(1)
  notification_id!: number;
}
