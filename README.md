# 🤖 금복이 (KumBoki) - 고령층을 위한 음성 기반 생활 관리 플랫폼

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
</div>

## 📋 프로젝트 개요

**금복이**는 디지털 소외계층인 고령층을 위한 **음성 우선 인터페이스** 기반의 종합 생활 관리 플랫폼입니다.

### 🎯 주요 기능
- 🎤 **음성 기반 소비 관리**: 말로 간편하게 가계부 작성
- 🤖 **AI 챗봇 상담**: 건강, 복지 관련 24시간 상담 서비스
- 📋 **복지 서비스 예약**: 가사돌봄, 간병서비스 등 통합 예약
- 📱 **PWA 지원**: 앱스토어 없이 모바일 앱처럼 사용
- 🔒 **생체인증**: 지문, 얼굴인식으로 간편 로그인

### 🌟 차별화 포인트
- **고령층 맞춤 UI/UX**: 큰 글씨, 간단한 버튼, 직관적 네비게이션
- **음성 우선 설계**: 터치 조작 최소화
- **오프라인 지원**: 네트워크 불안정 시에도 기본 기능 사용 가능
- **통합 서비스**: 여러 앱을 설치할 필요 없는 올인원 솔루션

## 🏗️ 시스템 아키텍처

```mermaid
graph TD
    A[📱 Frontend<br/>React.js + PWA] --> B[🌐 API Gateway<br/>CORS + Rate Limiting]
    B --> C[💻 Backend API<br/>Node.js + Express]
    B --> D[🤖 AI Service<br/>Python + FastAPI]
    C --> E[🗄️ Database<br/>PostgreSQL + Sequelize]
    C --> F[📁 File Storage<br/>Local + Cloud Ready]
    D --> G[🧠 ML Models<br/>KoGPT + Speech API]
    
    H[📡 Service Worker] --> A
    I[🔔 Push Notifications] --> A
    J[📊 Monitoring & Logs] --> C
    J --> D
```

### 🔧 기술 스택

#### Frontend
- **React.js 18.3.1**: 컴포넌트 기반 UI 개발
- **React Router 6**: SPA 라우팅
- **Context API**: 전역 상태 관리
- **PWA**: 모바일 앱 경험 제공
- **Web Speech API**: 음성 인식/합성

#### Backend
- **Node.js 20.x**: 서버 사이드 JavaScript
- **Express.js**: 웹 프레임워크
- **Sequelize ORM**: 데이터베이스 ORM
- **JWT**: 인증 토큰 관리
- **Multer**: 파일 업로드 처리

#### Database
- **PostgreSQL 15**: 메인 데이터베이스
- **Redis** (예정): 캐싱 및 세션 관리

#### AI Service
- **Python 3.9+**: AI 서비스 개발
- **FastAPI**: 고성능 API 프레임워크
- **Transformers**: 한국어 대화 모델
- **Web Speech API**: 브라우저 기반 음성 처리

#### DevOps
- **Docker**: 컨테이너화
- **GitHub Actions**: CI/CD 파이프라인 (예정)
- **AWS**: 클라우드 인프라 (예정)

## 📁 프로젝트 구조

```
donghang_f/
├── 📱 frontend-main/          # React.js 프론트엔드
│   ├── public/                # 정적 파일
│   ├── src/
│   │   ├── components/        # 공통 컴포넌트
│   │   ├── welfare/          # 복지 서비스 관련
│   │   ├── consume/          # 소비 관리
│   │   ├── chat/             # AI 채팅
│   │   ├── login/            # 인증
│   │   └── services/         # API 서비스
│   └── package.json
│
├── 💻 backend-main/           # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/      # 컨트롤러
│   │   ├── models/           # 데이터 모델
│   │   ├── routes/           # 라우터
│   │   ├── middleware/       # 미들웨어
│   │   └── services/         # 비즈니스 로직
│   ├── sql/                  # DB 스키마
│   └── package.json
│
├── 🤖 AI-main/                # Python AI 서비스
│   ├── app/
│   │   ├── api/              # API 엔드포인트
│   │   ├── service/          # AI 서비스 로직
│   │   └── core/             # 핵심 설정
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📊 logs/                   # 로그 파일
├── 📚 docs/                   # 문서화
│   ├── project_plan.md       # 프로젝트 계획
│   └── professor_qa_guide.md # 질문답변 가이드
│
└── 📄 README.md              # 이 파일
```

## 🚀 시작하기

### 📋 사전 요구사항

- **Node.js** 18.x 이상
- **Python** 3.9 이상
- **PostgreSQL** 13 이상
- **Git**

### 📥 설치 방법

#### 1️⃣ 저장소 클론
```bash
git clone https://github.com/your-username/donghang_f.git
cd donghang_f
```

#### 2️⃣ 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb donghang_db

# 환경변수 설정
cp backend-main/.env.example backend-main/.env
# .env 파일에서 DATABASE_URL 설정
```

#### 3️⃣ 백엔드 서버 시작
```bash
cd backend-main
npm install
npm run dev
# 서버 실행: http://localhost:5000
```

#### 4️⃣ AI 서비스 시작
```bash
cd AI-main
pip install -r requirements.txt
python app/main.py
# AI 서비스 실행: http://localhost:8000
```

#### 5️⃣ 프론트엔드 서버 시작
```bash
cd frontend-main
npm install
npm start
# 웹 앱 실행: http://localhost:3000
```

### 🔧 환경변수 설정

#### Backend (.env)
```env
# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/donghang_db

# JWT 토큰
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h

# API 설정
PORT=5000
NODE_ENV=development

# CORS 설정
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Frontend (.env)
```env
# API 엔드포인트
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_API_URL=http://localhost:8000

# PWA 설정
REACT_APP_PWA_NAME=금복이
REACT_APP_PWA_SHORT_NAME=금복이
```

#### AI Service (.env)
```env
# 서버 설정
HOST=127.0.0.1
PORT=8000

# AI 모델 설정
MODEL_NAME=microsoft/DialoGPT-medium
MAX_LENGTH=512
TEMPERATURE=0.7
```

## 🧪 테스트

### 단위 테스트
```bash
# 프론트엔드 테스트
cd frontend-main
npm test

# 백엔드 테스트
cd backend-main
npm test

# AI 서비스 테스트
cd AI-main
pytest tests/
```

### E2E 테스트
```bash
# 전체 시스템 테스트
npm run test:e2e
```

## 📦 빌드 및 배포

### 🏗️ 프로덕션 빌드
```bash
# 프론트엔드 빌드
cd frontend-main
npm run build

# 백엔드는 Node.js로 직접 실행
cd backend-main
npm start

# AI 서비스 도커 빌드
cd AI-main
docker build -t donghang-ai .
docker run -p 8000:8000 donghang-ai
```

### 🐳 Docker Compose 실행
```bash
# 전체 서비스 한번에 실행
docker-compose up -d

# 서비스 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

## 📊 API 문서

### 🔗 주요 엔드포인트

#### 인증 API
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/refresh` - 토큰 갱신

#### 사용자 API
- `GET /api/v1/users` - 사용자 정보 조회
- `PUT /api/v1/users` - 사용자 정보 수정
- `DELETE /api/v1/users` - 회원 탈퇴

#### 소비 관리 API
- `GET /api/v1/consumption` - 소비 내역 조회
- `POST /api/v1/consumption` - 소비 기록 추가
- `PUT /api/v1/consumption/:id` - 소비 기록 수정
- `DELETE /api/v1/consumption/:id` - 소비 기록 삭제

