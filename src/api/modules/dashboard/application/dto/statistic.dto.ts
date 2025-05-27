import { ApiProperty } from '@nestjs/swagger';

export class StatisticItem {
  @ApiProperty({ description: '그래프에 필요한 컬럼별 아이템 이름', examples: ['LEVEL', 'CORRECT_RATE', 'METACOGNITION', 'PROGRESS'] })
  itemName!: string;

  @ApiProperty({ description: '유저가 설정한 목표' })
  goal!: number;

  @ApiProperty({ description: '유저의 달성도' })
  userAchievement?: number | null;

  @ApiProperty({ description: '학급 평균 달성도' })
  classAchievement!: number;

  static create(itemName: string, meanAchievement: number, goal: number, userAchievement?: number) {
    const dto = new StatisticItem();
    dto.itemName = itemName;
    dto.goal = goal;
    dto.userAchievement = userAchievement;
    dto.classAchievement = meanAchievement;

    return dto;
  }
}

export class StatisticDto {
  @ApiProperty({ description: '유저 uuid' })
  userUuid?: string;

  @ApiProperty({ description: '해당 단원 id' })
  learningSysId!: number;

  @ApiProperty({ description: '해당 단원 명' })
  learningSysName!: string | null;

  @ApiProperty({ description: '그래프 컬럼별 데이터' })
  statisticItems!: StatisticItem[];

  static create(learningSysId: number, learningSysName: string, statisticItems: StatisticItem[], userUuid?: string) {
    const dto = new StatisticDto();
    dto.userUuid = userUuid;
    dto.learningSysId = learningSysId;
    dto.learningSysName = learningSysName;
    dto.statisticItems = statisticItems;

    return dto;
  }
}
