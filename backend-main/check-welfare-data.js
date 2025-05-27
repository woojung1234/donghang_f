// 복지서비스 DB 데이터 확인 스크립트
const { sequelize } = require('./src/models');
const Welfare = require('./src/models/Welfare');

async function checkWelfareData() {
  try {
    console.log('🔍 복지서비스 DB 데이터 확인 중...');
    
    // 전체 개수 확인
    const totalCount = await Welfare.count();
    console.log(`📊 전체 복지서비스 개수: ${totalCount}`);
    
    // 활성화된 서비스 개수 확인
    const activeCount = await Welfare.count({ where: { isActive: true } });
    console.log(`✅ 활성화된 복지서비스 개수: ${activeCount}`);
    
    // 처음 5개 데이터 확인
    const firstFive = await Welfare.findAll({
      limit: 5,
      order: [['welfareNo', 'ASC']]
    });
    
    console.log('\n🔍 처음 5개 복지서비스:');
    firstFive.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceName} (ID: ${service.serviceId})`);
      console.log(`   활성화: ${service.isActive}`);
      console.log(`   카테고리: ${service.category}`);
      console.log(`   요약: ${service.serviceSummary?.substring(0, 50)}...`);
      console.log('');
    });
    
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
    console.error('❌ 데이터 확인 오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkWelfareData();