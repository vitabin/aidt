export class GetLearningHistoryOfUserResponseDto {
  userUuid!: string;
  histories!: LearningHistory[];
}

export class LearningHistory {
  loginTime?: Date;
  logoutTime?: Date;
  learningTimeInSecond?: number;
}
