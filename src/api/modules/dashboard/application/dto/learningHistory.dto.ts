import { ApiProperty } from '@nestjs/swagger';

export class TotalHistory {
  totalPreviousLevel = 0;
  totalAfterLevel = 0;
  totalConceptVideo = 0;
  totalConceptExplain = 0;
  totalBasic = 0;
  totalIncorrectBasic = 0;
  totalConfirm = 0;
  totalIncorrectConfirm = 0;
  totalFeedback = 0;
  totalIncorrectFeedback = 0;
  totalAdditional = 0;
  totalIncorrectAdditional = 0;
  totalMetaCognition = 0;
  totalMetaCognitionMiss = 0;
  totalParticipate = 0;
  totalParticipateTime = 0;
  totalAssignment = 0;
  totalIncorrectAssignment = 0;

  static of(total: TotalHistory): HistoryItem {
    const dto = new HistoryItem();
    dto.previousAchievementLevel = total.totalPreviousLevel;
    dto.afterAchievementLevel = total.totalAfterLevel;
    dto.concepStudyExplain = total.totalConceptExplain;
    dto.concepStudyVideo = total.totalConceptVideo;
    dto.studyParticipate = total.totalParticipateTime;
    dto.numStudyParticipate = total.totalParticipate;
    dto.numBasic = total.totalBasic;
    dto.numIncorrectBasic = total.totalIncorrectBasic;
    dto.numConfirm = total.totalConfirm;
    dto.numIncorrectConfirm = total.totalIncorrectConfirm;
    dto.numFeedback = total.totalFeedback;
    dto.numIncorrectFeedback = total.totalIncorrectFeedback;
    dto.numAdditional = total.totalAdditional;
    dto.numIncorrectAdditional = total.totalIncorrectAdditional;
    dto.metacognition = total.totalMetaCognition;
    dto.metacognitionMiss = total.totalMetaCognitionMiss;
    dto.numAssignment = total.totalAssignment ?? 0;
    dto.numIncorrectAssignment = total.totalIncorrectAssignment ?? 0;
    return dto;
  }
}

export class HistoryItem {
  @ApiProperty({ description: '해당 유저의 이전 단원 학습단계' })
  previousAchievementLevel!: number;

  @ApiProperty({ description: '해당 유저의 현재 단원 학습단계' })
  afterAchievementLevel!: number;

  @ApiProperty({ description: '해당 유저의 현재 단원 개념학습 영상 시청 여부' })
  concepStudyVideo!: number;

  @ApiProperty({ description: '해당 유저의 현재 단원 개념학습 풀이영상 공유 여부' })
  concepStudyExplain!: number;

  @ApiProperty({ description: '해당 유저의 로그인-로그아웃 시간의 합' })
  studyParticipate!: number;

  @ApiProperty({ description: '해당 유저의 로그인-로그아웃 횟수' })
  numStudyParticipate!: number;

  @ApiProperty({ description: '기본문제 수' })
  numBasic!: number;

  @ApiProperty({ description: '오답 기본문제 수' })
  numIncorrectBasic!: number;

  @ApiProperty({ description: '확인문제 수' })
  numConfirm!: number;

  @ApiProperty({ description: '오답 확인문제 수' })
  numIncorrectConfirm!: number;

  @ApiProperty({ description: '피드백문제 수' })
  numFeedback!: number;

  @ApiProperty({ description: '오답 피드백문제 수' })
  numIncorrectFeedback!: number;

  @ApiProperty({ description: '추가문제 수' })
  numAdditional!: number;

  @ApiProperty({ description: '오답 추가문제 수' })
  numIncorrectAdditional!: number;

  @ApiProperty({ description: '메타인지를 풀 수 있음으로 체크한 수' })
  metacognition!: number;

  @ApiProperty({ description: '메타인지를 풀 수 있음으로 체크하고 오답인 수' })
  metacognitionMiss!: number;

  @ApiProperty({ description: '전체 과제 수' })
  numAssignment?: number;

  @ApiProperty({ description: '오답 과제 수' })
  numIncorrectAssignment?: number;
}

export class AverageHistoryItem {
  @ApiProperty({ description: '학급 전체의 이전 단원 학습단계 평균' })
  meanPreviousAchievementLevel?: number;

  @ApiProperty({ description: '학급 전체의 현재 단원 학습단계' })
  meanAfterAchievementLevel?: number;

