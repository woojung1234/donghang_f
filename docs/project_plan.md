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
- [x] **마이페이지 정보 표시 및 프로필 수정 기능 완료** ✨👤
  - **문제 해결**: 회원가입 시 입력한 성별, 나이, 지병 정보가 마이페이지에 표시되지 않음
  - **정보 표시 개선**:
    * MyBasicInfo.js에 이름, 성별, 나이, 지병 필드 추가
    * 나이 자동 계산 함수 구현 (생년월일 → 나이 변환)
    * 전화번호 하이픈 포맷팅 유지
    * 지병 정보 표시 (없으면 "없음" 표시)
  - **프로필 수정 기능 추가**:
    * ProfileEdit.js 컴포넌트 새로 생성
    * 이름, 전화번호, 생년월일, 성별, 지병 수정 가능
    * 실시간 유효성 검사 및 에러 처리
    * 백엔드 API 연동 (PUT /api/v1/users)
  - **UI/UX 개선**:
    * 프로필 수정 버튼 추가
    * 수정 모드와 조회 모드 토글 기능
    * 취소/저장 버튼으로 직관적 조작
    * 로딩 상태 표시 및 에러 메시지 처리
  - **CSS 스타일링**:
    * 프로필 수정 폼 전용 스타일 추가
    * 입력 필드, 버튼 스타일링 개선
    * 반응형 디자인 적용
  - **로그 시스템**: 모든 이벤트에 콘솔 로그 추가로 디버깅 용이성 향상
  - **코드 구조 개선**: MyExtraInfo 컴포넌트 제거하고 MyBasicInfo로 통합
- [x] **금복이 자연스러운 대화 및 복지로 사이트 이동 기능 완료** ✨🤖
  - **자연스러운 대화 기능**:
    * "안녕?" → "안녕하세요! 오늘 기분은 어떠신가요? 필요한 정보가 있으시면 언제든 말씀해주세요! 😊"
    * "넌 뭘할수있어?" → "저는 주로 복지서비스 정보 안내와 금융 서비스 지원을 도와드릴 수 있어요! 혹시 구체적으로 필요한 내용을 알려주시면 더 자세히 도와드릴게요! 😊"
    * 감사 인사, 기분 문의, 날씨 관련 질문 등에 자연스러운 응답
    * 하드코딩 없이 AI가 다양한 응답 생성 (랜덤 선택으로 자연스러움 구현)
  - **복지로 사이트 이동 기능**:
    * "복지로 사이트로 이동해줘" → "복지로 사이트로 이동할 준비가 되었어요! 이동을 원하시면 확인 부탁드릴게요!"
    * 음성 응답 후 팝업창 자동 표시
    * "예/아니오" 버튼으로 사용자 확인
    * "예" 클릭 시 새 탭에서 https://www.bokjiro.go.kr 자동 이동
    * 팝업 닫힌 후 음성 인식 자동 재시작
  - **백엔드 AI 서비스 개선**:
    * analyzeWelfarePortalRequest() 함수로 복지로 이동 요청 감지
    * generateNaturalGreeting(), generateCapabilityResponse() 함수로 자연스러운 응답 생성
    * getNaturalResponse() 함수로 기존 딱딱한 응답을 자연스럽게 개선
    * 우선순위 기반 메시지 처리 (인사 → 기능문의 → 복지로이동 → 기타)
  - **프론트엔드 UI/UX 개선**:
    * VoiceChat.js에 confirmModal 상태 추가
    * Modal 컴포넌트를 활용한 깔끔한 확인 팝업
    * 팝업 스타일링으로 사용자 친화적 인터페이스
    * chatScript.js에 showWelfarePortalConfirm() 함수로 팝업 처리
  - **사용자 경험 향상**:
    * 음성 + 팝업 + 자동 이동의 자연스러운 플로우
    * 사용자 의도를 정확히 파악하여 적절한 응답 제공
    * 대화의 연속성과 자연스러움 확보
- [x] **음성 응답 이모티콘 제거 완료** ✨🔇
  - **문제**: 음성으로 답변할 때 "지구본", "별표", "웃는얼굴" 등 이모티콘이 그대로 읽혀서 부자연스러움
  - **해결**: 모든 AI 응답에서 이모티콘 완전 제거
    * generateNaturalGreeting(): 인사 응답 이모티콘 제거
    * generateCapabilityResponse(): 기능 소개 응답 이모티콘 제거
    * generateWelfarePortalResponse(): 복지로 이동 응답 이모티콘 제거
    * formatSimpleWelfareRecommendation(): 복지서비스 추천 이모티콘 제거
    * getDefaultActivityRecommendation(): 기본 활동 추천 이모티콘 제거
    * generateSmartResponse(): 소비내역 저장 응답 이모티콘 제거
    * getNaturalResponse(): 일반 응답 이모티콘 제거
    * getOfflineResponse(): 오프라인 응답 이모티콘 제거
  - **결과**: 
    * "안녕하세요! 오늘 기분은 어떠신가요?" (자연스러운 음성)
    * "복지로 사이트로 이동할 준비가 되었어요!" (깔끔한 음성)
    * "5000원 점심 지출을 가계부에 저장했어요!" (명확한 음성)
  - **개선 효과**: 음성 합성 시 자연스럽고 깔끔한 발음으로 사용자 경험 향상
