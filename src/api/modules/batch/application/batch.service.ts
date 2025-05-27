/* eslint-disable prettier/prettier */
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { batch_transfer, chunk_format_data } from '@prisma/client';
import axios, { AxiosRequestConfig } from 'axios';
import { CronJob } from 'cron';
import { BatchTransferQueryRepository, ChunkDataQueryRepository } from '../infrastructure';

@Injectable()
export class BatchService {
  private readonly logger: Logger = new Logger(BatchService.name);
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly batchTransferQueryRepository: BatchTransferQueryRepository,
    private readonly chunkDataQueryRepository: ChunkDataQueryRepository,
  ) {}

  async batchStart(transferId: string) {
    const job = new CronJob(`0 */10 * * * *`, () => {
      const partnerId = 'b7dd668a-16aa-5012-87be-725181263bd9';
      this.getStopedChunkdata(partnerId, transferId);
    });

    this.schedulerRegistry.addCronJob('restartCronJob', job);
    job.start();
  }

  async reqeustDataApi006Post(apiPath: string, partnerId: string) {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Partner-ID': partnerId,
      },
    };
    const responseData = await axios.post(`${process.env.API_DOMAIN}/${apiPath}`, null, requestConfig).catch((error) => {
      this.logger.log(error);
    });
    return responseData?.data;
  }

  async DataApi006(partnerId: string): Promise<batch_transfer> {
    const apiPath = 'aidt_rawdata/get_transfer_id';
    const res = await this.reqeustDataApi006Post(apiPath, partnerId);

    return await this.batchTransferQueryRepository.createTransferInfo(partnerId, res.transfer_id, res.partner_access_token, res.start_time);
  }

  // TODO contorller에 붙이기
  async sendChunkData(transferId: string) {
    const transferData = await this.batchTransferQueryRepository.getTransferInfoByTransferId(transferId);
    if (!transferData) {
      throw new BadRequestException('존재하지 않는 transfer 정보입니다.');
    }
    const chunkedDatas = await this.chunkDataQueryRepository.getChunkDataByTransferId(transferId);
    chunkedDatas.forEach((chunkedData) => {
      this.DataApi007(transferId, chunkedData.chunk_index, transferData.partner_access_token, chunkedData.chunk_data);
    });
  }
  async reqeustDataApi007Post(apiPath: string, transferId: string, chunkedIndex: number, partnerAccessToken: string, chunkedFormatString: string) {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Transfer-encoding': 'chunked',
        'Transfer-Id': transferId,
        'Chunked-Index': chunkedIndex.toString(),
        'Partner-Access-Token': partnerAccessToken,
        'Content-Type': null,
        Accept: null,
        'User-Agent': null,
        'Content-Length': null,
        'Accept-Encoding': null,
      },
    };

    this.logger.log('start http request!');
    const responseData = await axios.post(`${process.env.API_DOMAIN}/${apiPath}`, chunkedFormatString, requestConfig).catch((error) => {
      this.logger.log(error);
    });

    return responseData?.data;
  }

  async DataApi007(transferId: string, chunkedIndex: number, partnerAccessToken: string, chunkedFormatString: string) {
    const apiPath = 'aidt_rawdata/send_statement';
    // if (responseData.code === '00000') {
    //   const job = this.schedulerRegistry.getCronJob('restartCronJob');
    //   job.stop();
    // }

    return await this.reqeustDataApi007Post(apiPath, transferId, chunkedIndex, partnerAccessToken, chunkedFormatString);
  }

  async getChunkedDataAllByTransferId(transferId: string): Promise<chunk_format_data[]> {
    return this.chunkDataQueryRepository.getChunkDataByTransferId(transferId);
  }

  async getStopedChunkdata(partnerId: string, transferId: string) {
    const apiPath = 'aidt_rawdata/get_transfer_status';
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Partner-ID': partnerId,
        'Content-Type': null,
        Accept: null,
        'User-Agent': null,
        'Content-Length': null,
        'Accept-Encoding': null,
      },
    };

    const responseData = await axios.post(`${process.env.API_DOMAIN}/${apiPath}`, { transfer_id: transferId }, requestConfig).catch((error) => {
      this.logger.log(error);
    });
    if (!responseData?.data) {
      throw new HttpException('aidt_rawdata/get_transfer_status의 응답이 없습니다.', HttpStatus.BAD_REQUEST);
    }
    return this.restartTransferChunkData(responseData?.data.transfer_id, parseInt(responseData?.data.index) + 1, responseData?.data.partner_access_token);
  }

  async restartTransferChunkData(transferId: string, restartChunkIndex: number, partnerAccessToken: string) {
    const chunkedData = await this.chunkDataQueryRepository.getChunkDataByTransferId(transferId);

    let totalChunkString = '';
    chunkedData.forEach((chunkdata) => {
      if (chunkdata.chunk_index >= restartChunkIndex) {
        totalChunkString += chunkdata.chunk_size + '\r\n' + chunkdata.chunk_data + '\r\n';
      }
    });

    return await this.DataApi007(transferId, restartChunkIndex, partnerAccessToken, totalChunkString);
  }

  async createChunkedDataAll(userUuid: string, partnerId: string, transferId: string, partnerAccessToken: string) {
    const transferTimestamp = '2024-07-03T11:00:00.000+00:00'; //new Date().toISOString();
    const mediaId = 'http://example.com/240408-media-550e8400-e29b-41d4-a716-446655440000';
    const media = await this.getMediaXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assessment = await this.getAssessmentXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assignmentGave = await this.getAssignmentGaveXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assignmentFinish = await this.getAssignmentFinishedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationView = await this.getNavigationViewedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationRead = await this.getNavigationReadXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationDid = await this.getNavigationDidXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationLearned = await this.getNavigationLearnedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const objectSet = await this.getObjectiveXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const queryAsk = await this.getQueryAskedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const teachingRec = await this.getTeachingReorganizedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);

    const textEncoder = new TextEncoder();

    const mediaChunkSize = textEncoder.encode(JSON.stringify(media)).length.toString(16);
    const mediaChunkData = JSON.stringify(media);
    await this.chunkDataQueryRepository.createChunkData(mediaChunkData, 1, mediaChunkSize, transferId);

    const assessmentChunkSize = textEncoder.encode(JSON.stringify(assessment)).length.toString(16);
    const assessmentChunkData = JSON.stringify(assessment);
    await this.chunkDataQueryRepository.createChunkData(assessmentChunkData, 2, assessmentChunkSize, transferId);

    const assignmentGaveChunkSize = textEncoder.encode(JSON.stringify(assignmentGave)).length.toString(16);
    const assignmentGaveChunkData = JSON.stringify(assignmentGave);
    await this.chunkDataQueryRepository.createChunkData(assignmentGaveChunkData, 3, assignmentGaveChunkSize, transferId);

    const assignmentFinishChunkSize = textEncoder.encode(JSON.stringify(assignmentFinish)).length.toString(16);
    const assignmentFinishChunkData = JSON.stringify(assignmentFinish);
    await this.chunkDataQueryRepository.createChunkData(assignmentFinishChunkData, 4, assignmentFinishChunkSize, transferId);

    const navigationViewChunkSize = textEncoder.encode(JSON.stringify(navigationView)).length.toString(16);
    const navigationViewChunkData = JSON.stringify(navigationView);
    await this.chunkDataQueryRepository.createChunkData(navigationViewChunkData, 5, navigationViewChunkSize, transferId);

    const navigationReadChunkSize = textEncoder.encode(JSON.stringify(navigationRead)).length.toString(16);
    const navigationReadChunkData = JSON.stringify(navigationRead);
    await this.chunkDataQueryRepository.createChunkData(navigationReadChunkData, 6, navigationReadChunkSize, transferId);

    const navigationDidChunkSize = textEncoder.encode(JSON.stringify(navigationDid)).length.toString(16);
    const navigationDidChunkData = JSON.stringify(navigationDid);
    await this.chunkDataQueryRepository.createChunkData(navigationDidChunkData, 7, navigationDidChunkSize, transferId);

    const navigationLearnedChunkSize = textEncoder.encode(JSON.stringify(navigationLearned)).length.toString(16);
    const navigationLearnedChunkData = JSON.stringify(navigationLearned);
    await this.chunkDataQueryRepository.createChunkData(navigationLearnedChunkData, 8, navigationLearnedChunkSize, transferId);

    const objectSetChunkSize = textEncoder.encode(JSON.stringify(objectSet)).length.toString(16);
    const objectSetChunkData = JSON.stringify(objectSet);
    await this.chunkDataQueryRepository.createChunkData(objectSetChunkData, 9, objectSetChunkSize, transferId);

    const queryAskChunkSize = textEncoder.encode(JSON.stringify(queryAsk)).length.toString(16);
    const queryAskChunkData = JSON.stringify(queryAsk);
    await this.chunkDataQueryRepository.createChunkData(queryAskChunkData, 10, queryAskChunkSize, transferId);

    const teachingRecChunkSize = textEncoder.encode(JSON.stringify(teachingRec)).length.toString(16);
    const teachingRecChunkData = JSON.stringify(teachingRec);
    await this.chunkDataQueryRepository.createChunkData(teachingRecChunkData, 11, teachingRecChunkSize, transferId);

    const totalChunkString =
      mediaChunkSize +
      '\r\n' +
      mediaChunkData +
      '\r\n' +
      assessmentChunkSize +
      '\r\n' +
      assessmentChunkData +
      '\r\n' +
      assignmentGaveChunkSize +
      '\r\n' +
      assignmentGaveChunkData +
      '\r\n' +
      assignmentFinishChunkSize +
      '\r\n' +
      assignmentFinishChunkData +
      '\r\n' +
      navigationViewChunkSize +
      '\r\n' +
      navigationViewChunkData +
      '\r\n' +
      navigationReadChunkSize +
      '\r\n' +
      navigationReadChunkData +
      '\r\n' +
      navigationDidChunkSize +
      '\r\n' +
      navigationDidChunkData +
      '\r\n' +
      navigationLearnedChunkSize +
      '\r\n' +
      navigationLearnedChunkData +
      '\r\n' +
      objectSetChunkSize +
      '\r\n' +
      objectSetChunkData +
      '\r\n' +
      queryAskChunkSize +
      '\r\n' +
      queryAskChunkData +
      '\r\n' +
      teachingRecChunkSize +
      '\r\n' +
      teachingRecChunkData +
      '\r\n';

    return await this.DataApi007(transferId, 1, partnerAccessToken, totalChunkString);
  }

  async getMediaXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, mediaId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/media/1.0/verbs/played',
        display: {
          'en-US': 'played',
        },
      },
      object: {
        //해당 학생이 재생한 미디어의 id
        id: mediaId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/media',
          description: {
            'ko-KR': '미디어',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/media/1.0/objects/extensions/video-info': [
              {
                id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
                length: 3000,
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          'http://aidtbook.kr/xapi/profiles/media/1.0/results/extensions/video-detail': [
            {
              id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
              'aitutor-recommended': true,
              duration: 2839,
              completion: true,
              attempt: 1,
              'mute-cnt': 5,
              'skip-cnt': 5,
              'pause-cnt': 5,
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  // 평가
  async getAssessmentXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, assessmentId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/assessment/1.0/verbs/submitted',
        display: {
          'en-US': 'submitted',
        },
      },
      object: {
        //해당 학생이 평가 id
        id: assessmentId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/assessment',
          description: {
            'ko-KR': '평가',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/assessment/1.0/objects/extensions/assessment-info': [
              {
                id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has ',
                type: 'D',
                'items-info': [
                  {
                    id: 'http://fsdfasdf', //문항 id
                    type: 'M',
                    difficulty: 3,
                    'difficulty-min': 1,
                    'difficulty-max': 5,
                    'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                    common: true,
                  },
                  {
                    id: 'http://fsdfasdf', //문항 id
                    type: 'M',
                    difficulty: 3,
                    'difficulty-min': 1,
                    'difficulty-max': 5,
                    'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                    common: true,
                  },
                ],
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 평가별 풀이 결과
          'http://aidtbook.kr/xapi/profiles/assessment/1.0/results/extensions/assessment-detail': [
            {
              id: '평가 id',
              'aitutor-recommended': true,
              score: 80,
              timestamp: '2024-04-03T05:47:38',
              'item-detail': [
                {
                  id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like',
                  'aitutor-recommended': true,
                  completion: false,
                  success: 0.0, // 정오답
                  duration: 2839, // 문항 풀이 시간
                  attempt: 1, // 풀이 횟수
                },
                {
                  id: '문항 id',
                  'aitutor-recommended': true,
                  completion: false,
                  success: 0.0, // 정오답
                  duration: 2839, // 문항 풀이 시간
                  attempt: 1, // 풀이 횟수
                },
              ],
            },
          ],
          // 교육과정 표준체계별 성취 수준
          'http://aidtbook.kr/xapi/profiles/assessment/1.0/results/extensions/curriculum-standard': [
            {
              id: 'E4MATA01B01C01', // 표준체계id
              'achievement-level': 'A',
            },
            {
              id: 'E4MATA01B01C01', // 표준체계id
              'achievement-level': 'B',
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  // 과제 Gave
  async getAssignmentGaveXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, assignmentGaveId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/assignment/1.0/verbs/gave',
        display: {
          'en-US': 'gave',
        },
      },
      object: {
        //해당 교사가 등록한 과제 id
        id: assignmentGaveId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/assignment',
          description: {
            'ko-KR': '과제',
          },
        },
      },
      result: {
        extensions: {
          // 평가별 풀이 결과
          'http://aidtbook.kr/xapi/profiles/assignment/1.0/results/extensions/gav-assignment': [
            {
              id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like',
              timestamp: '2024-04-03T05:47:38',
              'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  // 과제 Finished
  async getAssignmentFinishedXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, AssignmentFinishedId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/assignment/1.0/verbs/finished',
        display: {
          'en-US': 'finished',
        },
      },
      object: {
        //해당 학셍이 제출한 과제 id
        id: AssignmentFinishedId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/assignment',
          description: {
            'ko-KR': '과제',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/assignment/1.0/objects/extensions/assignment-info': [
              {
                id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like',
                timestamp: '2024-04-03T05:47:38',
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
              },
              {
                id: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like',
                timestamp: '2024-04-03T05:47:38',
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 과제 제출 결과
          'http://aidtbook.kr/xapi/profiles/assignment/1.0/results/extensions/fin-assignment': [
            {
              id: '과제 id',
              timestamp: '2024-04-03T05:47:38',
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  //경로 viewed
  async getNavigationViewedXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, NavigationViewId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/navigation/1.0/verbs/viewed',
        display: {
          'en-US': 'viewed',
        },
      },
      object: {
        //해당 학생이 조회한 이미지 id
        id: NavigationViewId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/image',
          description: {
            'ko-KR': '이미지',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/navigation/1.0/objects/extensions/image-info': [
              {
                id: '이미지 id',
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
              {
                id: '이미지 id',
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 과제 제출 결과
          'http://aidtbook.kr/xapi/profiles/navigation/1.0/results/extensions/image-detail': [
            {
              id: '과제 id',
              'aitutor-recommended': true,
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }
  //경로 read
  async getNavigationReadXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, NavigationReadId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/navigation/1.0/verbs/read',
        display: {
          'en-US': 'read',
        },
      },
      object: {
        //해당 학생이 조회한 이미지 id
        id: NavigationReadId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/document',
          description: {
            'ko-KR': '텍스트',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/navigation/1.0/objects/extensions/document-info': [
              {
                id: '텍스트 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
              {
                id: '텍스트 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 과제 제출 결과
          'http://aidtbook.kr/xapi/profiles/navigation/1.0/results/extensions/document-detail': [
            {
              id: '텍스트 id',
              'aitutor-recommended': true,
              duration: 2839, // 텍스트 조회 시간
              attempt: 1, //텍스트 조회 횟수
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }
  //경로 did
  async getNavigationDidXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, NavigationDidId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/navigation/1.0/verbs/did',
        display: {
          'en-US': 'did',
        },
      },
      object: {
        //해당 학생이 조회한 이미지 id
        id: NavigationDidId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/practice',
          description: {
            'ko-KR': '실습',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/navigation/1.0/objects/extensions/practice-info': [
              {
                id: '실습 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
              {
                id: '실습 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 실습 조회 결과
          'http://aidtbook.kr/xapi/profiles/navigation/1.0/results/extensions/practice-detail': [
            {
              id: '실습 id',
              'aitutor-recommended': true,
              duration: 2839, // 실습 조회 시간
              attempt: 1, //실습 조회 횟수
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }
  //경로 learned
  async getNavigationLearnedXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, NavigationLearnedId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/navigation/1.0/verbs/learned',
        display: {
          'en-US': 'learned',
        },
      },
      object: {
        //해당 학생이 조회한 기타 학습 id
        id: NavigationLearnedId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/etc-content',
          description: {
            'ko-KR': '기타 학습 콘텐츠',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/navigation/1.0/objects/extensions/etc-content-info': [
              {
                id: '콘텐츠 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
              {
                id: '콘텐츠 id',
                difficulty: 3,
                'difficulty-min': 1,
                'difficulty-max': 5,
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
                common: true,
              },
            ],
          },
        },
      },
      result: {
        extensions: {
          // 실습 조회 결과
          'http://aidtbook.kr/xapi/profiles/navigation/1.0/results/extensions/etc-content-detail': [
            {
              id: '콘텐츠 id',
              'aitutor-recommended': true,
              duration: 2839, // 콘텐츠 조회 시간
              attempt: 1, //콘텐츠 조회 횟수
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  //목표 option
  async getObjectiveXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, ObjectSetId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/objective/1.0/verbs/set',
        display: {
          'en-US': 'set',
        },
      },
      object: {
        //해당 학생이 조회한 기타 학습 id
        id: ObjectSetId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/objective',
          description: {
            'ko-KR': '학습 목표',
          },
        },
      },
      result: {
        extensions: {
          // 학습 목표 설정 결과
          'http://aidtbook.kr/xapi/profiles/objective/1.0/results/extensions/objective-detail': [
            {
              type: 'D',
              content: '일주일간 매일 수학 문제 10문제씩 풀기',
              timestamp: '2024-04-08T04:38:16',
              'revision-cnt': 3,
              'visit-cnt': 5,
              completion: '달성 실패',
            },
            {
              type: 'S',
              content: '일주일간 매일 수학 문제 10문제씩 풀기',
              timestamp: '2024-04-08T04:38:16',
              'revision-cnt': 0,
              'visit-cnt': 5,
              completion: '달성',
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  //질의 searched option, asked 필수
  async getQueryAskedXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, QueryAskedId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/query/1.0/verbs/asked',
        display: {
          'en-US': 'asked',
        },
      },
      object: {
        //해당 학생이 조회한 기타 학습 id
        id: QueryAskedId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/question',
          description: {
            'ko-KR': '질문',
          },
        },
      },
      result: {
        extensions: {
          // 컨텐츠 검색 결과
          'http://aidtbook.kr/xapi/profiles/query/1.0/results/extensions/ask-detail': [
            {
              timestamp: '2024-04-08T04:38:16',
              answer: true,
              duration: 10,
              satisfaction: 1.0,
            },
            {
              timestamp: '2024-04-08T04:38:16',
              answer: false,
            },
          ],
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  // 교수활동 feedback 옵션, reorganized 필수
  async getTeachingReorganizedXApi4User(userUuid: string, partnerId: string, transferTimestamp: string, TeachingReorganizedId: string) {
    return {
      timestamp: transferTimestamp,
      actor: {
        objectType: 'Agent',
        account: {
          // aidt 개발사 homepage
          homePage: process.env.MATU_HOME_PAGE,
          name: userUuid,
        },
      },
      verb: {
        id: 'http://aidtbook.kr/xapi/profiles/teaching/1.0/verbs/reorganized',
        display: {
          'en-US': 'reorganized',
        },
      },
      object: {
        //해당 학생이 조회한 기타 학습 id
        id: TeachingReorganizedId,
        objectType: 'Activity',
        definition: {
          type: 'http://aidtbook.kr/xapi/activity-type/class',
          description: {
            'ko-KR': '수업과정',
          },
          // 영상별 meta 데이터 리스트 채우기
          extensions: {
            'http://aidtbook.kr/xapi/profiles/teaching/1.0/objects/extensions/class-info': [
              {
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
              },
              {
                'curriculum-standard-id': ['M1ADEASGEA', 'M2ETYQXAQER'],
              },
            ],
          },
        },
      },
      context: {
        platform: '해피에듀테크',
        extensions: {
          'http://aidtbook.kr/xapi/profiles/cmn/1.0/contexts/extensions/partner-id': partnerId,
        },
      },
    };
  }

  async makeChunkData(objectData: object, chunkIndex: number, transferId: string) {
    const textEncoder = new TextEncoder();
    const chunkSize = textEncoder.encode(JSON.stringify(objectData)).length.toString(16);
    const chunkData = JSON.stringify(objectData);

    await this.chunkDataQueryRepository.createChunkData(chunkData, chunkIndex, chunkSize, transferId);
    return chunkSize + '\r\n' + chunkData + '\r\n';
  }

  async fakeCreateChunkedDataAll(userUuid: string, partnerId: string, transferId: string, partnerAccessToken: string) {
    const transferTimestamp = '2024-07-03T11:00:00.000+00:00'; //new Date().toISOString();
    const mediaId = 'http://example.com/240408-media-550e8400-e29b-41d4-a716-446655440000';
    const media = await this.getMediaXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assessment = await this.getAssessmentXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assignmentGave = await this.getAssignmentGaveXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const assignmentFinish = await this.getAssignmentFinishedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationView = await this.getNavigationViewedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationRead = await this.getNavigationReadXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationDid = await this.getNavigationDidXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const navigationLearned = await this.getNavigationLearnedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const objectSet = await this.getObjectiveXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const queryAsk = await this.getQueryAskedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);
    const teachingRec = await this.getTeachingReorganizedXApi4User(userUuid, partnerId, transferTimestamp, mediaId);

    // eslint-disable-next-line prefer-const
    let largeTestData: string = '';
    let temp_data;
    for (let i = 0; i < 500; i++) {
      temp_data = await this.makeChunkData(media, 1 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(assessment, 2 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(assignmentGave, 3 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(assignmentFinish, 4 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(navigationView, 5 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(navigationRead, 6 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(navigationDid, 7 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(navigationLearned, 8 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(objectSet, 9 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(queryAsk, 10 + i * 11, transferId);
      largeTestData += temp_data;
      temp_data = await this.makeChunkData(teachingRec, 11 + i * 11, transferId);
      largeTestData += temp_data;
    }
    return await this.DataApi007(transferId, 1, partnerAccessToken, largeTestData);
  }
}
