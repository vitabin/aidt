import { ReferenceDataSummary } from '../../infrastructure/referenceDataSummary.entity';

export class GetReferenceDataResponseDto {
  data!: ReferenceDataSummary[];
  currentPage!: number;
  totalPage!: number;
}
