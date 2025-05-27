import { learning_sys, study_perform } from '@prisma/client';
import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LearningSysQueryRepository extends BaseRepository<learning_sys> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async getById(id: number): Promise<learning_sys | null> {
    return await this.prisma.learning_sys.findFirst({
      where: {
        id: id,
      },
    });
  }

  async getByIds(id: number[]): Promise<learning_sys[]> {
    return await this.prisma.learning_sys.findMany({
      where: {
        id: {
          in: id,
        },
      },
    });
  }

  async getRecent3UnitNodesByLearningSysId(learningSysId: number) {
    const unit = await this.prisma.learning_sys.findFirstOrThrow({ where: { id: learningSysId } });
    const idx = [unit.index! - 2, unit.index! - 1, unit.index!];
    return await this.prisma.learning_sys.findMany({
      where: {
        grade: unit.grade,
        semester: unit.semester,
        index: {
          in: idx,
        },
        type: 'UNIT',
        learning_sys_doc_id: unit.learning_sys_doc_id,
        is_deleted: false,
      },
    });
  }
}
