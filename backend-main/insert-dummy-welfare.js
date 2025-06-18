require('dotenv').config();
const { Client } = require('pg');

async function insertDummyData() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234567',
    database: 'donghang'
  });

  try {
    await client.connect();
    console.log('✅ DB 연결 성공');

    const welfareData = [
      {
        serviceId: 'welfare001',
        serviceName: '노인돌봄서비스',
        serviceSummary: '65세 이상 노인을 위한 생활지원 서비스',
        category: '복지/돌봄',
        targetAudience: '65세 이상 노인',
        applicationMethod: '시군구 보건소 신청'
      },
      {
        serviceId: 'welfare002', 
        serviceName: '장애인활동지원서비스',
        serviceSummary: '장애인의 일상생활과 사회활동을 지원하는 서비스',
        category: '복지/돌봄',
        targetAudience: '만 6세 이상 65세 미만 장애인',
        applicationMethod: '국민연금공단 신청'
      },
      {
        serviceId: 'welfare003',
        serviceName: '기초생활수급자 의료급여',
        serviceSummary: '기초생활수급자의 의료비 지원',
        category: '의료/건강',
        targetAudience: '기초생활수급자',
        applicationMethod: '읍면동 주민센터 신청'
      },
      {
        serviceId: 'welfare004',
        serviceName: '아동수당',
        serviceSummary: '만 8세 미만 모든 아동에게 지급되는 수당',
        category: '경제/금융',
        targetAudience: '만 8세 미만 아동',
        applicationMethod: '온라인 또는 읍면동 주민센터 신청'
      },
      {
        serviceId: 'welfare005',
        serviceName: '청년내일채움공제',
        serviceSummary: '청년의 장기근속과 자산형성을 지원하는 사업',
        category: '고용/취업',
        targetAudience: '만 15~34세 청년',
        applicationMethod: '고용복지플러스센터 신청'
      }
    ];

    for (const data of welfareData) {
      const query = `
        INSERT INTO welfare_services (
          service_id, service_name, service_summary, category,
          target_audience, application_method, is_active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        ON CONFLICT (service_id) DO UPDATE SET
          service_name = EXCLUDED.service_name,
          service_summary = EXCLUDED.service_summary,
          updated_at = NOW()
      `;

      await client.query(query, [
        data.serviceId,
        data.serviceName,
        data.serviceSummary,
        data.category,
        data.targetAudience,
        data.applicationMethod
      ]);

      console.log(`✅ ${data.serviceName} 추가됨`);
    }

    console.log('🎉 모든 복지 데이터 추가 완료!');

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await client.end();
    console.log('🔌 DB 연결 종료');
  }
}

insertDummyData();