import { ConceptType, Difficulty, PrismaClient, ProblemType } from '@prisma/client';
import { class_grades, classes, pseudoConcepts, pseudoProblems, pseudoSchools, pseudoUUIDs, semester_grades, semester_year, semesters } from './seed.data';
import { fancyWelcomeMessage, seedLog } from './seed.util';


export async function seed_checkDB(client: PrismaClient) {
  fancyWelcomeMessage();
  seedLog('\n@ DB 연결 및 구조 확인...', true);
  await client.$queryRaw`select 1+1`;
  await client.$queryRaw`select * from user limit 1`;
  await client.$queryRaw`select * from problem limit 1`;
  await client.$queryRaw`select * from concept limit 1`;
  seedLog('DB 연결 및 구조 정상✅');
}

export async function seed_truncate(client: PrismaClient, isDataModified?: string) {
  if (isDataModified) {
    // TODO: 사용자가 데이터를 입력했을 가능성 있음. 시딩에서 넣은 데이터만 지우는 코드로 수정해야 함
    seedLog('\n@ cleaning up...', true);
    await client.user.deleteMany();
    await client.problem.deleteMany();
    await client.concept.deleteMany();
    await client.common_concept_video.deleteMany();
    seedLog('cleaning up 완료✅');
    return;
  }
  seedLog('\n@ 기존 시딩 확인...', true);
  const res = await client.user.findFirst({
    where: {
      user_uuid: {
        in: pseudoUUIDs,
      },
    },
  });
  seedLog(`기존 시딩 확인 완료 - ${!!res ? '시딩 건너뜀 😎' : '시딩 시작 ✅'}`);
  return !!res;
}

export async function seed_user(client: PrismaClient) {
  seedLog('\n@ user TABLE', true);
  for await (const item of pseudoUUIDs) {
    const index = pseudoUUIDs.indexOf(item) + 1;
    await client.user.create({
      data: {
        user_uuid: item,
      },
    });
    seedLog(`[USER ${index}/${pseudoUUIDs.length}] ${item} ...생성됨✅`);
  }
}

export async function seed_problem(client: PrismaClient) {
  seedLog('\n@ problem TABLE', true);
  const allDifficulty: Difficulty[] = Object.values(Difficulty);
  const allProblemType: ProblemType[] = Object.values(ProblemType);

  let index = 0;
  let itemIndex = 1;
  for await (const item of pseudoProblems) {
    for await (const difficulty of allDifficulty) {
      for await (const type of allProblemType) {
        index++;
        await client.problem.create({
          data: {
            difficulty,
            latex_data: item,
            answer_data: '1',
            answer_type: 'SELECT',
            cls_id: 'M3MATA01B01C0' + itemIndex,
            type,
            target_grade: itemIndex % 3,
            target_semester: 1,
            ai_hint: 'SEED로 자동 생성된 AI 힌트입니다.',
            content_status: 'ACTIVED',
            detail_solution: 'SEED로 자동 생성된 상세해설입니다.',
            explanation: 'SEED로 자동 생성된 문제 설명입니다.',
            is_algeomath: false,
            is_ebs: false,
            manage_no: '1',
          },
        });
        seedLog(
          `[PROBLEM ${index}/${pseudoProblems.length * allDifficulty.length * allProblemType.length
          }] ${itemIndex}번 문제 값으로 난이도 : ${difficulty} 문제타입 : ${type} ...생성됨✅`,
        );
      }
    }
    itemIndex++;
  }
}

