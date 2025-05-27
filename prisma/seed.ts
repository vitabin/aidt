import { PrismaClient } from "@prisma/client";
import {
  seed_checkDB,
  seed_common_concept,
  seed_learning_system,
  seed_problem,
  seed_school,
  seed_school_class,
  seed_semester,
  seed_truncate,
  seed_user,
} from "./seed.service";

/**
 * user, problem, concept 테이블에 seed data를 넣습니다.
 *
 * problem은 모두 SHORT 타입, 답은 "1"로 고정되었습니다.
 * seed.data.ts 의 pseudoProblems 의 (index % 3) 을 한 값이 grade 값으로 들어갑니다.
 *
 * pseudoProblems, pseudoConcepts 배열의 인덱스 값이 n으로 들어갑니다.
 *
 * IS_DATA_MODIFIED 환경변수가 존재할 경우, 데이터를 초기화합니다.
 * 변경이 필요할 경우 이상호(운영계), 구성모(개발계)에게 전달 필요함
 *
 * 작업자: 왕정희
 * 수정: 이상호 240626
 */

const client = new PrismaClient();

/**
 * !!!!!!!!!! 주의사항 !!!!!!!!!!
 * 아래의 시드 테이블 순서를 변경하면 안됩니다.
 * FK 제약조건에 맞도록 순서를 맞춰서 시딩하기 때문에
 * 순서를 변경하면 제약조건에 걸려서 시딩이 되지 않습니다.
 * 특히 school-semester-learning_system-school_class 순서는 변경하면 안됩니다.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  await seed_checkDB(client);
  const seedAlready = await seed_truncate(client, process.env.IS_DATA_MODIFIED);
  if (!seedAlready) {
    await seed_user(client);
    await seed_problem(client);
  }

  //순서 중요
  await seed_common_concept(client);
  await seed_school(client);
  await seed_semester(client);
  await seed_learning_system(client);
  await seed_school_class(client);
}

main()
  .then(async () => {
    await client.$disconnect();
  })
  .catch(async (e: Error) => {
    await client.$disconnect();
    process.exit(1);
  })
  .finally(() => client.$disconnect);