#### 복지 서비스 API
- `GET /api/v1/welfare` - 복지 서비스 목록
- `POST /api/v1/welfare/reservation` - 복지 서비스 예약
- `GET /api/v1/welfare-book` - 예약 내역 조회
- `DELETE /api/v1/welfare-book/:id` - 예약 취소

#### AI 챗봇 API
- `GET /api/v1/chatbot/chatting` - 챗봇 대화
- `POST /api/v1/conversations` - 대화 내역 저장

### 📖 상세 API 문서
개발 서버 실행 후 다음 URL에서 Swagger 문서 확인:
- Backend API: http://localhost:5000/api-docs
- AI Service API: http://localhost:8000/docs

## 🎨 UI/UX 가이드라인

### 🎯 디자인 원칙
1. **접근성 우선**: WCAG 2.1 AA 수준 준수
2. **큰 글씨**: 최소 18px 이상
3. **고대비**: 명확한 색상 구분
4. **단순함**: 한 화면에 하나의 주요 기능
5. **음성 지원**: 모든 주요 기능에 음성 가이드

### 🎨 색상 팔레트
```css
/* 주요 색상 */
--primary-blue: #0066cc;     /* 주요 버튼 */
--success-green: #51cf66;    /* 성공 메시지 */
--warning-red: #ff6b6b;      /* 경고, 삭제 */
--text-black: #000000;       /* 주요 텍스트 */
--background-white: #ffffff; /* 배경색 */
--gray-light: #f8f9fa;       /* 연한 배경 */
```

### 📱 반응형 브레이크포인트
```css
/* 모바일 우선 설계 */
.container {
  max-width: 100%;
}

/* 태블릿 */
@media (min-width: 768px) {
  .container { max-width: 750px; }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container { max-width: 970px; }
}
```

## 🔒 보안 고려사항

### 🛡️ 보안 기능
- **JWT 토큰**: 24시간 자동 만료
- **CORS 설정**: 허용된 도메인만 접근
- **Rate Limiting**: API 요청 제한
- **Input Validation**: 모든 입력값 검증
- **SQL Injection 방지**: ORM 사용
- **XSS 방지**: 입력값 sanitization

### 🔐 개인정보 보호
- **데이터 암호화**: bcrypt 해싱
- **HTTPS 통신**: 모든 API 암호화
- **최소 수집**: 필요한 정보만 수집
- **데이터 보관**: 법적 요구사항 준수

## 📈 성능 최적화

### ⚡ 프론트엔드 최적화
- **코드 분할**: React.lazy()로 번들 최적화
- **이미지 압축**: 자동 리사이징 및 WebP 변환
- **캐싱**: API 응답 5분간 캐싱
- **PWA**: Service Worker로 오프라인 지원

### 🚀 백엔드 최적화
- **데이터베이스 인덱스**: 자주 조회되는 컬럼
- **커넥션 풀**: 데이터베이스 연결 최적화
- **압축**: gzip 응답 압축
- **로드 밸런싱**: 수평 확장 준비

### 📊 성능 지표
- **페이지 로드 시간**: < 3초
- **API 응답 시간**: < 500ms
- **음성 인식 응답**: < 2초
- **첫 화면 렌더링**: < 1.5초

## 🐛 디버깅 및 로깅

### 📝 로그 레벨
- **ERROR**: 시스템 오류, 예외 상황
- **WARN**: 경고, 주의 필요한 상황
- **INFO**: 일반 정보, 사용자 액션
- **DEBUG**: 개발용 상세 정보

### 🔍 로그 위치
- **프론트엔드**: 브라우저 콘솔 + 서버 전송
- **백엔드**: `logs/backend.log`
- **AI 서비스**: `logs/ai-service.log`
- **데이터베이스**: PostgreSQL 로그

### 🚨 에러 모니터링
```javascript
// 전역 에러 처리
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
  // 서버로 에러 리포트 전송
});

// Promise 에러 처리
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});
```

## 🧪 테스트 전략