export async function seed_common_concept(client: PrismaClient) {
  seedLog('\n@ common_concept TABLE', true);
  const checkAlready = await client.concept.findFirst({
    where: {
      cls_id: 'MOCK_CLS_1',
    },
  });
  if (checkAlready) {
    seedLog('common_concept 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
    return;
  }
  const allConceptType: ConceptType[] = Object.values(ConceptType);

  let index = 0;
  let itemIndex = 1;
  for await (const item of pseudoConcepts) {
    for await (const type of allConceptType) {
      index++;
      const created_common_concept = await client.concept.create({
        data: {
          type,
          type_name: type.toString(),
          latex_data: item,
          created_by: 1,
          cls_id: 'MOCK_CLS_' + index,
          content_status: 'ACTIVED',
        },
      });
      await client.common_concept_video.create({
        data: {
          concept_id: created_common_concept?.id || 0,
          video_path: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          subtitle_path: 'EXAMPLE_SUBTITLE_PATH',
          sign_video_path: 'EXAMPLE_SIGN_VIDEO_PATH',
          status: 'DONE',
          created_by: 1,
          commentary: 'EXAMPLE COMMENTARY',
          title: 'EXAMPLE 개념 공통 인강 영상',
        },
      });
      seedLog(
        `[PROBLEM ${index}/${pseudoConcepts.length * allConceptType.length}] ${itemIndex}번 개념, 개념 타입 : ${type} 및 개념 공통 인강 영상 ...생성됨✅`,
      );
    }
    itemIndex++;
  }
}

export async function seed_school(client: PrismaClient) {
  seedLog('\n@ school TABLE', true);

  const checkAlready = await client.school.findFirst({
    where: {
      school_id: 'MOCK0'
    }
  });
  if (checkAlready) {
    seedLog('School 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
    return;
  }

  let i = 0;
  for await (const school of pseudoSchools) {
    await client.school.create({
      data: {
        school_id: `MOCK${i}`,
        school_name: school[0],
        division_type: school[1],
      }
    })
    i++;
  }
  seedLog(`${pseudoSchools.length}개의 school ...생성됨✅`);
}

export async function seed_semester(client: PrismaClient) {
  seedLog('\n@ semester TABLE', true);
  const checkAlready = await client.semester.findFirst({
    where: {
      id: 1,
    }
  });
  if (checkAlready) {
    seedLog('semester 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
    return;
  }

  for (const grade of semester_grades) {
    for (const semester of semesters) {
      await client.semester.create({
        data: {
          year: semester_year,
          grade: grade.toString(),
          semester: semester.toString(),
          begin_date: new Date(),
          end_date: new Date(),
          desc: `${semester_year}-${grade}-${semester}`,
        }
      })
      seedLog(`[SEMESTER] ${semester_year}-${grade}-${semester} ...생성됨✅`);
    }
  }
}

export async function seed_learning_system(client: PrismaClient) {
  seedLog('\n@ std_learning_sys_pack TABLE', true);

  const checkStdLearningSysPack = await client.std_learning_sys_pack.findFirst({
    where: {
      id: 1,
    }
  });

  if (checkStdLearningSysPack) {
    seedLog('std_learning_sys_pack 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
  } else {
    await client.std_learning_sys_pack.create({
      data: {
        id: 1,
        cls_id: 'MOCK_CLS_ID',
        name: '시드 표준학습체계 팩',
        publish_at: new Date(),
        desc: '시딩된 가상 표준학습체계 팩입니다.',
        is_activate: true,
      }
    })
    seedLog(`[STD_LEARNING_SYS_PACK] MOCK_CLS_ID ...생성됨✅`)
  }

  seedLog('\n@ std_learning_sys_pack TABLE', true);

  const checkLearningSysPack = await client.learning_sys_pack.findFirst({
    where: {
      id: 1,
    }
  });

  if (checkLearningSysPack) {
    seedLog('learning_sys_pack 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
  } else {
    await client.learning_sys_pack.create({
      data: {
        id: 1,
        std_learning_sys_pack_id: 1,
        name: '시드 학습체계 팩',
        desc: '시딩된 가상 학습체계 팩입니다.',
        is_activate: true,
        is_deleted: false,
      }
    })
    seedLog(`[LEARNING_SYS_PACK] ID 1 ...생성됨✅`)
  }

  const checkLearningSysDoc = await client.learning_sys_doc.findFirst({
    where: {
      id: 1,
    }
  });

  if (checkLearningSysDoc) {
    seedLog('learning_sys_doc 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
  } else {
    await client.learning_sys_doc.create({
      data: {
        id: 1,
        learning_sys_pack_id: 1,
        name: '시드 과목',
        desc: '시딩된 가상 과목입니다.',
        is_deleted: false,
      }
    })
    seedLog(`[LEARNING_SYS_DOC] ID 1 ...생성됨✅`)
  }

  const checkLearningMap = await client.learning_map.findFirst({
    where: {
      learning_sys_doc_id: 1,
      semester_id: 1,
    }
  });

  if (checkLearningMap) {
    seedLog('learning_map 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
  } else {
    await client.learning_map.create({
      data: {
        learning_sys_doc_id: 1,
        semester_id: 1,
        name: '시드 과목 개념',
        subject: '시드 과목',
        desc: '시딩된 가상 과목 개념입니다.',
      }
    })
    seedLog(`[LEARNING_MAP] LEARNING_SYS_DOC_ID 1에 연결된 LEARNING_MAP ...생성됨✅`)
  }

}

export async function seed_school_class(client: PrismaClient) {
  seedLog('\n@ class TABLE', true);

  const checkAlready = await client.school_class.findFirst({
    where: {
      school_id: 1,
    }
  });
  if (checkAlready) {
    seedLog('class 테이블에 시딩 데이터가 있습니다. 시딩 Skip 😎');
    return;
  }

  let i = 0;

  const schools = await client.school.findMany();
  for await (const school of schools) {
    const already = await client.school_class.findFirst({
      where: {
        school_id: school.id,
      }
    });
    if (already) continue;
    for await (const grade of class_grades) {
      for await (const classNum of classes) {
        await client.school_class.create({
          data: {
            school_id: school.id,
            grade: grade.toString(),
            class: classNum.toString(),
            learning_map_id: 1,
          }
        })
        i++;
      }
    }
  }
  seedLog(`${i}개의 class ...생성됨✅`);
}