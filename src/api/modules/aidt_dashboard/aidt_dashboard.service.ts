import { Injectable, NotFoundException } from '@nestjs/common';
import { SendScoreOfCurriculumDto } from '../study';
import { PrismaService } from 'src/prisma';
import { KerisService } from '../keris/application/keris.service';

@Injectable()
export class AidtDashboardService {
  constructor(
    private prisma: PrismaService,
    private kerisService: KerisService,
  ) {}
  async sendScoreOfCurriculum(dto: SendScoreOfCurriculumDto, uuid: string) {
    const learningSys = await this.prisma.learning_sys.findMany({
      where: {
        cls_id: dto.curriculumId,
      },
      select: {
        id: true,
      },
    });

    if (!learningSys.length) throw new NotFoundException('해당 표준학습체계에 해당하는 자체학습체계가 없습니다.');

    const achievements = await this.prisma.user_achievement.findMany({
      where: {
        user_uuid: uuid,
        learning_sys_id: {
          in: learningSys.map((ls) => ls.id),
        },
      },
    });

    if (!achievements.length) throw new NotFoundException('해당 학생이 해당 표준학습체계에서 성취한 바가 없습니다.');

    const totalScore = achievements.reduce((acc, cur) => acc + (cur.achievement_score ?? 0), 0);

    const averageScore = totalScore / achievements.length;

    return await this.kerisService.sendScoreForCurriculum(dto.curriculumId, dto.accessToken, uuid, averageScore, dto.partnerId);
  }
}
