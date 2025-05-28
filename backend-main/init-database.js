const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Welfare = require('../src/models/Welfare');

async function initializeDatabase() {
  try {
    console.log('🔄 데이터베이스 초기화 시작...');

    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 생성 (기존 데이터 유지)
    await sequelize.sync({ force: false });
    console.log('✅ 테이블 동기화 완료');

    // 테스트 사용자 생성 (존재하지 않는 경우에만)
    const [testUser, userCreated] = await User.findOrCreate({
      where: { userId: 'test_user' },
      defaults: {
        userId: 'test_user',
        userPw: 'test123',
        userName: '김테스트',
        userType: 'USER',
        userBirth: '1990-01-01',
        userGender: 'M',
        userPhone: '010-1234-5678',
        userAddress: '서울시 강남구 테스트동 123-456',
        isActive: true
      }
    });

    if (userCreated) {
      console.log('✅ 테스트 사용자 생성 완료:', testUser.userId);
    } else {
      console.log('ℹ️ 테스트 사용자 이미 존재:', testUser.userId);
    }

    // 복지 서비스 데이터 생성
    const welfareServices = [
      {
        welfareNo: 1,
        welfareName: '일상가사 돌봄',
        welfareContent: '일상적인 가사일 도움 서비스입니다. 청소, 세탁, 요리 등을 지원합니다.',
        welfarePrice: 15000,
        welfareCategory: '생활지원',
        serviceId: 'daily-care',
        isActive: true
      },
      {
        welfareNo: 2,
        welfareName: '가정간병 돌봄',
        welfareContent: '환자 또는 거동불편자 간병 서비스입니다. 전문 간병인이 방문하여 돌봄을 제공합니다.',
        welfarePrice: 35000,
        welfareCategory: '의료지원',
        serviceId: 'home-nursing',
        isActive: true
      },
      {
        welfareNo: 3,
        welfareName: '하나 돌봄',
        welfareContent: '종합적인 돌봄 서비스입니다. 생활지원과 간병을 함께 제공합니다.',
        welfarePrice: 25000,
        welfareCategory: '종합돌봄',
        serviceId: 'comprehensive-care',
        isActive: true
      }
    ];

    for (const service of welfareServices) {
      const [welfare, welfareCreated] = await Welfare.findOrCreate({
        where: { welfareNo: service.welfareNo },
        defaults: service
      });

      if (welfareCreated) {
        console.log(`✅ 복지 서비스 생성 완료: ${welfare.welfareName}`);
      } else {
        console.log(`ℹ️ 복지 서비스 이미 존재: ${welfare.welfareName}`);
      }
    }

    console.log('🎉 데이터베이스 초기화 완료!');
    console.log('');
    console.log('📋 생성된 데이터:');
    console.log(`- 테스트 사용자: ${testUser.userId} (UserNo: ${testUser.userNo})`);
    console.log(`- 복지 서비스: ${welfareServices.length}개`);
    console.log('');
    console.log('🚀 이제 서버를 시작할 수 있습니다:');
    console.log('   cd backend-main && npm run dev');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('초기화 중 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
