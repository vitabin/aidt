import { BadRequestException, Injectable } from '@nestjs/common';
import { concept_perform } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { CreateCommonConcpetVidPlayDto, CreateConceptCompleteDto, GetConceptDto, UpdateCommonConcpetVidPlayDto, GetConceptLikeMineDto } from './dto';

@Injectable()
export class ConceptService {
  constructor(private readonly prisma: PrismaService) {}
  async getCommonConcept(dto: GetConceptDto) {
    const learningSysIds = await this.prisma.learning_sys.findMany({
      where: {
        parent_id: dto.learning_sys_id,
      },
    });
    const clsIds: string[] = learningSysIds.filter((value) => value != null).map((value) => value.cls_id as string) || [];
    const noDuplicateIdObject = learningSysIds.map((learningSysData) => {
      const originData = learningSysData;
      const { id, ...rest } = originData;
      return { learning_sys_id: id, ...rest };
    });
    const concept = await this.prisma.concept.findMany({
      where: {
        cls_id: {
          in: clsIds,
        },
      },
      include: {
        common_concept_video: {
          include: {
            common_concept_video_data: {
              include: {
                _count: {
                  select: {
                    common_concept_video_comment: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!concept.length) {
      throw new Error('해당 개념은 존재하지 않습니다.');
    } else {
      return concept.map((conceptData) => {
        const learningSysIdsData = noDuplicateIdObject.find((learningSysIdsData) => learningSysIdsData.cls_id === conceptData.cls_id);
        return { ...conceptData, ...learningSysIdsData };
      });
    }
  }

  async createCommonConcpetVidPlay(createCommonConcpetVidPlay: CreateCommonConcpetVidPlayDto, uuid: string) {
    return await this.prisma.common_concept_video_play.create({
      data: {
        user_uuid: uuid,
        common_concept_video_id: createCommonConcpetVidPlay.videoId,
      },
    });
  }

  async updateCommonConcpetVidPlay(updateCommonConcpetVidPlay: UpdateCommonConcpetVidPlayDto, uuid: string) {
    const commonConceptVideoPlay = await this.prisma.common_concept_video_play.findFirst({
      where: {
        common_concept_video_id: updateCommonConcpetVidPlay.videoId,
        user_uuid: uuid,
      },
    });

    if (!commonConceptVideoPlay) throw new BadRequestException('개념 인강이 존재하지 않습니다');

    return await this.prisma.common_concept_video_play.update({
      where: {
        id: commonConceptVideoPlay.id,
        user_uuid: uuid,
      },
      data: {
        ended_at: updateCommonConcpetVidPlay.endedAt,
      },
    });
  }

  async insertConceptStudyComplete(createConceptCompleteDto: CreateConceptCompleteDto, uuid: string): Promise<concept_perform> {
    const conceptStudyPerform = await this.prisma.concept_perform.findFirst({
      where: {
        concept_id: createConceptCompleteDto.conceptId,
        learning_sys_id: createConceptCompleteDto.learningSysId,
        user_uuid: uuid,
      },
    });
    if (!conceptStudyPerform) {
      return await this.prisma.concept_perform.create({
        data: {
          concept_id: createConceptCompleteDto.conceptId,
          learning_sys_id: createConceptCompleteDto.learningSysId,
          user_uuid: uuid,
        },
      });
    } else {
      return conceptStudyPerform;
    }
  }

  async getCommonConceptLikeMine(dto: GetConceptLikeMineDto, uuid: string) {
    const conceptVideoLike = await this.prisma.common_concept_video_like.findMany({
      where: {
        common_concept_video_id: dto.concept_video_id,
        user_uuid: uuid,
      },
    });

    return { like: conceptVideoLike.length > 0 };
  }
}
