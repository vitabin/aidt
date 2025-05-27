import { TransferData } from '../../infrastructure/transferData.entity';

export class TransferResponseDto {
  user_id!: string;
  code!: string;
  message!: string;
  data?: TransferData[];
  count?: number;
}
