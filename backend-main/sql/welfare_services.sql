-- PostgreSQL용 복지 서비스 테이블 스키마 정의
CREATE TABLE IF NOT EXISTS welfare_services (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(50) NOT NULL UNIQUE,  -- 서비스아이디
  service_name VARCHAR(255) NOT NULL,      -- 서비스명
  service_summary TEXT NOT NULL,           -- 서비스요약
  ministry_name VARCHAR(100),              -- 소관부처명
  organization_name VARCHAR(100),          -- 소관조직명
  contact_info VARCHAR(100),               -- 대표문의
  website VARCHAR(255),                    -- 사이트
  service_url VARCHAR(255),                -- 서비스URL
  reference_year INTEGER,                  -- 기준연도
  last_modified_date VARCHAR(50),          -- 최종수정일
  
  -- 추가 상세 정보
  category VARCHAR(50),                    -- 카테고리(문화, 교육, 의료, 생계, 주거, 고용, 기타)
  target_audience TEXT,                    -- 지원대상
  eligibility_criteria TEXT,               -- 자격요건
  benefit_details TEXT,                    -- 혜택내용
  application_method TEXT,                 -- 신청방법
  provider VARCHAR(100),                   -- 제공기관
  region VARCHAR(100),                     -- 지역
  application_deadline TIMESTAMP,          -- 신청마감일
  is_active BOOLEAN DEFAULT TRUE,          -- 활성화 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 복지 서비스 카테고리 테이블 (선택적)
CREATE TABLE IF NOT EXISTS welfare_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 카테고리 데이터 삽입
INSERT INTO welfare_categories (name, description)
VALUES 
  ('문화', '문화 및 여가 관련 복지 서비스'),
  ('교육', '교육 관련 복지 서비스'),
  ('의료', '의료 및 건강 관련 복지 서비스'),
  ('생계', '생계 지원 복지 서비스'),
  ('주거', '주거 관련 복지 서비스'),
  ('고용', '고용 및 취업 관련 복지 서비스'),
  ('기타', '기타 복지 서비스')
ON CONFLICT (name) DO NOTHING;

-- 복지 서비스 타겟 그룹 테이블 (선택적)
CREATE TABLE IF NOT EXISTS welfare_target_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 타겟 그룹 데이터 삽입
INSERT INTO welfare_target_groups (name, description)
VALUES 
  ('노인', '65세 이상 노인'),
  ('장애인', '장애를 가진 사람'),
  ('아동', '18세 미만 아동'),
  ('청소년', '13세에서 18세 사이의 청소년'),
  ('저소득층', '저소득층 가구'),
  ('여성', '여성 대상 서비스'),
  ('다문화가정', '다문화가정'),
  ('한부모가정', '한부모가정'),
  ('전체', '모든 시민 대상')
ON CONFLICT (name) DO NOTHING;

-- 복지 서비스와 타겟 그룹 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS welfare_service_targets (
  service_id VARCHAR(50) REFERENCES welfare_services(service_id),
  target_group_id INTEGER REFERENCES welfare_target_groups(id),
  PRIMARY KEY (service_id, target_group_id)
);

-- 사용자 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS welfare_favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50) NOT NULL REFERENCES welfare_services(service_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service_id)
);

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- welfare_services 테이블에 자동 업데이트 트리거 적용
CREATE TRIGGER update_welfare_services_modtime
BEFORE UPDATE ON welfare_services
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_welfare_services_service_id ON welfare_services(service_id);
CREATE INDEX IF NOT EXISTS idx_welfare_services_category ON welfare_services(category);
CREATE INDEX IF NOT EXISTS idx_welfare_services_ministry ON welfare_services(ministry_name);
CREATE INDEX IF NOT EXISTS idx_welfare_favorites_user_id ON welfare_favorites(user_id);

-- 테스트 데이터 삽입
INSERT INTO welfare_services (
  service_id, service_name, service_summary, ministry_name, 
  organization_name, contact_info, service_url, reference_year,
  category, target_audience, application_method
) VALUES 
(
  'WF0001', 
  '노인 돌봄 서비스', 
  '독거노인 및 노인부부가구를 위한 돌봄 서비스를 제공합니다.', 
  '보건복지부',
  '노인정책과', 
  '129', 
  'https://www.bokjiro.go.kr', 
  2025,
  '생계', 
  '65세 이상 노인', 
  '주민센터 방문 신청'
),
(
  'WF0002', 
  '노인 건강 검진', 
  '노인을 위한 무료 건강 검진 서비스를 제공합니다.', 
  '보건복지부',
  '건강정책과', 
  '1577-1000', 
  'https://www.nhis.or.kr', 
  2025,
  '의료', 
  '65세 이상 노인', 
  '건강보험공단 홈페이지 또는 방문 신청'
),
(
  'WF0003', 
  '기초연금', 
  '노인의 안정적인 생활을 위한 기초연금을 지급합니다.', 
  '보건복지부',
  '국민연금공단', 
  '1355', 
  'https://www.nps.or.kr', 
  2025,
  '생계', 
  '만 65세 이상, 소득인정액 기준 하위 70%', 
  '국민연금공단 또는 주민센터 방문 신청'
)
ON CONFLICT (service_id) DO NOTHING;