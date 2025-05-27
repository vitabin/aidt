import { Body, Controller, Get, Headers, Logger, Post, Req, Res, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { TransferDto, TransferResponseDto } from '../application/dto';
import { TransferService } from '../application/transfer.service';
import { AchievementLevel, UserStatus } from '../infrastructure';
import { Request, Response } from 'express';

@ApiTags('transfer')
@Controller('transfer')
@UseFilters(ExceptionLoggingFilter)
export class TransferController {
  private readonly logger: Logger = new Logger(TransferController.name);
  constructor(private readonly service: TransferService) {}
  @Post()
  async handleTransfer(@Body() dto: TransferDto): Promise<TransferResponseDto> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('dto', dto);
    }

    if (dto.user_status === UserStatus.TransferOut) {
      return await this.service.transferOut(dto);
    } else if (dto.user_status === UserStatus.TransferIn) {
      return await this.service.transferIn(dto);
    } else {
      return {
        user_id: dto.user_id,
        code: '200',
        message: '성공',
      };
    }
    if (dto.user_status === UserStatus.TransferOut) {
      return {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        code: '200', // 응답코드
        message: '성공', // 메시지
        data: [
          {
            curriculum: 'E4ENGA01B01',
            achievement_level: AchievementLevel.A,
            percent: 100,
          },
          {
            curriculum: 'E4ENGA01B02',
            achievement_level: AchievementLevel.A,
            percent: 100,
          },
          {
            curriculum: 'E4ENGA01B03',
            achievement_level: AchievementLevel.A,
            percent: 100,
          },
        ],
        count: 3, // 전체 데이터 건수
      };
    } else {
      return {
        code: '200', // 응답코드
        message: '성공', // 메시지
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
    }
  }
  @Get()
  async redirectTransferIn(@Headers('host') host: string, @Req() request: Request, @Res() response: Response) {
    const queryPamars = request.query;
    const modifiedUrl = 'https://' + host.replace('api.', '').replace('transfer/in', '');

    const urlWithQueryParams = modifiedUrl + '?' + new URLSearchParams(queryPamars as any).toString();
    response.redirect(301, urlWithQueryParams);
  }
}