- [x] **소비내역 조회 기능 수정 완료** ✨💰
  - **문제**: "내 소비내역 알려줘", "한달 소비내역 알려달라고" 입력 시 일반 응답만 나오고 소비내역 조회가 안됨
  - **원인**: processMessage 함수에서 소비내역 조회 로직이 빠져있었음
  - **해결 작업**:
    * `isExpenseInquiry()`: 소비내역 조회 요청 감지 함수 추가
    * `getExpenseHistory()`: 소비내역 조회 함수 추가  
    * `analyzePeriodFromMessage()`: 메시지에서 기간 분석 함수 추가
    * `formatExpenseHistory()`: 조회 결과 포맷팅 함수 추가
    * processMessage 함수에 소비내역 조회 로직 우선순위 6번으로 추가
  - **지원하는 조회 패턴**:
    * "내 소비내역 알려줘" → 최근 30일 소비내역
    * "오늘 소비내역" → 오늘 소비내역
    * "이번달 소비내역" → 이번달 소비내역
    * "지난주 소비내역" → 지난주 소비내역
  - **응답 포맷**:
    * 총 소비 금액 및 거래 건수
    * 카테고리별 소비 통계 (상위 3개)
    * 최근 거래 내역 (최대 5개)
    * 소비내역 페이지 안내
  - **결과**: 음성/텍스트로 "내 소비내역 알려줘" 입력 시 정상적으로 소비내역 조회 및 음성 응답 제공
- [x] **음성 응답 자연스러움 개선 완료** ✨🎙️
  - **문제**: 음성 응답에서 `\n\n` (줄바꿈), `.00원` (소수점) 등이 부자연스럽게 읽혀짐
  - **개선 작업**:
    * `formatExpenseHistory()`: 줄바꿈 제거하고 자연스러운 문장으로 변경
    * `generateSmartResponse()`: Math.floor()로 소수점 제거
    * 리스트 형식 → 자연스러운 대화체로 변경
    * 거래 내역 개수 5개 → 3개로 줄여서 음성 길이 단축
  - **변경 전**:
    ```
    최근 소비내역을 알려드릴게요.\n\n총 소비 금액: 7,244,000원\n총 19건의 거래\n\n카테고리별 소비:\n1. 의료비: 7,000,000원 (97%)\n2. 식비: 144,000원 (2%)\n3. 쇼핑: 100,000원 (1%)\n\n최근 거래 내역:\n1. 5월 26일 - 일반음식점: 50000.00원 (식비)
    ```
  - **변경 후**:
    ```
    최근 소비내역을 알려드릴게요. 총 소비 금액은 7,244,000원이고, 총 19건의 거래가 있었습니다. 카테고리별로 보면 의료비가 7,000,000원으로 97퍼센트, 식비가 144,000원으로 2퍼센트, 쇼핑이 100,000원으로 1퍼센트입니다. 최근 거래를 보면 5월 26일에 일반음식점에서 50,000원, 5월 26일에 일반음식점에서 9,000원, 5월 26일에 일반음식점에서 10,000원을 사용하셨네요.
    ```
  - **개선 효과**: 음성 합성 시 자연스러운 대화체로 들려서 사용자 경험 대폭 향상

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
- 2025-05-27: **회원가입 정보 입력 개선** ✨
  - **추가된 필드**: 생년월일, 성별 입력 필드 추가
  - **프론트엔드 개선**:
    * InfoInput.js에 생년월일(date input), 성별(select) 필드 추가
    * 필드 validation 로직 업데이트 (모든 필드 필수)
    * CSS 스타일링 개선 (date input, select 요소)
  - **백엔드 개선**:
    * users.js 라우터에 생년월일, 성별 validation 추가
    * 기존 User 모델에 이미 userBirth, userGender 필드 존재 확인
  - **DB 구조**: 별도 수정 불필요 (이미 필드 존재)
  - **입력 필드**: 이름, 전화번호, 생년월일, 성별 (4개 필드 모두 필수)
- 2025-05-27: **지병 선택 페이지 추가** ✨🏥
  - **새로운 페이지**: `/signup/diseaseselect` 추가
  - **회원가입 플로우 개선**:
    * infoinput → diseaseselect → verifycode 순서로 변경
    * 기존: infoinput → verifycode
    * 개선: infoinput → diseaseselect → verifycode
  - **지병 선택 기능**:
    * 카테고리별 질병 분류 (만성질환, 중증질환, 정신건강, 기타)
    * 복수 선택 가능
    * "없음" 선택 시 다른 선택 자동 해제
    * 선택된 항목 실시간 요약 표시
  - **포함된 질병**: 당뇨병, 고혈압, 심장병, 관절염, 뇌졸중, 암, 신장질환, 간질환, 폐질환, 골다공증, 우울증, 치매, 기타
  - **UI/UX**: 직관적인 선택 인터페이스, 카테고리별 그룹핑, 선택 상태 시각적 피드백
  - **데이터 저장**: 기존 User 모델의 `userDisease` 필드 활용
  - **라우팅 업데이트**: App.js, SignUpHeader.js, 네비게이션 링크 모두 수정 완료
  - **UI 개선**: 직접 입력 필드 추가, 이전/다음 버튼 하단 고정
    * 직접 입력 필드로 목록에 없는 질병 추가 가능
    * "없음" 선택 시 직접 입력 필드 비활성화
    * 버튼을 화면 하단에 고정하여 스크롤과 관계없이 접근 가능
