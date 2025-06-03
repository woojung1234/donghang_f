const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'donghang',
  username: 'postgres',
  password: '1234567',
  logging: false
});

async function checkIndexes() {
  try {
    console.log('🔍 데이터베이스 인덱스 현황 확인 중...\n');
    
    // 모든 테이블의 인덱스 조회
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);

    console.log('=== 📊 현재 데이터베이스 인덱스 현황 ===\n');
    
    let currentTable = '';
    results.forEach(row => {
      if (currentTable !== row.tablename) {
        if (currentTable !== '') console.log(''); // 테이블 간 구분선
        console.log(`📋 테이블: ${row.tablename}`);
        console.log('─'.repeat(50));
        currentTable = row.tablename;
      }
      
      console.log(`  🔑 인덱스: ${row.indexname}`);
      console.log(`     정의: ${row.indexdef}`);
      console.log('');
    });

    // 각 테이블별 인덱스 통계
    console.log('\n=== 📈 테이블별 인덱스 통계 ===');
    const tableStats = {};
    results.forEach(row => {
      if (!tableStats[row.tablename]) {
        tableStats[row.tablename] = 0;
      }
      tableStats[row.tablename]++;
    });

    Object.entries(tableStats).forEach(([table, count]) => {
      console.log(`${table}: ${count}개 인덱스`);
    });

  } catch (error) {
    console.error('❌ 인덱스 확인 실패:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkIndexes();
