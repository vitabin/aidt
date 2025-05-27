import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}
  getLearningSystemsFromCurriculumId(curriculumId: string) {
    return this.prisma.learning_sys.findMany({
      where: {
        cls_id: {
          startsWith: curriculumId,
        },
        deleted_at: null,
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        full_name: true,
        pre_learning_map_id: true,
        parent_id: true,
        learning_map_node: {
          select: {
            id: true,
            link_next: true,
            link_prev: true,
          },
        },
      },
    });
  }
}
