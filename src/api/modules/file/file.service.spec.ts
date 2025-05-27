import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';
import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { BadRequestException } from '@nestjs/common';
import { BucketName } from './dto';

describe('FileService', () => {
  let service: FileService;
  const url = 'https://mock-url.com';
  const downloadUrl = 'https://mock-url.com/download';
  const directory = 'test-directory';
  const expires = 3600;
  const bucketName = 'test-bucket';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService, ConfigService],
    }).compile();

    service = module.get<FileService>(FileService);

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('S3', 'listBuckets', (promise) => {
      return {
        promise: () =>
          Promise.resolve({
            Buckets: [{ Name: bucketName }],
          }),
      };
    });

    AWSMock.mock('S3', 'createBucket', (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock('S3', 'putBucketCors', (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock('S3', 'getSignedUrlPromise', (operation, params) => {
      if (operation === 'putObject') {
        return Promise.resolve(url);
      } else if (operation === 'getObject') {
        return Promise.resolve(downloadUrl);
      }
    });
  });

  afterEach(() => {
    AWSMock.restore('S3');
  });

  it('정의되어야 합니다', () => {
    expect(service).toBeDefined();
  });

  it('MIME 타입이 video가 아닌 경우 오류를 발생시켜야 합니다', async () => {
    const invalidFileName = 'test-file.txt';
    await expect(service.getUploadUrl(directory, invalidFileName, expires, BucketName.Answers)).rejects.toThrow(BadRequestException);
    await expect(service.getUploadUrl(directory, invalidFileName, expires, BucketName.ConceptSolutionVideos)).rejects.toThrow(BadRequestException);
  });
});
