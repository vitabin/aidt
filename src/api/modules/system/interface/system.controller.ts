import { Controller, Get, Query } from '@nestjs/common';
import { SystemService } from '../application/system.service';
import { GetLearningSystemsResponseDto } from '../application/dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('system')
@Controller('system')
export class SystemController {
  constructor(private readonly service: SystemService) {}
  @ApiOperation({
    summary: '표준학습체계ID에 해당하는 자체학습체계를 조회하는 API입니다. 작업자: 강현길',
    description: `브라우저에서 해당 표준학습체계 ID와 자체학습체계ID에 관한 1:N 관계에 대해서 알 수 없는 것 같아 만든 엔드포인트입니다.\n
    예를 들어 한 소단원의 활동이 끝났을 때 표준학습체계ID에 대해서 경과를 보내야 하는데 한 표준학습체계ID 내에 \n
    여러 개의 자체학습체계가 있을 수 있으므로 경과 계산을 단순히 25%의 배수로 할 수가 없는 경우에 사용하시면 되겠습니다.\n
    또한 한 소단원이 끝났을 때 이게 자체학습체계 내에서만 끝난 것인지 표준학습체계도 같이 끝난 것인지 알 수 없기 때문에 그때도 활용하시면 되겠습니다.`,
  })
  @ApiQuery({ name: 'curriculumId', required: true })
  @ApiResponse({ type: GetLearningSystemsResponseDto, isArray: true })
  @Get('learning-systems')
  async getLearningSystemsFromCurriculumId(@Query('curriculumId') curriculumId: string): Promise<GetLearningSystemsResponseDto[]> {
    const result = this.service.getLearningSystemsFromCurriculumId(curriculumId);

    return (await result).map((v) => ({
      learningSystemId: v.id,
      name: v.name,
      fullName: v.full_name,
      preLearningMapId: v.pre_learning_map_id,
      parentLearningSystemId: v.parent_id,
      learningMapNodes: v.learning_map_node.map((node) => {
        return {
          id: node.id,
          linkNext: node.link_next,
          linkPrev: node.link_prev,
        };
      }),
    }));
  }
}
