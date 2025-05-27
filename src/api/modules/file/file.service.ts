import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS, { S3 } from 'aws-sdk';
import { BucketName } from './dto';
@Injectable()
export class FileService {
  s3Client: S3;
  constructor(private configService: ConfigService) {
    // AWS S3 클라이언트 초기화. 환경 설정 정보를 사용하여 AWS 리전, Access Key, Secret Key를 설정.
    this.s3Client = new S3({
      credentials: {
        accessKeyId: this.configService.get('NCLOUD_ACCESS_KEY') ?? '', // Access Key
        secretAccessKey: this.configService.get('NCLOUD_SECRET_KEY') ?? '', // Secret Key
      },
      region: this.configService.get('NCLOUD_REGION'),
      endpoint: new AWS.Endpoint(this.configService.get('NCLOUD_OBJECT_STORAGE_ENDPOINT') ?? ''), // S3 엔드포인트
    });
  }

  async getUploadUrl(directory: string, fileName: string, expires: number, bucketName: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mime = require('mime-types');

    const fileType = mime.lookup(fileName) || 'application/octet-stream';

    if (this.doesRequireVideoType(bucketName) && (!fileType || !fileType.includes('video'))) {
      throw new BadRequestException('답변 영상을 업로드할 때에는 영상 파일만 올려야 합니다.');
    }

    if (this.doesRequireImageType(bucketName) && (!fileType || !fileType.includes('image'))) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
    }

    // 버킷 유무 확인

    const result = await this.s3Client.listBuckets().promise();

    if (
      !result.Buckets?.map((v) => {
        return v.Name;
      }).includes(bucketName)
    ) {
      // 버킷 없으면 생성

      await this.s3Client
        .createBucket({
          Bucket: bucketName,
          CreateBucketConfiguration: {},
        })
        .promise();
      await this.s3Client
        .putBucketCors({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['PUT', 'POST', 'DELETE', 'GET'],
                AllowedOrigins: this.configService.get('BUCKET_ALLOWED_ORIGINS').split(','),
              },
            ],
          },
        })
        .promise();
    }

    return await this.s3Client.getSignedUrlPromise('putObject', {
      Bucket: bucketName,
      Key: `${directory}/${fileName}`,
      Expires: expires,
      ContentType: !fileType ? 'application/octet-stream' : fileType,
    });
  }

  async getDownloadUrl(filePath: string, expires: number, bucketName: string) {
    return await this.s3Client.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: filePath,
      Expires: expires,
    });
  }

  protected doesRequireVideoType(bucketName: string) {
    return (
      bucketName === BucketName.Answers ||
      bucketName === BucketName.CommonConceptVideos ||
      bucketName === BucketName.SharedConceptVideos ||
      bucketName === BucketName.ConceptSolutionVideos
    );
  }

  protected doesRequireImageType(bucketName: string) {
    return bucketName === BucketName.ProfileImage;
  }
}