  @ApiProperty({ description: '학급 전체의 현재 단원 개념학습 영상 시청 여부 비율' })
  meanConcepStudyVideo?: number;

  @ApiProperty({ description: '학급 전체의 현재 단원 개념학습 풀이영상 공유 비율' })
  meanConcepStudyExplain?: number;

  @ApiProperty({ description: '평균 기본문제 수' })
  meanBasic?: number;

  @ApiProperty({ description: '평균 오답 기본문제 수' })
  meanIncorrectBasic?: number;

  @ApiProperty({ description: '평균 확인문제 수' })
  meanConfrim?: number;

  @ApiProperty({ description: '평균 오답 확인문제 수' })
  meanIncorrectConfrim?: number;

  @ApiProperty({ description: '평균 피드백문제 수' })
  meanFeedback?: number;

  @ApiProperty({ description: '평균 오답 피드백문제 수' })
  meanIncorrectFeedback?: number;

  @ApiProperty({ description: '평균 추가문제 수' })
  meanAdditional?: number;

  @ApiProperty({ description: '평균 오답 추가문제 수' })
  meanInccorectAdditional?: number;

  @ApiProperty({ description: '해당 학급의 메타인지를 풀 수 있음으로 체크한 평균' })
  meanMetacognition?: number;

  @ApiProperty({ description: '해당 학급의 메타인지를 풀 수 있음으로 체크하고 오답인 평균' })
  meanMetacognitionMiss?: number;

  @ApiProperty({ description: '해당 학급의 평균 로그인 시간' })
  meanParticipate?: number;

  @ApiProperty({ description: '해당 학급의 평균 로그인-로그아웃 횟수' })
  meanParticipateTimes?: number;

  @ApiProperty({ description: '해당 학급의 평균 과제 수' })
  meanAssignment?: number;

  @ApiProperty({ description: '해당 학급의 평균 오답 과제 수' })
  meanIncorrectAssignment?: number;

  static create(totalHistory: TotalHistory, numUuids: number) {
    const dto = new AverageHistoryItem();
    dto.meanPreviousAchievementLevel = totalHistory.totalPreviousLevel / numUuids;
    dto.meanAfterAchievementLevel = totalHistory.totalAfterLevel / numUuids;
    dto.meanConcepStudyVideo = totalHistory.totalConceptVideo / numUuids;
    dto.meanConcepStudyExplain = totalHistory.totalConceptExplain / numUuids;
    dto.meanBasic = totalHistory.totalBasic / numUuids;
    dto.meanIncorrectBasic = totalHistory.totalIncorrectBasic / numUuids;
    dto.meanConfrim = totalHistory.totalConfirm / numUuids;
    dto.meanIncorrectConfrim = totalHistory.totalConfirm / numUuids;
    dto.meanFeedback = totalHistory.totalFeedback / numUuids;
    dto.meanIncorrectFeedback = totalHistory.totalIncorrectFeedback / numUuids;
    dto.meanAdditional = totalHistory.totalAdditional / numUuids;
    dto.meanInccorectAdditional = totalHistory.totalIncorrectAdditional / numUuids;
    dto.meanMetacognition = totalHistory.totalMetaCognition / numUuids;
    dto.meanMetacognitionMiss = totalHistory.totalMetaCognitionMiss / numUuids;
    dto.meanParticipate = totalHistory.totalParticipateTime / numUuids;
    dto.meanParticipateTimes = totalHistory.totalParticipate / numUuids;
    dto.meanAssignment = totalHistory.totalAssignment / numUuids;
    dto.meanIncorrectAssignment = totalHistory.totalIncorrectAssignment / numUuids;

    return dto;
  }
}

export class LearningHistoryDto {
  @ApiProperty({ description: '해당 유저의 uuid' })
  uuid!: string;

  @ApiProperty({ description: '해당 단원의 learningSysId' })
  learningSysId!: number;

  @ApiProperty({ description: '특정 유저의 참여학습 내역' })
  historyItem!: HistoryItem;

  @ApiProperty({ description: '학급 전체의 평균 참여학습 내역' })
  meanHistoryItem?: AverageHistoryItem;

  static create(uuid: string, learningSysId: number, historyItem: HistoryItem) {
    const dto = new LearningHistoryDto();
    dto.uuid = uuid;
    dto.learningSysId = learningSysId;
    dto.historyItem = historyItem;
    return dto;
  }
}
