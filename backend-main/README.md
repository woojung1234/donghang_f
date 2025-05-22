# 똑똑 Node.js 백엔드 서버

Java Spring Boot에서 Node.js Express로 변환된 백엔드 서버입니다.

## 🚀 시작하기

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 실제 값들로 수정하세요
```

### 2. 데이터베이스 설정

PostgreSQL이 실행 중이어야 합니다:

```bash
# PostgreSQL 데이터베이스 생성
createdb knockknock
```

### 3. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

## 📋 API 문서

서버 실행 후 다음 URL에서 Swagger UI를 확인할 수 있습니다:
- http://localhost:9090/api-docs

## 🔧 주요 기능

### 인증 시스템
- JWT 기반 인증
- 일반 로그인 (아이디/비밀번호)
- 간편 비밀번호 로그인
- 생체 인증 로그인

### 사용자 관리
- 회원가입/탈퇴
- 아이디 중복 확인
- SMS 인증
- 프로필 관리
- 간편 결제 비밀번호

### API 엔드포인트

#### 인증
- `POST /api/v1/auth/login/normal` - 일반 로그인
- `POST /api/v1/auth/login/simple` - 간편 로그인
- `POST /api/v1/auth/login/bio` - 생체 로그인
- `POST /api/v1/auth/logout` - 로그아웃

#### 사용자
- `GET /api/v1/users/validation/:userId` - 아이디 중복 확인
- `POST /api/v1/users/validation/phone` - SMS 전송
- `POST /api/v1/users/validation/number` - SMS 인증
- `POST /api/v1/users/signup` - 회원가입
- `GET /api/v1/users` - 회원 정보 조회
- `PUT /api/v1/users` - 회원 정보 수정
- `PUT /api/v1/users/withdraw` - 회원 탈퇴

#### 기타
- `GET /api/v1/conversations` - 대화 관리
- `GET /api/v1/consumption` - 소비 관리
- `GET /api/v1/welfare` - 복지 서비스
- `GET /api/v1/notifications` - 알림 관리

## 🛠️ 기술 스택

- **Node.js** - 런타임 환경
- **Express.js** - 웹 프레임워크
- **Sequelize** - ORM (PostgreSQL)
- **JWT** - 인증
- **bcryptjs** - 비밀번호 해시
- **CoolSMS** - SMS 서비스
- **Swagger** - API 문서화

## 🔐 보안

- Helmet.js를 사용한 HTTP 헤더 보안
- CORS 설정
- JWT 토큰 기반 인증
- 비밀번호 해시화 (bcrypt)
- 입력 데이터 검증

## 🐛 개발 도구

```bash
# 테스트 실행
npm test

# 코드 린팅
npm run lint

# 서버 재시작 (개발모드)
npm run dev
```

## 📝 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| PORT | 서버 포트 | 9090 |
| NODE_ENV | 실행 환경 | development |
| DB_HOST | 데이터베이스 호스트 | localhost |
| DB_NAME | 데이터베이스 이름 | knockknock |
| JWT_SECRET | JWT 시크릿 키 | - |
| COOLSMS_API_KEY | CoolSMS API 키 | - |

## 🏗️ 프로젝트 구조

```
src/
├── config/          # 설정 파일들
│   ├── database.js  # 데이터베이스 설정
│   ├── jwt.js       # JWT 설정
│   └── swagger.js   # API 문서 설정
├── controllers/     # 컨트롤러
│   ├── AuthController.js
│   └── UserController.js
├── middleware/      # 미들웨어
│   ├── auth.js      # 인증 미들웨어
│   ├── errorHandler.js
│   └── notFound.js
├── models/          # 데이터 모델
│   └── User.js
├── routes/          # 라우터
│   ├── auth.js
│   ├── users.js
│   └── ...
└── app.js           # 메인 애플리케이션
```

## 🔄 마이그레이션

Java Spring Boot → Node.js Express 변환 완료:

✅ **완료된 기능:**
- 인증 시스템 (JWT)
- 사용자 관리 (CRUD)
- SMS 인증
- 간편 결제 비밀번호
- API 문서화 (Swagger)
- 에러 핸들링
- 보안 설정

⏳ **구현 예정:**
- 대화 관리 세부 기능
- 소비 내역 관리
- 복지 서비스 관리
- 알림 시스템

## 🚀 배포

```bash
# 프로덕션 빌드
NODE_ENV=production npm start

# PM2 사용 (권장)
npm install -g pm2
pm2 start src/app.js --name "knockknock-backend"
```
