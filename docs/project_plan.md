# 동행 프로젝트 계획서

## 프로젝트 개요
- **프로젝트명**: 동행 (donghang)
- **타입**: React 프론트엔드 + Node.js/Express 백엔드
- **포트**: 백엔드(9090), 프론트엔드(3000)

## 프로젝트 구조
```
donghang_f/
├── AI-main/          # FastAPI 기반 AI 서버 (포트 8000)
├── backend-main/     # Node.js/Express 백엔드 (포트 9090)
├── frontend-main/    # React 프론트엔드 (포트 3000)
├── docs/            # 프로젝트 문서
└── logs/            # 로그 파일
```

## 실행 방법
### AI 서버 (첫 번째)
```bash
cd AI-main
pip install -r requirements.txt
python app/main.py  # http://localhost:8000
```

### 백엔드 서버 (두 번째)
```bash
cd backend-main
npm install
npm run dev  # http://localhost:9090
```

### 프론트엔드 (세 번째)
```bash
cd frontend-main
npm install  
npm start   # http://localhost:3000
```

## 주요 기능
- **AI 챗봇 서비스** (FastAPI/Python)
  - OpenAI GPT 모델 통합
  - 챗봇 API: `/api/v1/chatbot/chatting`
  - TTS (텍스트 음성 변환)
- **백엔드 API** (Node.js/Express)
  - 사용자 인증 시스템
  - JWT 토큰 기반 인증
  - PostgreSQL/SQLite 데이터베이스 지원
  - SMS 인증 (CoolSMS)
  - API 문서화 (Swagger)
- **프론트엔드** (React)
  - 사용자 인터페이스
  - AI 챗봇 연동
  - 음성 인식 및 합성

## 완료된 작업
- [x] 프로젝트 구조 분석 완료
- [x] docs 폴더 생성
- [x] logs 폴더 생성
- [x] project_plan.md 초기 생성
- [x] OpenAI API 키 테스트 완료 ✅
  - 65개 모델 접근 가능 (GPT-4.5, GPT-4.1, O3, O4-mini 등)
- [x] AI 서버 실행 문제 해결 ✅
  - __init__.py 파일 생성으로 패키지 구조 수정
  - http://127.0.0.1:8000 에서 정상 실행 중
  - 챗봇 서비스 사용 가능

## 해야 할 작업
- [x] 백엔드 서버 실행 테스트
- [x] 프론트엔드 실행 테스트
- [x] API 연결 상태 확인 
- [x] 음성 소비내역 입력 문제 해결 ✅
  - 환경변수 API URL 수정 (9090 → 5000)
- [x] AI 서버 TTS 오류 해결 ✅
  - TTS 라우터 임시 비활성화 (모델 파일 없음)
  - 브라우저 기본 TTS 사용으로 전환
- [x] 소비내역 페이지 오류 수정 ✅
  - ConsumList 컴포넌트 API 응답 구조 불일치 해결
  - 필드명 변경: cardHistoryAmount → amount, transactionDate 등
- [ ] 로그 설정 구성
- [x] SQLite 완전 제거 및 PostgreSQL 전환 ✅
  - SQLite 데이터베이스 파일 삭제 (donghang.db, knockknock.db)
  - package.json에서 sqlite3 의존성 제거
  - seed-sqlite 스크립트 제거
  - database.js를 PostgreSQL 전용으로 설정
- [ ] 데이터베이스 연결 확인

## 테스트 계정
- 아이디: example@example.com
- 비밀번호: testpassword

## 최근 업데이트
- 2025-05-25: 프로젝트 초기 분석 및 실행 방법 정리
- 2025-05-25: 음성 소비내역 입력 문제 해결
  - API URL 환경변수 수정 (localhost:9090 → localhost:5000)
  - 음성 입력 → 소비내역 표시 연동 확인
- 2025-05-26: 음성채팅 UI 개선 ✅
  - 전송 버튼 텍스트 가로 표시 CSS 수정
  - writing-mode: horizontal-tb 적용으로 "전송" 텍스트 정상 표시
- 2025-05-26: 소비내역 조회 오류 수정 ✅
  - ConsumptionController.js에서 `consumptionNo` → `consumption_no` 컬럼명 수정
  - NotificationController.js에서 `notificationNo` → `notification_no` 컬럼명 수정
  - ConsumptionService.js 완전 재작성 (구 모델 → 신 모델 구조로 변경)
    - `consumptionAmount` → `amount`
    - `consumptionCategory` → `category`
    - `consumptionDescription` → `memo`
    - `consumptionDate` → `transactionDate`
  - PostgreSQL DATE_TRUNC 함수 단위 수정 (`'DATE'` → `'day'`, `'WEEK'` → `'week'`, `'MONTH'` → `'month'`)
  - 라우트 우선순위 수정 (`/stats/:period`, `/report`, `/analysis`를 `/:consumptionId`보다 앞에 배치)
  - 데이터베이스 컬럼명과 Sequelize 쿼리 일치성 확보
- 2025-05-26: 텍스트 입력 및 소비내역 조회 기능 추가 ✅
  - chatScript.js에 소비내역 조회 함수 추가 (`getExpenseHistory`, `isExpenseInquiry`, `formatExpenseHistory`)
  - processAIResponse 함수에 소비내역 조회 로직 추가
  - 텍스트 입력으로도 소비내역 입력 및 조회 가능
  - "현재 내 소비내역 알려줄래?" 같은 질문에 실제 데이터 응답
- 2025-05-26: /consumption 페이지 UI 개선 ✅
  - 카테고리별 소비 현황(막대 차트) 제거
  - 소비 추이(라인 차트), 카테고리별 소비 비율(도넛 차트), 요약 정보 유지
  - 파이 차트를 도넛 차트로 개선 (중앙에 총 소비 금액 표시)
  - ConsumList(소비 내역 리스트)와 카테고리 필터 유지
  - 차트 제목 "소비 현황" → "소비 분석"으로 변경
- 2025-05-26: 금액 표시 포맷팅 개선 ✅
  - 모든 금액 표시에서 .00 소수점 제거
  - ConsumList.js, ConsumCard.js, ConsumDetailModal.js, ExpenseChart.js 수정
  - Math.floor()와 parseFloat() 사용하여 정수 변환 처리
  - 천 단위 콤마 구분자 유지
- 2025-05-26: 미사용 API 경로 정리 ✅
  - `/api/v1/match` 경로가 사용되지 않음을 확인
  - 프론트엔드, 백엔드, AI 서버 전체에서 해당 API 호출 코드 없음
  - 백엔드에서 해당 경로에 대한 명시적 차단 미들웨어 추가 (410 상태코드)
  - 불필요한 API 요청으로 인한 404 에러 방지
