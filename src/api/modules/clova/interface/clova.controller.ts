import { Body, Controller, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClovaService } from '../application/clova.service';
import { ClovaChunkResponseDto, GetCompletionDto } from '../application/dto';

@ApiTags('clova')
@Controller('clova')
export class ClovaController {
  constructor(private readonly service: ClovaService) {}
  @ApiOperation({
    summary: '클로바와 대화를 하는 API입니다. 작업자: 강현길',
    description: `
    스웨거에서는 이 API를 호출할 수 없습니다.\n
    먼저 Request Body에 있는 것처럼 body를 포함해서 보내주시되
    한 대화 내에서, 첫 요청에는 requestId를 포함하지 마시고, messages에 첫 메시지를 보내주시면 됩니다.\n
    그러면 응답이 Responses 의 스키마처럼 스트리밍으로 반환됩니다.
    여기에 포함된 requestId를 다음 요청부터 담아서 보내주시면 됩니다.\n
    대신, 응답은 문자열 형태로 가니 JSON으로 파싱해서 쓰시기 바랍니다.\n
    그리고 두 번째 요청부터는 messages에 처음 보낸 메시지부터 지금까지 주고 받은 모든 메시지를 함께 담아 보내주시면 됩니다.\ㅜ
    event에 result나 signal이 오면 응답이 끝난 것이니 적절히 처리해주시면 되고,
    message나 event가 없는 빈 객체가 갈 수도 있으니 무시하시면 됩니다.
    `,
  })
  @ApiResponse({ type: ClovaChunkResponseDto, status: 200 })
  @Sse('completion')
  async getCompletion(@Body() dto: GetCompletionDto) {
    return await this.service.getCompletion(dto.messages, dto.type, dto.requestId);
  }
}
