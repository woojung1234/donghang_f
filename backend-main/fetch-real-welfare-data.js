const axios = require('axios');
const Welfare = require('./src/models/Welfare');
const { sequelize } = require('./src/models');
require('dotenv').config();

async function fetchRealWelfareData() {
  try {
    console.log('🚀 실제 공공 API에서 복지서비스 데이터 가져와서 DB 저장 시작...');
    
    const apiKey = process.env.PUBLIC_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('PUBLIC_DATA_API_KEY가 설정되지 않았습니다.');
    }

    console.log('🔑 API 키 확인됨');

    // 기존 데이터 삭제 (필요시)
    // await Welfare.destroy({ where: {} });
    // console.log('🗑️ 기존 데이터 삭제 완료');

    const existingCount = await Welfare.count();
    console.log(`📊 현재 DB에 있는 복지서비스 개수: ${existingCount}`);

    // 실제 공공 API URL (welfare.routes.js에서 사용하는 동일한 URL)
    const apiUrl = `https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d?serviceKey=${apiKey}&page=1&perPage=100&returnType=JSON`;
    
    console.log('📡 공공 API 호출 중...');
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📡 API 응답 받음:', response.status);
    console.log('📄 응답 구조:', Object.keys(response.data));
    
    if (!response.data || !response.data.data) {
      throw new Error('API 응답에 데이터가 없습니다.');
    }
    
    const serviceData = response.data.data;
    console.log(`📋 받은 복지서비스 데이터 수: ${serviceData.length}`);
    
    let savedCount = 0;
    
    for (const service of serviceData) {
      try {
        // 서비스 ID 생성
        const serviceId = service.서비스아이디 || `API_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 중복 확인
        const existing = await Welfare.findOne({
          where: { serviceId: serviceId }
        });
        
        if (!existing) {
          await Welfare.create({
            serviceId: serviceId,
            serviceName: service.서비스명 || '복지서비스',
            serviceSummary: (service.서비스요약 || '복지서비스 정보').substring(0, 1000),
            ministryName: service.소관부처명 || '보건복지부',
            organizationName: service.소관조직명 || '관련기관',
            contactInfo: service.대표문의 || '',
            website: service.사이트 || '',
            serviceUrl: service.서비스URL || '',
            referenceYear: service.기준연도 || '2024',
            lastModifiedDate: service.최종수정일 || new Date().toISOString().split('T')[0],
            targetAudience: service.지원대상 || '일반',
            applicationMethod: service.신청방법 || '관련기관 문의',
            category: mapCategory(service.서비스분야 || service.서비스명),
            isActive: true
          });
          
          savedCount++;
          console.log(`✅ 저장: ${service.서비스명}`);
        } else {
          console.log(`⚠️ 중복 건너뜀: ${service.서비스명}`);
        }
      } catch (itemError) {
        console.error(`❌ 개별 항목 저장 실패: ${service.서비스명}`, itemError.message);
      }
    }
    
    console.log(`🎉 실제 복지서비스 데이터 저장 완료! 총 ${savedCount}개 저장됨`);
    
    // 최종 확인
    const finalCount = await Welfare.count();
    console.log(`📊 최종 DB 복지서비스 개수: ${finalCount}`);
    
    // 카테고리별 분포 확인
    const categories = await sequelize.query(`
      SELECT category, COUNT(*) as count 
      FROM welfare_services 
      WHERE is_active = true 
      GROUP BY category
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 카테고리별 분포:');
    categories.forEach(cat => {
      console.log(`   ${cat.category || '미분류'}: ${cat.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 실제 복지서비스 데이터 저장 오류:', error);
    
    if (error.response) {
      console.error('API 응답 오류:', error.response.status, error.response.data);
    }
  } finally {
    await sequelize.close();
  }
}

// 카테고리 매핑 함수
function mapCategory(originalCategory) {
  if (!originalCategory) return '기타';
  
  const category = originalCategory.toLowerCase();
  
  if (category.includes('노인') || category.includes('어르신') || category.includes('연금')) return '노인복지';
  if (category.includes('아동') || category.includes('육아') || category.includes('보육')) return '아동복지';
  if (category.includes('장애') || category.includes('장애인')) return '장애인복지';
  if (category.includes('문화') || category.includes('예술') || category.includes('체육')) return '문화복지';
  if (category.includes('교육') || category.includes('학습')) return '교육복지';
  if (category.includes('의료') || category.includes('건강') || category.includes('치료')) return '의료복지';
  if (category.includes('취업') || category.includes('고용') || category.includes('일자리')) return '고용복지';
  if (category.includes('주거') || category.includes('임대') || category.includes('주택')) return '주거복지';
  if (category.includes('여성') || category.includes('임신') || category.includes('출산')) return '여성복지';
  
  return originalCategory;
}

// 스크립트 실행
if (require.main === module) {
  fetchRealWelfareData()
    .then(() => {
      console.log('✅ 실제 공공 API 데이터 저장 작업 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 실제 공공 API 데이터 저장 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = fetchRealWelfareData;