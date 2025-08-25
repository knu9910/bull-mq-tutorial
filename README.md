# SecureBank 개인정보 암호화 프로젝트

BullMQ를 사용한 대용량 고객 데이터 배치 암호화 처리 시스템입니다.

## 🏦 프로젝트 개요

- **목적**: 개인정보보호법 대응을 위한 고객 데이터 암호화
- **대상**: 20,000명의 고객 데이터 (이름, 이메일, 전화번호, 주민번호 뒷자리, 주소)
- **암호화 방식**: AES-256-GCM
- **처리 방식**: BullMQ를 사용한 배치 처리 (100개씩 200개 작업으로 분할)

## 🚀 주요 기능

- 대용량 고객 데이터 생성 (한국인/외국인 혼합)
- Redis 기반 작업 큐 관리
- CPU 사용률 제한 (50% 이하)
- 실시간 진행률 모니터링
- 실패 시 자동 재시도 (최대 3회)
- 로깅 및 모니터링

## 📋 요구사항

- Node.js 18.0.0 이상
- Redis 서버
- pnpm 패키지 매니저

## 🛠️ 설치 및 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

```bash
cp env.example .env
# .env 파일을 편집하여 실제 값으로 설정
```

### 3. Redis 서버 실행

```bash
# Docker를 사용하는 경우
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 또는 로컬 Redis 서버 실행
redis-server
```

## 📜 사용법

### 개발 모드 실행

```bash
pnpm dev
```

### 데이터 생성만 실행

```bash
pnpm generate-data
```

### 프로덕션 빌드 및 실행

```bash
pnpm build
pnpm start
```

### 타입 체크

```bash
pnpm type-check
```

## 🏗️ 프로젝트 구조

```
bull-mq/
├── bull-mq.ts          # 메인 애플리케이션
├── package.json        # 프로젝트 설정
├── tsconfig.json       # TypeScript 설정
├── .eslintrc.js        # ESLint 설정
├── .prettierrc         # Prettier 설정
├── .gitignore          # Git 제외 파일
├── env.example         # 환경 변수 예시
├── README.md           # 프로젝트 문서
└── dist/               # 빌드 출력 (자동 생성)
```

## 🔧 스크립트 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 모드 (파일 변경 감지) |
| `pnpm build` | TypeScript 컴파일 |
| `pnpm start` | 컴파일된 코드 실행 |
| `pnpm generate-data` | 고객 데이터 생성 |
| `pnpm type-check` | 타입 체크 |
| `pnpm clean` | 빌드 파일 정리 |

## 🔐 보안 고려사항

- 고객 데이터 파일은 `.gitignore`에 포함
- 암호화 키는 환경 변수로 관리
- 로그 파일에 민감 정보 노출 금지

## 📊 성능 지표

- **처리 속도**: 100개씩 배치 처리
- **동시성**: 최대 4개 작업 동시 실행
- **CPU 제한**: 50% 이하 사용률 유지
- **타임아웃**: 작업당 최대 5분

## 🤝 기여 방법

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성
3. 코드 작성 및 테스트
4. Pull Request 생성

## 📄 라이선스

ISC License

## 📞 문의

SecureBank Development Team
