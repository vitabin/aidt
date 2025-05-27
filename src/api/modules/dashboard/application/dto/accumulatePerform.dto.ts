import { ApiProperty } from '@nestjs/swagger';
import { Difficulty, problem, study_perform, study_problem } from '@prisma/client';
import { IsArray, IsNumber } from 'class-validator';

// type ProblemSovlxing = problem & { shared_solution_video: shared_solution_video[] };

export class AccumulatePerformDto {
  @ApiProperty({ description: '최상 난이도 문제 학급 평균 풀이 수의 몫, 학급의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  highestMean!: number[];

  @ApiProperty({ description: '최상 난이도 문제 나의 풀이 수, 나의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  highestMy!: number[];

  @ApiProperty({ description: '상 난이도 문제 학급 평균 풀이 수의 몫, 학급의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  highMean!: number[];

  @ApiProperty({ description: '상 난이도 문제 나의 풀이 수, 나의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  highMy!: number[];

  @ApiProperty({ description: '중 난이도 문제 학급 평균 풀이 수의 몫, 학급의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  middleMean!: number[];

  @ApiProperty({ description: '중 난이도 문제 나의 풀이 수, 나의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  middleMy!: number[];

  @ApiProperty({ description: '하 난이도 문제 학급 평균 풀이 수의 몫, 학급의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  lowMean!: number[];

  @ApiProperty({ description: '하 난이도 문제 나의 풀이 수, 나의 정답률' })
  @IsArray()
  @IsNumber({}, { each: true })
  lowMy!: number[];

  static create(
    classSolvings: problem[],
    userSolvings: problem[],
    classSolvedProblems: study_problem[],
    userSolvedProblems: study_problem[],
    classPerforms: study_perform[],
    userPerforms: study_perform[],
    numClassUuid: number,
  ) {
    const dto = new AccumulatePerformDto();
    const calculate = AccumulatePerformDto.calcuateByDifficulty;
    //학급 평균
    dto.highestMean = calculate(classSolvings, classSolvedProblems, classPerforms, true, Difficulty.HIGHEST, numClassUuid);
    dto.highMean = calculate(classSolvings, classSolvedProblems, classPerforms, true, Difficulty.HIGH, numClassUuid);
    dto.middleMean = calculate(classSolvings, classSolvedProblems, classPerforms, true, Difficulty.MIDDLE, numClassUuid);
    dto.lowMean = calculate(classSolvings, classSolvedProblems, classPerforms, true, Difficulty.LOW, numClassUuid);

    //나의 것
    dto.highestMy = calculate(userSolvings, userSolvedProblems, userPerforms, false, Difficulty.HIGHEST, numClassUuid);
    dto.highMy = calculate(userSolvings, userSolvedProblems, userPerforms, false, Difficulty.HIGH, numClassUuid);
    dto.middleMy = calculate(userSolvings, userSolvedProblems, userPerforms, false, Difficulty.MIDDLE, numClassUuid);
    dto.lowMy = calculate(userSolvings, userSolvedProblems, userPerforms, false, Difficulty.LOW, numClassUuid);
    return dto;
  }

  static calcuateByDifficulty(
    problems: problem[],
    bridge: study_problem[],
    performs: study_perform[],
    isClassMean: boolean,
    difficulty: Difficulty,
    numClassUuid: number,
  ) {
    //난이도로 필터링
    //반환값 예시 : [나의 풀이수,나의 정답률] 또는 [학급 평균 풀이수, 학급 평균 정답률] 꼴로 와야한다.

    //풀이수 구하기
    const difficultyFilteredProblems = problems.filter((v) => v.difficulty === difficulty);
    let plainCount = difficultyFilteredProblems.length;
    //만약 학급 평균을 구해야한다면
    if (isClassMean) plainCount = plainCount > 0 ? Math.floor(plainCount / numClassUuid) : 0;

    // 정답률 구하기
    // 먼저 problemIds 를 구한다.
    const difficultyFilteredProblemsIds = difficultyFilteredProblems.map((v) => v.id);
    // performIds 를 구하기 위해 bridge에 조회
    const bridgeFiltered = bridge.filter((v) => difficultyFilteredProblemsIds.includes(v.problem_id));
    const bridgeFilteredIds = bridgeFiltered.map((v) => v.id);
    const performFiltered = performs.filter((v) => bridgeFilteredIds.includes(v.study_problem_id));
    const performFilteredCorrect = performFiltered.filter((v) => v.is_correct === 1);

    //정답률을 이제서야 계산
    let correctRate = 0;
    if (isClassMean) {
      correctRate = performFilteredCorrect.length > 0 ? performFilteredCorrect.length / numClassUuid / (performFiltered.length / numClassUuid) : 0;
    } else {
      correctRate = performFilteredCorrect.length > 0 ? performFilteredCorrect.length / performFiltered.length : 0;
    }

    return [plainCount, Number((correctRate * 100).toFixed(1))];
  }
}
