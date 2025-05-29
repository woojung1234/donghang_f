const sequelize = require('./src/config/database');

async function checkTableStructure() {
    try {
        await sequelize.authenticate();
        console.log('✅ 데이터베이스 연결 성공!');

        const [columns] = await sequelize.query("DESCRIBE welfare_bookings");
        console.log('📋 welfare_bookings 테이블 구조:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        console.log('\n🎉 테이블 구조 확인 완료!');

    } catch (error) {
        console.error('❌ 오류:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkTableStructure();
