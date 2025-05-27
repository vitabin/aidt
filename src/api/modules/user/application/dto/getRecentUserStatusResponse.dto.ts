import { user_plan_note } from '@prisma/client';

export class GetRecentUserStatusResponseDto {
  statusMessage!: string;
  physicalStates!: number[];
  mentalStates!: number[];
  dreamJobs!: user_plan_note[];
}
