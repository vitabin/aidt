import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { shared_solution_video } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProblemSolvingQueryRepository extends BaseRepository<shared_solution_video> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 교과서 명세서 p.33 문제-제출 후-다시풀기
   * Jira/AI-35 참여 학습 별 문제 재수행 기능 구현
   * 관련 서비스 코드입니다.
   * 학생이 문제를 다시 풀었을 때 문제 풀이 녹화 영상의 경우는 새로 찍었을 경우 기존의 것을 대체해야 한다.
   * @param dto updateProblemSolvingVideoDto
   * @param uuid string
   * @returns Promise<problem_solving>
   */
  // async updateOrCreateProblemSolvingVideo(dto: UpdateProblemSolvingVideoDto, uuid: string): Promise<shared_solution_video> {
  //   const alreadyUploaded = await this.prisma.shared_solution_video.findFirst({
  //     where: {
  //       question: {
  //         problem_id: dto.problem_id,
  //       },
  //       user_uuid: uuid,
  //     },
  //   });
  //   if (alreadyUploaded) {
  //     //이미 영상이 있으면 단순히 dto로 받아온 video_path로 업데이트
  //     //이때에 status나 pinned (고정 여부) 같은 경우는 유지하지 않고 초기화시킨다.
  //     return await this.prisma.shared_solution_video.update({
  //       where: {
  //         id: alreadyUploaded.id,
  //       },
  //       data: {
  //         video_path: dto.video_path,
  //         created_at: new Date(),
  //         deleted_at: null, // 풀이 영상을 삭제했을 경우 기존엔 삭제된 상태로 표시되겠으나, 다시 올릴 경우 삭제된 상태를 해제한다.
  //         shared_solution_video_share: {
  //           update: {
  //             pinned: false,
  //           },
  //         },
  //       },
  //     });
  //   } else {
  //     // 영상이 없으면 새로운 problem_solving row를 생성한다.
  //     return await this.prisma.shared_solution_video.create({
  //       data: {
  //         user_uuid: uuid,
  //         video_path: dto.video_path,
  //         status: VideoProcessingStatus.IDLE,
  //         pinned: false,
  //         scope: dto.scope,
  //         created_at: new Date(),
  //       },
  //     });
  //   }
  // }

  async getSolvedProblemsByIds(uuids: string[]): Promise<shared_solution_video[]> {
    return await this.prisma.shared_solution_video.findMany({
      include: {
        shared_solution_video_data: true,
      },
      where: {
        user_uuid: {
          in: uuids,
        },
      },
    });
  }
}
