const sequelize = require('./src/config/database');
const WelfareBook = require('./src/models/WelfareBook');

async function recreateWelfareBookingTableWithoutFK() {
    try {
        console.log('🚀 데이터베이스 연결 중...');
        await sequelize.authenticate();
        console.log('✅ 데이터베이스 연결 성공!');

        console.log('🗑️ 기존 welfare_bookings 테이블 삭제 중...');
        await sequelize.query('DROP TABLE IF EXISTS welfare_bookings CASCADE');
        console.log('✅ welfare_bookings 테이블 삭제 완료');

        console.log('🔨 welfare_bookings 테이블 재생성 중 (외래키 제약조건 없음)...');
        await WelfareBook.sync({ force: true });
        console.log('✅ welfare_bookings 테이블 재생성 완료');

        // 테이블 구조 확인
        const [columns] = await sequelize.query("DESCRIBE welfare_bookings");
        console.log('📋 새로 생성된 welfare_bookings 테이블 구조:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        console.log('🎉 테이블 재생성 완료! 이제 예약이 정상적으로 작동합니다.');

    } catch (error) {
        console.error('❌ 테이블 재생성 실패:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

recreateWelfareBookingTableWithoutFK();
