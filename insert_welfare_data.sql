-- 복지 서비스 데이터 삽입
INSERT INTO welfare_services (
    welfare_no, service_id, service_name, service_summary, 
    ministry_name, organization_name, contact_info, 
    target_audience, application_method, category, 
    is_active, created_at, updated_at
) VALUES 
(1, 'DOMESTIC_CARE_001', '일상가사 돌봄', '주변 정리나 청소, 빨래, 밥짓기 등 일상가사 일을 힘들고 어려우신 어르신을 돕습니다', '보건복지부', '사회서비스원', '02-1234-5678', '65세 이상 고령층', '온라인 신청', '가사지원', true, NOW(), NOW()),
(2, 'HOME_NURSING_002', '가정간병 돌봄', '의료진의 진료와 치료 외에도 항상 곁에서 누군가 돌봄주어야하나, 집에서 혼자 몸이 아프때에 어르신을 돕습니다', '보건복지부', '사회서비스원', '02-1234-5679', '환자 및 가족', '온라인 신청', '간병지원', true, NOW(), NOW()),
(3, 'EMOTIONAL_SUPPORT_003', '정서지원 돌봄', '심리적,정서적 지원에 집중한 말벗, 산책 동행, 취미활동 보조 등으로 노인의 외로움과 우울감 해소를 도와드립니다', '보건복지부', '사회서비스원', '02-1234-5680', '외로움을 겪는 고령층', '온라인 신청', '정서지원', true, NOW(), NOW());

-- 시퀀스 값 조정
SELECT setval('welfare_services_welfare_no_seq', (SELECT MAX(welfare_no) FROM welfare_services));
