import { ProblemSolvingScope, VideoProcessingStatus } from '@prisma/client';
import { EProblemSolvingScope, EVideoProcessingStatus, fromDBProblemSolvingScope, fromDBVideoProcessingStatus } from './concept-video.entity';

describe('fromDBVideoProcessingStatus', () => {
  it('DB VideoProcessingStatus를 EVideoProcessingStatus로 올바르게 변환해야 합니다', () => {
    expect(fromDBVideoProcessingStatus(VideoProcessingStatus.IDLE)).toBe(EVideoProcessingStatus.IDLE);
    expect(fromDBVideoProcessingStatus(VideoProcessingStatus.PROCESSING)).toBe(EVideoProcessingStatus.PROCESSING);
    expect(fromDBVideoProcessingStatus(VideoProcessingStatus.DONE)).toBe(EVideoProcessingStatus.DONE);
    expect(fromDBVideoProcessingStatus(VideoProcessingStatus.ERROR)).toBe(EVideoProcessingStatus.ERROR);
  });
});

describe('fromDBProblemSolvingScope', () => {
  it('DB ProblemSolvingScope를 EProblemSolvingScope로 올바르게 변환해야 합니다', () => {
    expect(fromDBProblemSolvingScope(ProblemSolvingScope.ME)).toBe(EProblemSolvingScope.ME);
    expect(fromDBProblemSolvingScope(ProblemSolvingScope.ALL)).toBe(EProblemSolvingScope.ALL);
    expect(fromDBProblemSolvingScope(ProblemSolvingScope.CLASS)).toBe(EProblemSolvingScope.CLASS);
  });
});
