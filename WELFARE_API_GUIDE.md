# 🎯 복지서비스 API 연동 및 테스트 가이드

## 📋 개요

공공데이터포털의 복지서비스 API와 연동하여 실제 복지서비스 데이터를 가져와 DB에 저장하고, AI 챗봇이 추천할 수 있도록 구현했습니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd backend-main
npm install xml2js
```

### 2. 환경변수 설정
```bash
# .env 파일에 추가
PUBLIC_DATA_API_KEY=YOUR_API_KEY_HERE
```

### 3. 샘플 데이터 생성 (API 키 없이 테스트)
```bash
# 서버 실행 후
curl -X POST http://localhost:9090/api/welfare/sample-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 API 엔드포인트

### 공개 엔드포인트 (인증 불필요)

#### 1. 복지서비스 목록 조회
```bash
GET /api/welfare
# 파라미터:
# - category: 카테고리 필터 (선택)
# - page: 페이지 번호 (기본값: 1)
# - limit: 페이지당 항목 수 (기본값: 20)

# 예시:
curl "http://localhost:9090/api/welfare?page=1&limit=10"
curl "http://localhost:9090/api/welfare?category=건강/의료"
```

#### 2. 복지서비스 통계
```bash
GET /api/welfare/stats

curl "http://localhost:9090/api/welfare/stats"
```

#### 3. API 연결 상태 확인
```bash
GET /api/welfare/api-status

curl "http://localhost:9090/api/welfare/api-status"
```

#### 4. 복지서비스 상세 정보
```bash
GET /api/welfare/:id

curl "http://localhost:9090/api/welfare/1"
```

### 관리자 전용 엔드포인트 (JWT 토큰 필요)

#### 1. 공공 API 데이터 동기화
```bash
POST /api/welfare/sync

curl -X POST http://localhost:9090/api/welfare/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. 샘플 데이터 생성
```bash
POST /api/welfare/sample-data

curl -X POST http://localhost:9090/api/welfare/sample-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 테스트 시나리오

### 시나리오 1: 샘플 데이터로 시작
1. 샘플 데이터 생성
2. AI 챗봇에서 "오늘 뭐할까?" 질문
3. 복지서비스 추천 확인

```bash
# 1. 샘플 데이터 생성
curl -X POST http://localhost:9090/api/welfare/sample-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. 데이터 확인
curl "http://localhost:9090/api/welfare"

# 3. AI 챗봇 테스트
curl -X POST http://localhost:9090/api/v1/ai-chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "오늘 뭐할까?"}'
```

### 시나리오 2: 공공 API 연동
1. 공공데이터포털에서 API 키 발급
2. 환경변수 설정
3. API 상태 확인
4. 데이터 동기화

```bash
# 1. API 상태 확인
curl "http://localhost:9090/api/welfare/api-status"

# 2. 데이터 동기화
curl -X POST http://localhost:9090/api/welfare/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. 동기화된 데이터 확인
curl "http://localhost:9090/api/welfare/stats"
```

## 🔑 공공데이터포털 API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. [복지서비스 API](https://www.data.go.kr/data/15090532/openapi.do) 페이지 이동
3. "활용신청" 버튼 클릭
4. 신청서 작성 후 승인 대기 (보통 1-2시간)
5. 승인 후 발급받은 API 키를 `.env` 파일에 설정

## 🐛 트러블슈팅

### 문제 1: API 키 오류
```
API 오류: SERVICE_KEY_IS_NOT_REGISTERED_ERROR
```
**해결책:**
- API 키가 올바르게 설정되었는지 확인
- 공공데이터포털에서 승인이 완료되었는지 확인
- 샘플 데이터로 대체하여 테스트

### 문제 2: 데이터베이스 연결 오류
```
Welfare 테이블을 찾을 수 없습니다
```
**해결책:**
- 데이터베이스 마이그레이션 실행
- Welfare 모델이 올바르게 정의되었는지 확인

### 문제 3: AI 추천이 작동하지 않음
```
하드코딩된 기본 응답만 표시
```
**해결책:**
1. 복지서비스 데이터가 있는지 확인:
   ```bash
   curl "http://localhost:9090/api/welfare/stats"
   ```
2. 데이터가 없으면 샘플 데이터 생성:
   ```bash
   curl -X POST http://localhost:9090/api/welfare/sample-data \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 📊 응답 예시

### 복지서비스 목록 응답
```json
{
  "success": true,
  "message": "복지서비스 목록을 조회했습니다.",
  "data": {
    "services": [
      {
        "welfareNo": 1,
        "welfareName": "어르신 건강체조 프로그램",
        "welfareCategory": "건강/의료",
        "welfarePrice": 0
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalItems": 8,
      "totalPages": 1,
      "itemsPerPage": 20
    }
  }
}
```

### AI 추천 응답 예시
```json
{
  "type": "welfare_recommendation",
  "content": "안녕하세요! 오늘 화요일에는 이런 복지서비스는 어떠세요? 😊\n\n🏃‍♂️ **어르신 건강체조 프로그램**\n   분류: 건강/의료\n   이용료: 무료 💝\n   어르신들의 건강하고 즐거운 생활을 위한 서비스입니다.\n\n🎨 **실버 문화교실**\n   분류: 문화/교육\n   이용료: 5,000원\n   많은 분들이 만족하고 계신 인기 프로그램이에요.\n\n관심 있는 서비스가 있으시면 복지서비스 페이지에서 자세한 정보를 확인하실 수 있어요!",
  "needsVoice": true
}
```

## 🎯 다음 단계

1. **정기 동기화 설정**: node-cron을 사용하여 일일 자동 동기화
2. **캐싱 구현**: Redis를 사용한 API 응답 캐싱
3. **지역별 필터링**: 사용자 위치 기반 복지서비스 추천
4. **알림 기능**: 새로운 복지서비스 등록 시 사용자 알림

## 💡 팁

- API 키 없이도 샘플 데이터로 완전한 테스트 가능
- 공공 API는 트래픽 제한이 있으므로 적절한 호출 간격 유지
- 중복 데이터 방지를 위해 서비스명과 소관부처로 중복 체크
- 오류 발생 시 자동으로 샘플 데이터로 폴백