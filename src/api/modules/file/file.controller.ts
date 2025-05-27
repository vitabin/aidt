import { Controller, Get, HttpException, HttpStatus, Query, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { BucketName, GetDownloadUrlDto, GetUploadUrlDto, GetUploadUrlResponseDto } from './dto';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('file')
@Controller({ path: 'file', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @ApiOperation({
    summary: 'PUT 메서드로 S3에 직접 파일을 업로드할 수 있는 URL을 얻는 API입니다.',
    description: `PUT 메서드로 S3에 직접 파일을 업로드할 수 있는 URL을 얻는 API입니다.\n
    url이 올 텐데 해당 url로 PUT 메서드를 이용하셔서 data에 파일만 첨부하셔서 올리시면 됩니다.\n
    주의하실 점은 header에 Content-Type을 삭제하고 요청하셔야 합니다. 왜 그런지는 저도 잘 몰라요...`,
  })
  @Get('upload')
  async getUploadUrl(@Query() dto: GetUploadUrlDto, @UUIDHeader() uuid: string): Promise<GetUploadUrlResponseDto> {
    const { bucketName, curriculumId, problemId, fileName } = dto;
    if (this.doesRequireProblemId(bucketName) && !problemId) {
      throw new HttpException('답변 영상을 업로드할 때에는 problemId를 반드시 포함해주세요.', HttpStatus.BAD_REQUEST);
    }

    if (this.doesRequireCurriculumId(bucketName) && !curriculumId) {
      throw new HttpException('공지사항이나 프로필 사진을 올리는 게 아니면 curriculumId를 반드시 포함해주세요.', HttpStatus.BAD_REQUEST);
    }

    const constructedFilePath = this.constructFilePath(curriculumId, problemId, uuid);

    const signed = await this.fileService.getUploadUrl(constructedFilePath, fileName, 3600, bucketName);

    return { url: signed, filePath: constructedFilePath + `/${fileName}` };
  }

  @ApiOperation({
    summary: 'GET 메서드로 S3에 업로드된 파일의 URL을 얻는 API입니다.',
    description: `GET 메서드로 S3에 업로드된 파일의 URL을 얻는 API입니다.\n
    filePath와 Bucket 이름을 넣으면 1시간 동안 작동하는 다운로드 url을 받을 수 있습니다.`,
  })
  @Get('download')
  async getDownalodUrl(@Query() dto: GetDownloadUrlDto) {
    return await this.fileService.getDownloadUrl(dto.filePath, 3600, dto.bucketName);
  }

  protected constructFilePath(curriculumId: string | undefined, problemId: string | undefined, uuid: string): string {
    return problemId ? `${curriculumId}/${problemId}/${uuid}` : curriculumId ? `${curriculumId}/${uuid}` : uuid;
  }

  protected doesRequireProblemId(bucketName: string) {
    return bucketName === BucketName.Answers || bucketName === BucketName.ConceptSolutionVideos;
  }

  protected doesRequireCurriculumId(bucketName: string) {
    return (
      bucketName === BucketName.Answers ||
      bucketName === BucketName.CommonConceptVideos ||
      bucketName === BucketName.SharedConceptVideos ||
      bucketName === BucketName.ConceptSolutionVideos ||
      bucketName === BucketName.ReferenceData
    );
  }
}
