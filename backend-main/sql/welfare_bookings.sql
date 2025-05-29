-- 복지서비스 예약 테이블 생성
DROP TABLE IF EXISTS welfare_bookings CASCADE;

CREATE TABLE welfare_bookings (
    welfare_book_no BIGSERIAL PRIMARY KEY,
    user_no BIGINT NOT NULL,
    welfare_no BIGINT NOT NULL,
    
    -- 예약자 개인정보
    user_name VARCHAR(50) NOT NULL COMMENT '예약자 이름',
    user_birth DATE NOT NULL COMMENT '예약자 생년월일',
    user_gender VARCHAR(10) NOT NULL COMMENT '예약자 성별',
    user_address VARCHAR(255) NOT NULL COMMENT '예약자 주소',
    user_detail_address VARCHAR(255) COMMENT '예약자 상세주소',
    user_phone VARCHAR(20) NOT NULL COMMENT '예약자 연락처',
    user_height INTEGER COMMENT '예약자 신장(cm)',
    user_weight INTEGER COMMENT '예약자 체중(kg)',
    user_medical_info TEXT COMMENT '예약자 특이사항',
    
    -- 예약 정보
    welfare_book_start_date DATE NOT NULL COMMENT '서비스 시작일',
    welfare_book_end_date DATE NOT NULL COMMENT '서비스 종료일',
    welfare_book_use_time INTEGER NOT NULL COMMENT '이용 시간 (시간 단위)',
    welfare_book_total_price DECIMAL(12,2) NOT NULL COMMENT '총 결제 금액',
    welfare_book_reservation_date TIMESTAMP NOT NULL COMMENT '예약 일시',
    special_request TEXT COMMENT '특별 요청사항',
    
    -- 상태 관리
    welfare_book_is_complete BOOLEAN NOT NULL DEFAULT FALSE COMMENT '서비스 완료 여부',
    welfare_book_is_cancel BOOLEAN NOT NULL DEFAULT FALSE COMMENT '예약 취소 여부',
    cancelled_at TIMESTAMP COMMENT '취소 일시',
    
    -- 시스템 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키 제약조건 (실제 테이블이 있는 경우에만)
    -- FOREIGN KEY (user_no) REFERENCES users(user_no),
    -- FOREIGN KEY (welfare_no) REFERENCES welfare_services(welfare_no),
    
    -- 인덱스
    INDEX idx_welfare_bookings_user_no (user_no),
    INDEX idx_welfare_bookings_welfare_no (welfare_no),
    INDEX idx_welfare_bookings_reservation_date (welfare_book_reservation_date),
    INDEX idx_welfare_bookings_start_date (welfare_book_start_date)
);

-- PostgreSQL용 업데이트 트리거 (MySQL에서는 불필요)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_welfare_bookings_updated_at 
--     BEFORE UPDATE ON welfare_bookings 
--     FOR EACH ROW 
--     EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE welfare_bookings IS '복지서비스 예약 테이블';
