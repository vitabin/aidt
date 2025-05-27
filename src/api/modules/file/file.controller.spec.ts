import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { GetUploadUrlDto, GetDownloadUrlDto, GetUploadUrlResponseDto, BucketName } from './dto';
import { HttpException } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

describe('FileController', () => {
  let controller: FileController;
  let service: FileService;
  const uuid = 'uuid-123';
  const curriculumId = 'curriculum123';
  const problemId = 'problem123';
  const fileName = 'test-file.mp4';
  const filePath = 'test-directory/test-file.mp4';
  const expires = 3600;
  const downloadUrl = 'https://mock-url.com/download';
  const uploadUrl = 'https://mock-url.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            getUploadUrl: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    controller = module.get<FileController>(FileController);
    service = module.get<FileService>(FileService);
  });

  it('정의되어야 합니다', () => {
    expect(controller).toBeDefined();
  });

  describe('constructFilePath', () => {
    it('problemId가 제공된 경우 파일 경로를 올바르게 구성해야 합니다', () => {
      const result = controller['constructFilePath'](curriculumId, problemId, uuid);
      expect(result).toBe(`${curriculumId}/${problemId}/${uuid}`);
    });

    it('problemId가 제공되지 않은 경우 파일 경로를 올바르게 구성해야 합니다', () => {
      const result = controller['constructFilePath'](curriculumId, undefined, uuid);
      expect(result).toBe(`${curriculumId}/${uuid}`);
    });
  });

  describe('getUploadUrl', () => {
    it('Answers 버킷의 경우 problemId가 누락되면 오류를 발생시켜야 합니다', async () => {
      const dto: GetUploadUrlDto = {
        bucketName: BucketName.Answers,
        curriculumId,
        problemId: '',
        fileName,
      };

      await expect(controller.getUploadUrl(dto, uuid)).rejects.toThrow(HttpException);
      await expect(controller.getUploadUrl(dto, uuid)).rejects.toThrow('답변 영상을 업로드할 때에는 problemId를 반드시 포함해주세요.');
    });

    it('ConceptSolutionVideos 버킷의 경우 problemId가 누락되면 오류를 발생시켜야 합니다', async () => {
      const dto: GetUploadUrlDto = {
        bucketName: BucketName.ConceptSolutionVideos,
        curriculumId,
        problemId: '',
        fileName,
      };

      await expect(controller.getUploadUrl(dto, uuid)).rejects.toThrow(HttpException);
      await expect(controller.getUploadUrl(dto, uuid)).rejects.toThrow('답변 영상을 업로드할 때에는 problemId를 반드시 포함해주세요.');
    });

    it('올바른 매개변수로 FileService.getUploadUrl을 호출해야 합니다', async () => {
      const dto: GetUploadUrlDto = {
        bucketName: BucketName.ReferenceData,
        curriculumId,
        problemId,
        fileName,
      };

      const constructedFilePath = `${curriculumId}/${problemId}/${uuid}`;
      const expectedResponse: GetUploadUrlResponseDto = { url: uploadUrl, filePath: constructedFilePath + '/fileName' };
      (service.getUploadUrl as jest.Mock).mockResolvedValue(uploadUrl);

      const result = await controller.getUploadUrl(dto, uuid);

      expect(service.getUploadUrl).toHaveBeenCalledWith(constructedFilePath, fileName, expires, dto.bucketName);
      expect(result).toEqual(expectedResponse);
    });

    it('Answers 버킷의 경우 올바른 매개변수로 FileService.getUploadUrl을 호출해야 합니다', async () => {
      const dto: GetUploadUrlDto = {
        bucketName: BucketName.Answers,
        curriculumId,
        problemId,
        fileName,
      };

      const constructedFilePath = `${curriculumId}/${problemId}/${uuid}`;
      const expectedResponse: GetUploadUrlResponseDto = { url: uploadUrl, filePath: constructedFilePath + '/fileName' };
      (service.getUploadUrl as jest.Mock).mockResolvedValue(uploadUrl);

      const result = await controller.getUploadUrl(dto, uuid);

      expect(service.getUploadUrl).toHaveBeenCalledWith(constructedFilePath, fileName, expires, dto.bucketName);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getDownloadUrl', () => {
    it('올바른 매개변수로 FileService.getDownloadUrl을 호출해야 합니다', async () => {
      const dto: GetDownloadUrlDto = {
        filePath,
        bucketName: BucketName.Answers,
      };

      await controller.getDownalodUrl(dto);

      expect(service.getDownloadUrl).toHaveBeenCalledWith(dto.filePath, expires, dto.bucketName);
    });

    it('다운로드 URL을 반환해야 합니다', async () => {
      const dto: GetDownloadUrlDto = {
        filePath,
        bucketName: BucketName.ReferenceData,
      };

      jest.spyOn(service, 'getDownloadUrl').mockResolvedValue(downloadUrl);

      const result = await controller.getDownalodUrl(dto);

      expect(result).toBe(downloadUrl);
    });
  });
});
