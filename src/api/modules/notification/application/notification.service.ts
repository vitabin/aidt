import { Injectable, NotImplementedException } from '@nestjs/common';
import { UserService } from '../../user/application';
import { PrismaService } from 'src/prisma';
import { CreateAssignmentNotificationsDto } from './dto';
import { CreateStudyReminderNotificationsDto } from './dto/createStudyReminderNotifications.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create({
    trigger_uuid,
    taker_uuid,
    action,
    additional_data1,
    additional_data2,
    additional_data3,
    additional_text,
  }: {
    trigger_uuid: string;
    taker_uuid: string;
    action: number;
    additional_data1?: number | undefined;
    additional_data2?: number | undefined;
    additional_data3?: number | undefined;
    additional_text?: string | undefined;
  }) {
    //trigger_uuid 는 "system" 문자열이 들어올수도 있어서 굳이 유효성 검사를 하지 않는다..
    const takerUser = await this.userService.isUuidValid(taker_uuid);
    if (!takerUser) {
      throw new NotImplementedException('User not found');
    }

    return await this.prisma.notification.create({
      data: {
        trigger_uuid,
        taker_uuid,
        action,
        additional_data1,
        additional_data2,
        additional_data3,
        additional_text,
      },
    });
  }

  async getMyNotifications(uuid: string) {
    return await this.prisma.notification.findMany({
      where: {
        taker_uuid: uuid,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async readMyNotification(id: number, uuid: string) {
    return await this.prisma.notification.update({
      where: {
        id,
        taker_uuid: uuid,
      },
      data: {
        read: 1,
      },
    });
  }

  async deleteMyNotification(id: number, uuid: string) {
    await this.prisma.notification.delete({
      where: {
        id,
        taker_uuid: uuid,
      },
    });
    return {
      success: true,
    };
  }

  async deleteMyAllNotifications(uuid: string) {
    return await this.prisma.notification.deleteMany({
      where: {
        taker_uuid: uuid,
      },
    });
  }

  async createAssignmentNotifications(dto: CreateAssignmentNotificationsDto, uuid: string) {
    const currentUser = await this.userService.isUuidValid(uuid);
    if (!currentUser) {
      throw new Error('선생님 UUID를 찾을 수 없습니다.');
    }

    const learningSys = await this.prisma.learning_sys.findUnique({
      where: {
        id: dto.learning_sys_id,
      },
    });
    if (!learningSys) {
      throw new Error('학습 시스템을 찾을 수 없습니다.');
    }

    const takers = dto.taker_uuids;
    let takerCount = 0;
    for await (const taker_uuid of takers) {
      const takerUser = await this.prisma.user.findUnique({
        where: {
          user_uuid: taker_uuid,
        },
      });
      if (takerUser) {
        await this.create({
          trigger_uuid: uuid,
          taker_uuid,
          action: 6,
          additional_data1: dto.learning_sys_id,
          additional_text: learningSys.name,
        });
        takerCount++;
      }
    }
    return {
      message: `${takerCount}명에게 알림을 보냈습니다.`,
    };
  }

  async createStudyReminderNotifications(dto: CreateStudyReminderNotificationsDto, uuid: string) {
    const currentUser = await this.userService.isUuidValid(uuid);
    if (!currentUser) {
      throw new Error('선생님 UUID를 찾을 수 없습니다.');
    }

    const learningSys = await this.prisma.learning_sys.findUnique({
      where: {
        id: dto.learning_sys_id,
      },
    });
    if (!learningSys) {
      throw new Error('학습 시스템을 찾을 수 없습니다.');
    }

    const takers = dto.taker_uuids;
    let takerCount = 0;
    for await (const taker_uuid of takers) {
      const takerUser = await this.prisma.user.findUnique({
        where: {
          user_uuid: taker_uuid,
        },
      });
      if (takerUser) {
        await this.create({
          trigger_uuid: uuid,
          taker_uuid,
          action: dto.action,
          additional_data1: dto.learning_sys_id,
          additional_text: learningSys.name,
        });
        takerCount++;
      }
    }
    return {
      message: `${takerCount}명에게 알림을 보냈습니다.`,
    };
  }
}
