import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { TransferDto, TransferResponseDto } from './dto';
import { AchievementType, learning_sys, study_perform, user_achievement } from '@prisma/client';
import { TransferData } from '../infrastructure';
import { KerisService } from '../../keris/application/keris.service';
import { StudentInfo } from '../../keris/infrastructure/entity';
import { turnAchievementToScore, turnScoreToAchievementLevel } from 'src/libs/utils';
import { convertGrade } from 'src/libs/utils/gradeConverter';

@Injectable()
export class TransferService {
  constructor(
    private readonly kerisService: KerisService,
    private readonly prisma: PrismaService,
  ) {}
  async transferOut(userData: TransferDto): Promise<TransferResponseDto> {
    const data: TransferData[] = [];
    try {
      const { user_id } = userData;

      // 유저의 achievement를 모두 불러옵니다.
      const achievement = await this.prisma.user_achievement.findMany({
        where: {
          user_uuid: user_id,
        },
        include: {
          learning_level: { select: { level: true } },
        },
      });

      const groupedAchievementByLearningSysId = achievement.reduce(
        (acc, cur) => {
          if (!cur.learning_sys_id) {
            if (!acc['null']) {
              acc['null'] = [];
            }
            acc['null'].push(cur);
          } else {
            if (!acc[cur.learning_sys_id]) {
              acc[cur.learning_sys_id] = [];
            }
            acc[cur.learning_sys_id].push(cur);
          }
          return acc;
        },
        {} as { [key: string]: user_achievement[] },
      );

      // achievement 내 모든 learning_sys_id를 모두 뽑아냅니다.

      const allLearningSysIds = achievement.map((v) => (v.learning_sys_id ? v.learning_sys_id : -1));

      // 해당 하는 id를 가진 모든 learning_sys를 불러옵니다.
      const learningSyss = await this.prisma.learning_sys.findMany({
        where: {
          id: {
            in: allLearningSysIds,
          },
        },
      });

      // learning_sys를 cls_id 기준으로 그룹핑합니다.

      const groupedLearningSysByClsId = learningSyss.reduce(
        (acc, cur) => {
          if (!cur.cls_id) {
            if (!acc['null']) {
              acc['null'] = [];
            }
            acc['null'].push(cur);
          } else {
            if (!acc[cur.cls_id]) {
              acc[cur.cls_id] = [];
            }
            acc[cur.cls_id].push(cur);
          }
          return acc;
        },
        {} as { [key: string]: learning_sys[] },
      );

      const allStudyPerform = await this.prisma.study_perform.findMany({
        where: {
          user_uuid: user_id,
        },
        include: {
          study_problem: {
            include: {
              study: {
                select: {
                  learning_sys_id: true,
                },
              },
            },
          },
        },
      });

      // study_perform을 learning_sys_id 기준으로 그룹핑합니다.

      const groupedStudyPerformByLearningSysId = allStudyPerform.reduce(
        (acc, cur) => {
          if (!cur.study_problem.study.learning_sys_id) {
            if (!acc['null']) {
              acc['null'] = [];
            }
            acc['null'].push(cur);
          } else {
            if (!acc[cur.study_problem.study.learning_sys_id]) {
              acc[cur.study_problem.study.learning_sys_id] = [];
            }
            acc[cur.study_problem.study.learning_sys_id].push(cur);
          }
          return acc;
        },
        {} as { [key: string]: study_perform[] },
      );

      // cls_id 별 진도율을 다음과 같이 계산합니다. groupedLearningSysByClsId 에서 cls_id가 null이 아닌 원소들에 대해서
      // learning_sys_id 배열을 하나씩 돌면서 groupedStudyPerformByLearningSysId 에서 해당 키에 있는 study_perform의 개수를 모두 합해서
      // learning_sys_id 개수 * 12 로 나누어서 저장합니다.

      const progressGroupedByClsId: { [key: string]: number } = {};
      Object.keys(groupedLearningSysByClsId).forEach((clsId) => {
        const learningSysIds = groupedLearningSysByClsId[clsId].map((ls) => ls.id);

        let sum = 0;
        for (const learningSysId of learningSysIds) {
          sum += groupedStudyPerformByLearningSysId[learningSysId].length;
        }

        progressGroupedByClsId[clsId] = sum / learningSysIds.length;
      });

      // groupedAchievementByLearningSysId를 기반으로 clsId를 돌면서
      // 해당 learningSysId에 대한 achievement의 score를 합해 평균을 냅니다.

      const scoreGroupedByClsId: { [key: string]: number } = {};
      Object.keys(groupedAchievementByLearningSysId).forEach((clsId) => {
        const learningSysIds = groupedLearningSysByClsId[clsId].map((ls) => ls.id);
        let sum = 0;
        for (const learningSysId of learningSysIds) {
          sum += groupedAchievementByLearningSysId[learningSysId].reduce((acc, cur) => acc + (cur.achievement_score ?? 0), 0);
        }

        scoreGroupedByClsId[clsId] = sum / learningSysIds.length;
      });

      for (const clsId of Object.keys(groupedLearningSysByClsId)) {
        data.push({
          percent: progressGroupedByClsId[clsId] * 100,
          curriculum: clsId,
          partner_curriculum: groupedLearningSysByClsId[clsId]
            .filter((ls) => ls.cls_id)
            .map((ls) => ls.cls_id!)
            .join(','),
          achievement_level: turnScoreToAchievementLevel(scoreGroupedByClsId[clsId]),
        });
      }

      // 담겨야 하는 정보는 다음과 같습니다.
      // 표준학습체계 ID
      // A-E 로 매핑된 점수
      // 진도율
      // 자체학습체계 ID

      return {
        code: '200',
        message: 'success',
        count: data.length,
        data: data,
        user_id: user_id,
      };
    } catch (error) {
      const { user_id } = userData;
      return {
        code: '500',
        message: String(error),
        count: 0,
        data: [],
        user_id: user_id,
      };
    }
  }
  async transferIn(userData: TransferDto): Promise<TransferResponseDto> {
    try {
      const { user_id, data, access_token, user_type } = userData;

      const userInfo = await this.kerisService.getUserInfo(access_token, user_type, user_id);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            user_uuid: user_id,
          },
        });
        if (data) {
          for (const datum of data) {
            const learningSys = await tx.learning_sys.findFirst({
              where: {
                cls_id: { startsWith: datum.curriculum },
              },
              include: {
                learning_map_node: true,
                learning_sys_doc: true,
              },
            });
            if (!learningSys) throw Error('해당 표준학습체계 ID에 해당하는 자체학습체계가 없습니다.');

            // 유저 정보를 이용해 해당 학급의 learning_map을 찾습니다.
            const learningMap = await tx.learning_map.findFirst({
              where: {
                school_class: {
                  some: {
                    class: (userInfo as StudentInfo).userClass,
                    grade: convertGrade((userInfo as StudentInfo).userGrade, (userInfo as StudentInfo).userDivision).toString(),
                  },
                },
              },
            });

            if (!learningMap) throw Error('소속 학급에 learning_map이 없습니다.');

            // learning_level 을 score를 기반으로 불러옵니다.

            const learningLevel = await tx.learning_level.findFirst({
              where: {
                level: turnAchievementToScore(datum.achievement_level) / 10,
              },
              include: {
                learning_level_group: true,
              },
            });

            if (!learningLevel) throw Error('해당 성취수준에 해당하는 learning_level이 없습니다.');

            await tx.user_achievement.create({
              data: {
                user_uuid: user_id,
                achievement_type: AchievementType.NONE,
                is_force_apply: false,
                learning_map_id: learningMap.id,
                achievement_score: turnAchievementToScore(datum.achievement_level),
                learning_level_id: learningLevel.id,
                learning_sys_id: learningSys.id,
                learning_map_node_id: learningSys.learning_map_node[0].id,
                learning_level_group_id: learningLevel.learning_level_group.id,
              },
            });
          }
        }
      });
      return {
        code: '200',
        message: 'success',
        user_id: user_id,
      };
    } catch (error) {
      const { user_id } = userData;
      return {
        code: '500',
        message: String(error),
        user_id: user_id,
      };
    }
  }
}
