# 스키마 관리 레포지토리

## 프리즈마 사용

### 1. 로컬 개발

#### 개인

1. `prisma/schema.prisma` 파일 수정
1. `npx prisma generate` 명령어로 prisma client 생성
1. 디비 스키마 실제 변경. 아래 중의 택일하여 개발할 수 있음.
    1. `npx prisma migrate dev` 명령어로 db schema 변경
    1. `npx prisma db push` 명령어로 db schema 변경
    1. 디비를 직접 수정 후, `npx prisma db pull` 명령어로 schema.prisma 파일 업데이트
1. 개발 완료
1. `npx prisma migrate dev` 명령어로 db migration 폴더 및 파일 생성
    1. 같은 명령어로 개발했었다면, 생성되었던 migration을 삭제하고 다시 생성하여 최종적인 migration을 생성
1. 커밋

### 2. 명령어 추가 설명

- `npx prisma generate`: prisma client 생성
- `npx prisma migrate dev`: db schema 변경과 migration 생성
- `npx prisma db push`: db schema 변경
- `npx prisma db pull`: schema.prisma 파일 업데이트

### 3. 주의사항

- `prisma/schema.prisma` 수정할 시 반드시 migration을 생성하고 같이 커밋 할 것
- migration 파일은 생성 후 수정하거나 삭제하지 말 것
  - migration 파일을 수정하거나 삭제할 시, 다른 개발자, 개발계, 운영계에 영향을 줄 수 있음
  - 사용자에게 서비스 하는 상황에서는 migration 파일 수정 및 삭제를 금지
  - 반드시 필요한 경우, 담당자와 상의 후 일정을 잡고 진행할 것

### 4. 잘못 작성된 migration 수정 방법

1. `schema.prisma` 파일에 잘못 반영된 내용를 정상화 처리
1. `npx prisma migrate dev` 를 통해서 수정사항을 새로운 migrations 추가
