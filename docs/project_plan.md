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
- [ ] **리팩토링된 시스템 테스트** 🔧
  - [ ] 새로운 백엔드 AI 서비스 API 테스트
  - [ ] 프론트엔드 chatScript_new.js 적용 및 테스트
  - [ ] 기존 chatScript.js → chatScript_new.js 교체
  - [ ] 대화형 시스템 정상 작동 확인
  - [ ] 소비내역 입력/조회 기능 테스트
- [ ] 로그 설정 구성
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
- 2025-05-26: AI 챗봇 소비내역 조회 기능 대폭 개선 ✅
  - 기간별 소비내역 조회 지원 (오늘/어제/이번주/지난주/이번달/지난달)
  - 구체적 월 지정 지원 ("4월 소비 리포트", "3월 내역" 등)  
  - 이번주 날짜 계산 로직 수정 (월요일~일요일 전체 주 표시)
  - 사용자 요청에 맞는 적절한 응답 포맷 구현
  - 일반 조회 vs 리포트 조회 구분 처리
  - 날짜별 그룹핑 및 음성 친화적 응답 생성
  - 카테고리별 통계 분석 및 퍼센트 계산 기능
  - 과거 날짜 소비내역 입력 기능 추가 ✨
    * "어제 5천원 점심 먹었어", "3일전 2만원 쇼핑했어" 등
    * "5월 20일에 1만원 썼어", "15일에 커피 마셨어" 등
    * 프론트엔드: parseExpenseFromInput 함수 날짜 파싱 기능 추가
    * 백엔드: ConsumptionController, ConsumptionService transactionDate 지원
- 2025-05-26: 대화형 소비내역 입력 시스템 구현 완료 ✨
  - 날짜 없는 소비내역 입력 시 AI가 날짜 확인하는 대화 플로우 추가
  - 사용자: "8000원 점심 먹었어" → AI: "언제 드셨나요?" → 사용자: "어제" → AI: "5월 25일로 저장했어요!"
  - 대화 상태 관리 시스템 (pendingExpenseData, waitingForDateConfirmation)
  - 날짜 파싱 확장 ("오늘", "어제", "3일 전", "5월 20일" 등)
  - 사용자 친화적 날짜 확인 메시지 생성
  - 기존 날짜 포함 소비내역은 즉시 저장 (기존 기능 유지)
  - chatScript.js 완전 재작성으로 대화형 시스템 구현
- 2025-05-27: **구조 리팩토링 완료** ✨🏗️
  - **문제**: 프론트엔드에 비즈니스 로직과 서비스 로직이 과도하게 집중됨
  - **백엔드 개선**:
    * `aiChatService.js` 생성 - AI 처리 로직 백엔드로 이관
    * 소비내역 파싱, 날짜 계산, 카테고리 추론 로직 백엔드로 이동
    * 대화형 처리, 응답 생성 로직 백엔드로 이동
    * `consumptionService.js`에 기간별 날짜 범위 계산 함수 추가
    * `aiChatController.js`, `aiChatRoutes.js` 생성
    * API 엔드포인트: `/api/v1/ai-chat/message`, `/api/v1/ai-chat/reset-session`
  - **프론트엔드 단순화**:
    * `chatScript_new.js` 생성 - UI 로직만 남기고 비즈니스 로직 제거
    * 백엔드 API 호출 중심으로 단순화
    * 음성 인식, UI 상태 관리만 프론트엔드에서 처리
    * 서비스 로직은 백엔드 API로 완전 이관
  - **아키텍처 개선**:
    * 관심사 분리: UI ↔ 비즈니스 로직 완전 분리
    * 확장성 향상: 비즈니스 로직 중앙화
    * 유지보수성 개선: 단일 책임 원칙 적용
