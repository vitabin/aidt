import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { CreateReportDto, GetReportsByUuidDto, GetReportsDto, UpdateReportStateDto } from './dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  //신고하기 (이미 신고했는지 체크 필요)
  async createReport(dto: CreateReportDto, uuid: string) {
    const { type, target_id, reason, reason_detail } = dto;
    //이미 신고했는지 체크
    const alreadyReported = await this.prisma.report.findFirst({
      where: {
        type,
        target_id,
        uuid,
      },
    });
    if (alreadyReported) {
      throw new Error('이미 신고한 내역이 있습니다.');
    }
    return await this.prisma.report.create({
      data: {
        type,
        target_id,
        reason,
        reason_detail,
        uuid,
      },
    });
  }

  //TODO: 일반 유저의 신고 내역 불러오기
  async getReportsByUuid(dto: GetReportsByUuidDto, uuid: string) {
    throw new NotImplementedException(`${dto} ${uuid}`);
  }

  //TODO: 어드민이 신고 내역 불러오기
  async getReports(dto: GetReportsDto, uuid: string) {
    throw new NotImplementedException(`${dto} ${uuid}`);
  }

  //TODO: 어드민이 신고 내역의 status 변경
  async updateReportState(dto: UpdateReportStateDto, uuid: string) {
    throw new NotImplementedException(`${dto} ${uuid}`);
  }
}
