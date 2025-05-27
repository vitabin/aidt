export class ClovaMessageDto {
  role!: ClovaRole;
  content!: string;
}

export enum ClovaRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}
