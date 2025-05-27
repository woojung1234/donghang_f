// backend-main/create-sample-welfare-data.js
// 샘플 복지서비스 데이터 생성을 위한 스크립트

const WelfareService = require('./src/services/WelfareService');

async function createSampleData() {
  try {
    console.log('🚀 샘플 복지서비스 데이터 생성 시작...');
    
    const result = await WelfareService.createSampleWelfareData();
    
    console.log('✅ 샘플 데이터 생성 완료!');
    console.log(`생성된 서비스 수: ${result.createdCount}`);
    console.log('생성된 서비스 목록:');
    
    result.services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.welfareName} (${service.category})`);
    });
    
    console.log('\n🎉 이제 금복이가 복지서비스를 추천할 수 있습니다!');
    console.log('테스트 문구: "오늘 뭐할까?", "건강 프로그램 추천해줘", "문화 활동 있나요?" 등');
    
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  createSampleData();
}

module.exports = createSampleData;