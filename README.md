# 매튜 (matu)

## 로컬에서 서버 실행 환경 테스트하기

### 명령어

```bash
echo "DATABASE_URL=mysql://root:matumatu@mysql:3306/matumatu" > .env
docker compose up -d
```

### 추가 설명

- `compose.yaml` 파일에는 서버 환경과 같은 버전의 mysql, redis 가 실행된다.
- `.env` 파일에는 mysql 접속 정보가 저장된다.
- 파일을 수정하면, 핫 리로드가 되어 수정된 내용이 반영된다.

### swagger

- swagger 접속
- localhost:3000/api-docs#/
