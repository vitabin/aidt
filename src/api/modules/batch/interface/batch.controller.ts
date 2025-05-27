/* eslint-disable sonarjs/no-duplicate-string */
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, UseFilters, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { BatchService } from '../application';
import { fakeDto } from '../application/dto';

@ApiTags('batch')
@Controller({ path: 'batch', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @ApiOperation({
    summary: 'transfer id get And data statement send',
    description: '데이터 수집 xAPI 정보 batch 전달',
  })
  @HttpCode(HttpStatus.OK)
  @Get('send-statement')
  async send_statement() {
    const partnerId = 'b7dd668a-16aa-5012-87be-725181263bd9';
    const userUuid = '550e8400-e29b-41d4-a716-446655440000';
    const transferData = await this.batchService.DataApi006(partnerId);
    await this.batchService.batchStart(transferData.transfer_id);
    return await this.batchService.createChunkedDataAll(userUuid, partnerId, transferData.transfer_id, transferData.partner_access_token);
  }

  @ApiOperation({
    summary: 're get transform id And data statement send',
    description: '데이터 수집 xAPI 정보 batch 전달',
  })
  @HttpCode(HttpStatus.OK)
  @Get('retry')
  async GetTransformId(@Query() dto: fakeDto) {
    const partnerId = 'b7dd668a-16aa-5012-87be-725181263bd9';
    // const transferId = 'fa4fe1a0-a73c-4881-b383-65ad0e61ef66';
    // const transferData = await this.batchService.DataApi006(partnerId); //prod

    // await this.batchService.getTransferChunkData(dto.transferId);
    return await this.batchService.getStopedChunkdata(partnerId, dto.transferId);
  }
  @ApiOperation({
    summary: 'transfer id get And data statement send',
    description: '데이터 수집 xAPI 정보 batch 전달',
  })
  @HttpCode(HttpStatus.OK)
  @Get('fake-send-statement')
  async fake_send_statement() {
    const partnerId = 'b7dd668a-16aa-5012-87be-725181263bd9';
    const userUuid = '550e8400-e29b-41d4-a716-446655440000';
    const transferData = await this.batchService.DataApi006(partnerId);
    // await this.batchService.batchStart(transferData.transfer_id);
    return await this.batchService.fakeCreateChunkedDataAll(userUuid, partnerId, transferData.transfer_id, transferData.partner_access_token);
  }
}
