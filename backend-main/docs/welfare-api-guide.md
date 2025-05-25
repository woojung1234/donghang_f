# 복지 서비스 API 사용 가이드

이 문서는 복지 서비스 API의 사용 방법에 대한 가이드입니다.

## 환경 설정

1. `.env` 파일에 공공 데이터 포털 API 키를 추가합니다:

```
PUBLIC_DATA_API_KEY=your_public_data_api_key_here
```

2. PostgreSQL 데이터베이스 설정을 확인합니다:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donghang
DB_USER=postgres
DB_PASSWORD=yourpassword
```

## 데이터베이스 설정

1. PostgreSQL 데이터베이스를 생성하고, 스키마를 적용합니다:

```bash
$ psql -U postgres
postgres=# CREATE DATABASE donghang;
postgres=# \c donghang
donghang=# \i /path/to/backend-main/sql/welfare_services.sql
```

## API 엔드포인트

### 1. 복지 서비스 목록 조회

```
GET /api/welfare
```

#### 쿼리 파라미터

- `category` (선택): 카테고리 필터링 (문화, 교육, 의료, 생계, 주거, 고용, 기타)
- `page` (선택): 페이지 번호 (기본값: 1)
- `limit` (선택): 페이지당 항목 수 (기본값: 10)

#### 응답 예시

```json
{
  "data": [
    {
      "service_id": "WF0001",
      "service_name": "노인 돌봄 서비스",
      "service_summary": "독거노인 및 노인부부가구를 위한 돌봄 서비스를 제공합니다.",
      "ministry_name": "보건복지부",
      "organization_name": "노인정책과",
      "contact_info": "129",
      "service_url": "https://www.bokjiro.go.kr",
      "target_audience": "65세 이상 노인",
      "application_method": "주민센터 방문 신청"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### 2. 복지 서비스 검색

```
GET /api/welfare/search
```

#### 쿼리 파라미터

- `keyword` (필수): 검색어
- `page` (선택): 페이지 번호 (기본값: 1)
- `limit` (선택): 페이지당 항목 수 (기본값: 10)

### 3. 복지 서비스 상세 조회

```
GET /api/welfare/:id
```

#### 경로 파라미터

- `id`: 복지 서비스 ID (예: WF0001)

### 4. 복지 서비스 동기화 (관리자 전용)

```
POST /api/welfare/sync
```

**참고**: 이 API는 관리자 권한이 필요합니다.

### 5. 동년배 통계 데이터 조회

```
GET /api/welfare/peer-statistics
```

#### 쿼리 파라미터

- `age` (필수): 사용자 나이
- `gender` (선택): 사용자 성별 (male/female)

## 프론트엔드에서 API 사용 예시

### 서비스 모듈 사용

```javascript
import { getWelfareServices, searchWelfareServices } from 'services/welfareService';

// 복지 서비스 목록 조회
const fetchWelfareServices = async () => {
  try {
    const response = await getWelfareServices('의료', 1, 10);
    setServices(response.data);
  } catch (error) {
    console.error('복지 서비스 조회 오류:', error);
  }
};

// 복지 서비스 검색
const searchServices = async (keyword) => {
  try {
    const response = await searchWelfareServices(keyword);
    setSearchResults(response.data);
  } catch (error) {
    console.error('복지 서비스 검색 오류:', error);
  }
};
```

## 공공 데이터 포털 API 직접 호출 시 주의사항

공공 데이터 포털 API를 직접 호출할 경우 다음 사항에 주의하세요:

1. API 키를 항상 환경 변수로 관리합니다.
2. 공공 데이터 포털은 호출 횟수에 제한이 있으므로, 필요할 때만 호출합니다.
3. 응답 형식이 변경될 수 있으므로 에러 처리를 반드시 구현합니다.

## 오류 대응

1. API 키 오류: 환경 변수 설정을 확인하세요.
2. 데이터베이스 연결 오류: PostgreSQL 설정을 확인하세요.
3. 타임아웃 오류: 공공 데이터 포털 API는 간혹 응답 시간이 길 수 있습니다.