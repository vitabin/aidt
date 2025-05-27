import { learning_level } from '@prisma/client';
import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LearningLevelQueryRepository extends BaseRepository<learning_level> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async getById(id: number): Promise<learning_level | null> {
    return await this.prisma.learning_level.findFirst({
      where: {
        id: id,
      },
    });
  }
  async getByLevel(level: number): Promise<learning_level | null> {
    return await this.prisma.learning_level.findFirst({
      where: {
        level: level,
      },
    });
  }
}