### 🔬 테스트 유형
1. **단위 테스트**: 컴포넌트/함수별 테스트
2. **통합 테스트**: API 엔드포인트 테스트
3. **E2E 테스트**: 전체 사용자 시나리오
4. **접근성 테스트**: 스크린 리더, 키보드 네비게이션
5. **성능 테스트**: 로드 테스트, 스트레스 테스트

### 📊 테스트 커버리지 목표
- **프론트엔드**: 80% 이상
- **백엔드**: 85% 이상
- **AI 서비스**: 75% 이상

## 🔄 CI/CD 파이프라인

### 🚀 자동화 프로세스
```yaml
# GitHub Actions 워크플로우
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
      - name: Setup Node.js
      - name: Install dependencies
      - name: Run tests
      - name: Check coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build application
      - name: Build Docker images
      - name: Push to registry

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
      - name: Health check
      - name: Notify team
```

## 📈 모니터링 및 분석

### 📊 주요 메트릭
- **사용자 활성도**: DAU, MAU, 세션 시간
- **기능 사용률**: 음성 입력, AI 채팅, 복지 예약
- **성능 지표**: 응답 시간, 에러율, 가용성
- **사용자 만족도**: 평점, 피드백, NPS

### 🔍 분석 도구
- **Google Analytics**: 사용자 행동 분석
- **Sentry**: 에러 모니터링
- **New Relic**: 성능 모니터링 (예정)
- **Hotjar**: 사용자 경험 분석 (예정)

## 🤝 기여 방법

### 🐛 버그 리포트
1. GitHub Issues에서 버그 템플릿 사용
2. 재현 단계 상세 작성
3. 환경 정보 포함 (브라우저, OS 등)
4. 스크린샷 첨부

### 💡 기능 제안
1. Feature Request 템플릿 사용
2. 사용자 스토리 형태로 작성
3. 기대 효과 및 우선순위 명시

### 📝 코드 기여
1. Fork 후 feature 브랜치 생성
2. 커밋 메시지 컨벤션 준수
3. 테스트 코드 포함
4. Pull Request 생성


## 🗺️ 로드맵

### 📅 단기 계획 (3개월)
- [ ] 음성 인식 정확도 95% 달성
- [ ] 복지 서비스 50개 추가
- [ ] iOS/Android 네이티브 앱 출시
- [ ] 사용자 피드백 시스템 구축

### 📅 중기 계획 (6개월)
- [ ] AI 개인화 추천 시스템
- [ ] 가족 연동 기능
- [ ] 의료진 직접 연결
- [ ] 스마트워치 연동

### 📅 장기 계획 (1년+)
- [ ] IoT 기기 연동 (스마트홈)
- [ ] 건강 모니터링 (혈압, 혈당)
- [ ] 다국어 지원 (영어, 중국어)
- [ ] B2B 서비스 확장


## 👥 개발팀

### 🏆 Core Team
- **프로젝트 매니저**: 강건우 (역할)
- **프론트엔드 개발**: 강건우 (React.js, UI/UX)
- **백엔드 개발**: 강건우, 김우중 (Node.js, Database)
- **AI 개발**: 김우중 (Python, Machine Learning)
- **QA/테스트**: 김우중 (Testing, Quality Assurance)

### 📧 연락처
- **이메일**: rkdrjdsn1000@naver.com

## 🙏 감사의 말

이 프로젝트는 다음과 같은 오픈소스 프로젝트을 사용했습니다:

- **React.js**: 사용자 인터페이스 구축
- **Node.js**: 서버 사이드 개발
- **PostgreSQL**: 데이터베이스
- **FastAPI**: AI 서비스 API
- **Transformers**: 자연어 처리 모델


---

<div align="center">
  <h3>🌟 함께 만들어가는 디지털 포용 사회 🌟</h3>
  <p>금복이와 함께 모든 세대가 디지털 혜택을 누릴 수 있는 세상을 만들어갑니다.</p>
</div>

---


