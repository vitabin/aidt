import { learning_map_node } from '@prisma/client';
import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';
// import { EDifficulty, EDifficultyProps } from './problem.enum';

@Injectable()
export class LearningSysMapNodeQueryRepository extends BaseRepository<learning_map_node> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async getMapNodeById(id: number): Promise<learning_map_node> {
    return await this.prisma.learning_map_node.findFirstOrThrow({
      where: {
        id,
      },
    });
  }

  /**
   * 현재 leaning_node_id를 받아서 현재,이전,전전 노드를 배열로 반환한다.
   * 배열의 0번째는 현재 노드, 1번째는 이전 노드, 2번째는 전전 노드이다. (순서를 지키게 되어있음.)
   * 만약 이전노드, 전전노드를 찾을 수 없다면 배열의 길이가 1,2 가 될 수 있다.
   * 여기서 반환하는 것은 learning_map_node 객체 자체를 반환한다.
   * @param currentNodeId 현재 learning_map_node 아이디
   * @returns [현재,이전,전전] learning_map_node[]
   */
  async getRecent3NodesByNodeId(currentNodeId: number): Promise<learning_map_node[]> {
    const currentNode = await this.getMapNodeById(currentNodeId);
    if (!currentNode) throw new NotFoundException('현재 학습 노드를 찾을 수 없습니다.');

    const tmp = [currentNode];
    //전 노드의 아이디를 불러왔다. 이제 전전 노드를 불러와야한다.
    const prevNodeId = currentNode.link_prev;
    const prevNode = prevNodeId ? await this.getMapNodeById(prevNodeId) : null;
    if (prevNode) {
      tmp.push(prevNode);
      //전전 노드의 아이디도 불러왔다.
      const pPrevNodeId = prevNode.link_prev;
      const pPrevNode = pPrevNodeId ? await this.getMapNodeById(pPrevNodeId) : null;
      if (pPrevNode) tmp.push(pPrevNode);
    }
    return tmp;
  }

  async getBasicUnitIdByCurrentUnitId(unit_id: number): Promise<learning_map_node> {
    return await this.prisma.learning_map_node.findFirstOrThrow({
      where: {
        learning_sys_id: unit_id,
      },
    });
  }

  async getNodeByLearningSysId(learning_sys_id: number): Promise<learning_map_node> {
    return await this.prisma.learning_map_node.findFirstOrThrow({
      where: {
        learning_sys_id: learning_sys_id,
      },
    });
  }
}
