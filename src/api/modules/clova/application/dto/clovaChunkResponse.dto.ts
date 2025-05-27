import { ClovaMessageDto } from './message.dto';

export class ClovaChunkResponseDto {
  requestId!: string;
  message?: ClovaMessageDto;
  event?: ChunkResponseEvent;

  constructor(requestId: string, message?: ClovaMessageDto, event?: ChunkResponseEvent) {
    this.requestId = requestId;
    this.message = message;
    this.event = event;
  }
}

export enum ChunkResponseEvent {
  RESULT = 'result',
  TOKEN = 'token',
  ERROR = 'error',
  SIGNAL = 'signal',
}

export function eventFromString(event: string): ChunkResponseEvent | undefined {
  switch (event) {
    case 'result':
      return ChunkResponseEvent.RESULT;
    case 'token':
      return ChunkResponseEvent.TOKEN;
    case 'error':
      return ChunkResponseEvent.ERROR;
    case 'signal':
      return ChunkResponseEvent.SIGNAL;
    default:
      return undefined;
  }
}
