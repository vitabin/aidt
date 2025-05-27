import { Injectable } from '@nestjs/common';
import { InOutState } from '@prisma/client';
import { PrismaService } from 'src/prisma';

export interface LearningHistorySummary {
  userUuid: string;
  totalLearningTime: number;
  totalLengthOfHistory: number;
}

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async writeSigninRecord(uuid: string, clsId: string) {
    await this.prisma.learning_history.create({
      data: {
        user_uuid: uuid,
        cls_id: clsId,
        state: InOutState.Initialized,
      },
    });
  }

  async writeSignoutRecord(uuid: string, clsId: string) {
    await this.prisma.learning_history.create({
      data: {
        user_uuid: uuid,
        cls_id: clsId,
        state: InOutState.Terminated,
      },
    });
  }

  async getLearningHistoryOfUser(uuid: string, clsId: string) {
    const histories = await this.prisma.learning_history.findMany({
      where: {
        user_uuid: uuid,
        cls_id: { startsWith: clsId },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const userHistories: { loginTime?: Date; logoutTime?: Date; learningTimeInSecond?: number }[] = [];

    for (let i = 0; i < histories.length; i++) {
      if (histories[i].state === InOutState.Initialized) {
        const loginTime = histories[i].created_at;
        if (i + 1 < histories.length && histories[i + 1].state === InOutState.Terminated) {
          const logoutTime = histories[i + 1].created_at;
          const learningTimeInSecond = (logoutTime.getTime() - loginTime.getTime()) / 1000; // Convert to seconds
          userHistories.push({ loginTime, logoutTime, learningTimeInSecond });
          i++; // Skip the next record as it's already processed
        } else {
          userHistories.push({ loginTime });
        }
      } else if (histories[i].state === InOutState.Terminated) {
        const logoutTime = histories[i].created_at;
        userHistories.push({ logoutTime });
      }
    }

    return {
      userUuid: uuid,
      histories: userHistories,
    };
  }

  async getLearningHistorySummaries(uuids: string[], clsId: string): Promise<LearningHistorySummary[]> {
    const histories = await this.prisma.learning_history.findMany({
      where: {
        user_uuid: { in: uuids },
        cls_id: clsId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return uuids.map((uuid) => {
      const userHistories = histories.filter((history) => history.user_uuid === uuid);
      let totalLearningTime = 0;
      let totalLengthOfHistory = 0;

      for (let i = 0; i < userHistories.length; i++) {
        if (userHistories[i].state === InOutState.Initialized) {
          totalLengthOfHistory++; // Count the Initialized records
          if (i + 1 < userHistories.length && userHistories[i + 1].state === InOutState.Terminated) {
            const learningTimeInSecond = (userHistories[i + 1].created_at.getTime() - userHistories[i].created_at.getTime()) / 1000; // Convert to seconds
            totalLearningTime += learningTimeInSecond;
            i++; // Skip the next record as it's already processed
          }
        }
      }

      return {
        userUuid: uuid,
        totalLearningTime,
        totalLengthOfHistory,
      };
    });
  }

  async getLearningHistoryManySummaries(uuids: string[], clsIds: string[]): Promise<LearningHistorySummary[]> {
    const histories = await this.prisma.learning_history.findMany({
      where: {
        user_uuid: { in: uuids },
        cls_id: {
          in: clsIds,
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return uuids.map((uuid) => {
      const userHistories = histories.filter((history) => history.user_uuid === uuid);
      let totalLearningTime = 0;
      let totalLengthOfHistory = 0;

      for (let i = 0; i < userHistories.length; i++) {
        if (userHistories[i].state === InOutState.Initialized) {
          totalLengthOfHistory++; // Count the Initialized records
          if (i + 1 < userHistories.length && userHistories[i + 1].state === InOutState.Terminated) {
            const learningTimeInSecond = (userHistories[i + 1].created_at.getTime() - userHistories[i].created_at.getTime()) / 1000; // Convert to seconds
            totalLearningTime += learningTimeInSecond;
            i++; // Skip the next record as it's already processed
          }
        }
      }

      return {
        userUuid: uuid,
        totalLearningTime,
        totalLengthOfHistory,
      };
    });
  }

  async getLearningHistorySummariesWithManyCurriculumIds(uuids: string[], clsIds: string[]): Promise<LearningHistorySummary[]> {
    const histories = await this.prisma.learning_history.findMany({
      where: {
        user_uuid: { in: uuids },
        cls_id: { in: clsIds },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return uuids.map((uuid) => {
      const userHistories = histories.filter((history) => history.user_uuid === uuid);
      let totalLearningTime = 0;
      let totalLengthOfHistory = 0;

      for (let i = 0; i < userHistories.length; i++) {
        if (userHistories[i].state === InOutState.Initialized) {
          totalLengthOfHistory++; // Count the Initialized records
          if (i + 1 < userHistories.length && userHistories[i + 1].state === InOutState.Terminated) {
            totalLearningTime += (userHistories[i + 1].created_at.getTime() - userHistories[i].created_at.getTime()) / 1000; // Convert to seconds
            i++; // Skip the next record as it's already processed
          }
        }
      }

      return {
        userUuid: uuid,
        totalLearningTime,
        totalLengthOfHistory,
      };
    });
  }
}
