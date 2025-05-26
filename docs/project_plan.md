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
