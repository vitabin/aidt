import { Body, Controller, Delete, Get, Patch, Post, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { NotificationService } from '../application';
import { notification } from '@prisma/client';
import {
  CreateAssignmentNotificationsDto,
  CreateAssignmentNotificationsRespDto,
  CreateStudyReminderNotificationsDto,
  DeleteMyNotificationDto,
  ReadMyNotificationDto,
} from '../application/dto';
import { Role } from 'src/libs/decorators/role.enum';
import { Roles } from 'src/libs/decorators/roles.decorator';

@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('notification')
@Controller({ path: 'notification', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: '나의 알림을 가져온다. (왕정희)',
  })
  @Get()
  async getMyNotifications(@UUIDHeader() uuid: string): Promise<Array<notification>> {
    return await this.notificationService.getMyNotifications(uuid);
  }

  @ApiOperation({
    summary: '나의 알림을 읽음 처리한다. (왕정희)',
  })
  @Patch('read')
  async readMyNotification(@Body() dto: ReadMyNotificationDto, @UUIDHeader() uuid: string) {
    return await this.notificationService.readMyNotification(dto.notification_id, uuid);
  }

  @ApiOperation({
    summary: '나의 알림 하나를 삭제한다. (왕정희)',
  })
  @Delete()
  async deleteMyNotification(@Body() dto: DeleteMyNotificationDto, @UUIDHeader() uuid: string) {
    return await this.notificationService.deleteMyNotification(dto.notification_id, uuid);
  }

  @ApiOperation({
    summary: '나의 알림 모두를 삭제한다. (왕정희)',
  })
  @Delete('all')
  async deleteMyAllNotifications(@UUIDHeader() uuid: string) {
    return await this.notificationService.deleteMyAllNotifications(uuid);
  }

  @ApiOperation({
    summary: '선생님이 학생에게 과제 독촉 알림을 보낸다. (왕정희)',
    description: '헤더 uuid에는 선생님 uuid를, Roles에는 T를 반드시 입력해주셔야 합니다.',
  })
  @Roles([Role.Teacher])
  @Post('assignment-reminder')
  async createAssignmentNotifications(
    @Body() dto: CreateAssignmentNotificationsDto,
    @UUIDHeader() uuid: string,
  ): Promise<CreateAssignmentNotificationsRespDto> {
    return await this.notificationService.createAssignmentNotifications(dto, uuid);
  }

  @ApiOperation({
    summary: '선생님이 학생에게 학습 독촉 알림을 보낸다. (왕정희)',
    description: '헤더 uuid에는 선생님 uuid를, Roles에는 T를 반드시 입력해주셔야 합니다.',
  })
  @Roles([Role.Teacher])
  @Post('study-reminder')
  async createStudyReminderNotifications(
    @Body() dto: CreateStudyReminderNotificationsDto,
    @UUIDHeader() uuid: string,
  ): Promise<CreateAssignmentNotificationsRespDto> {
    return await this.notificationService.createStudyReminderNotifications(dto, uuid);
  }
}
