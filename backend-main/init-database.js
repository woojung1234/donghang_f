const sequelize = require('./src/config/database');
const { 
  User, 
  WelfareBook, 
  Welfare, 
  ConversationRoom, 
  ConversationLog, 
  Consumption, 
  WelfareFavorite, 
  Notification 
} = require('./src/models');

async function initializeDatabase() {
  try {
    console.log('🚀 데이터베이스 연결 테스트 중...');
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    console.log('📋 기존 테이블 확인 중...');
    
    // 기존 테이블 확인
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('현재 테이블 목록:', results.map(r => Object.values(r)[0]));

    console.log('🔨 테이블 동기화 시작...');
    
    // 테이블 생성/수정 (alter: true로 기존 테이블 구조 업데이트)
    await sequelize.sync({ alter: true });
    
    console.log('✅ 모든 테이블 동기화 완료!');

    // 테이블 생성 확인
    const [newResults] = await sequelize.query("SHOW TABLES");
    console.log('동기화 후 테이블 목록:', newResults.map(r => Object.values(r)[0]));

    // welfare_bookings 테이블 구조 확인
    try {
      const [columns] = await sequelize.query("DESCRIBE welfare_bookings");
      console.log('📋 welfare_bookings 테이블 구조:');
      console.table(columns);
    } catch (error) {
      console.log('⚠️ welfare_bookings 테이블 구조 확인 실패:', error.message);
    }

    console.log('🎉 데이터베이스 초기화 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
