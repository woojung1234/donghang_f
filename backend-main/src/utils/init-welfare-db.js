const { sequelize } = require('../models');

async function initializeWelfareDatabase() {
  try {
    console.log('🔄 복지 서비스 데이터베이스 초기화 시작...');
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 테이블 동기화 (기존 테이블이 있으면 스키마만 업데이트)
    await sequelize.sync({ alter: true });
    console.log('✅ 데이터베이스 테이블 동기화 완료');
    
    console.log('🎉 복지 서비스 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
    throw error;
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  initializeWelfareDatabase()
    .then(() => {
      console.log('초기화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('초기화 실패:', error);
      process.exit(1);
    });
}

module.exports = initializeWelfareDatabase;