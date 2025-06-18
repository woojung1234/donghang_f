require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

async function insertWelfareData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234567',
    database: process.env.DB_DATABASE || 'donghang'
  });

  try {
    console.log('🔗 DB 연결 중...');
    console.log('DB 설정:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD ? '****' : 'default(1234567)',
      database: process.env.DB_DATABASE || 'donghang'
    });
    await client.connect();
    console.log('✅ DB 연결 성공');

    console.log('📡 공공 API 호출 중...');
    const apiKey = 'N9UqNAJj7hLzHoNXu7XozSaMGv6m6mmfrsQcmV7jK%2BJGiKvBXdNBg8WOKZ%2BhVMzqlQ6Zr4XbPvhgfww9VRgDOg%3D%3D';
    
    const response = await axios.get('https://apis.data.go.kr/1383000/sftf/service/sftfList', {
      params: {
        serviceKey: apiKey,
        pageNo: 1,
        numOfRows: 50,
        dataType: 'json'
      }
    });

    if (response.data?.response?.header?.resultCode === '00') {
      const items = response.data.response.body.items?.item || [];
      console.log(`📥 ${items.length}개 데이터 조회됨`);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        const insertQuery = `
          INSERT INTO welfare_services (
            service_id, service_name, service_summary, ministry_name, 
            organization_name, contact_info, website, service_url,
            target_audience, application_method, category, is_active,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
          ON CONFLICT (service_id) DO NOTHING
        `;

        const values = [
          item.svcId || `api_${Date.now()}_${i}`,
          item.svcNm || '복지서비스',
          item.svcSumry || null,
          item.inqplCtgryNm || null,
          item.jurMnofNm || null,
          item.svcDtlLink || null,
          item.svcDtlLink || null,
          item.svcDtlLink || null,
          item.sprtTrgtCn || null,
          item.aplyMthCn || null,
          '복지/돌봄'
        ];

        await client.query(insertQuery, values);
        console.log(`✅ ${i + 1}. ${item.svcNm} 추가됨`);
      }

      console.log('🎉 모든 데이터 추가 완료!');
    } else {
      console.log('❌ API 호출 실패');
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await client.end();
    console.log('🔌 DB 연결 종료');
  }
}

insertWelfareData();