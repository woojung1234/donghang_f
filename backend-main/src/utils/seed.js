const { 
  User, 
  Welfare, 
  WelfareBook, 
  Consumption, 
  ConversationRoom, 
  ConversationLog, 
  Notification 
} = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 데이터베이스 시드 시작...');

    // 1. 샘플 복지 서비스 생성
    const welfareServices = await Welfare.bulkCreate([
      {
        welfareName: '간병 서비스',
        welfareDescription: '전문 간병사가 제공하는 맞춤형 간병 서비스입니다.',
        welfareType: 'NURSING',
        price: 50000,
        duration: 480, // 8시간
        maxCapacity: 5
      },
      {
        welfareName: '가사 도우미',
        welfareDescription: '청소, 세탁, 요리 등 가사 전반을 도와드립니다.',
        welfareType: 'HOUSEWORK',
        price: 30000,
        duration: 240, // 4시간
        maxCapacity: 10
      },
      {
        welfareName: '한울 케어',
        welfareDescription: '종합적인 돌봄 서비스를 제공합니다.',
        welfareType: 'HANWOOL',
        price: 80000,
        duration: 480, // 8시간
        maxCapacity: 3
      }
    ]);

    console.log('✅ 복지 서비스 생성 완료');

    // 2. 테스트용 사용자가 있는지 확인하고 없으면 생성
    let testUser = await User.findOne({ where: { userId: 'testuser' } });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const hashedSimplePassword = await bcrypt.hash('1234', 12);
      
      testUser = await User.create({
        userId: 'testuser',
        userPassword: hashedPassword,
        userName: '테스트 사용자',
        userPhone: '01012345678',
        userType: 'PROTEGE',
        userBirth: '1990-01-01',
        userGender: '남성',
        userAddress: '서울시 강남구 테헤란로 123',
        userHeight: 175,
        userWeight: 70,
        simplePassword: hashedSimplePassword,
        loginType: 'ID',
        isActive: true
      });
      
      console.log('✅ 테스트 사용자 생성 완료');
    }

    // 3. 샘플 소비 내역 생성
    const consumptions = [];
    const categories = ['식료품', '교통', '의료', '쇼핑', '문화', '기타'];
    const merchants = ['편의점', 'GS25', '스타벅스', '지하철', '택시', '병원', '마트', '서점'];
    const paymentMethods = ['카드', '현금', '간편결제'];

    for (let i = 0; i < 20; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
      consumptions.push({
        userNo: testUser.userNo,
        merchantName: merchants[Math.floor(Math.random() * merchants.length)],
        amount: Math.floor(Math.random() * 50000) + 1000, // 1,000 ~ 51,000원
        category: categories[Math.floor(Math.random() * categories.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transactionDate: randomDate,
        location: '서울시 강남구',
        riskLevel: Math.random() > 0.8 ? 'MEDIUM' : 'LOW',
        isAnomalous: Math.random() > 0.9
      });
    }

    await Consumption.bulkCreate(consumptions);
    console.log('✅ 샘플 소비 내역 생성 완료');

    // 4. 샘플 대화방 생성
    const conversationRoom = await ConversationRoom.create({
      userNo: testUser.userNo,
      roomName: '일상 대화',
      roomDescription: '일상적인 대화를 나누는 방입니다.',
      lastMessageAt: new Date()
    });

    // 5. 샘플 대화 로그 생성
    const conversationLogs = [
      {
        roomNo: conversationRoom.roomNo,
        userNo: testUser.userNo,
        messageType: 'USER',
        messageContent: '안녕하세요! 오늘 날씨가 어떤가요?'
      },
      {
        roomNo: conversationRoom.roomNo,
        userNo: testUser.userNo,
        messageType: 'AI',
        messageContent: '안녕하세요! 오늘 서울의 날씨는 맑고 화창합니다. 최고기온은 25도 정도로 예상됩니다.',
        responseTime: 1200,
        aiModel: 'gpt-4o-mini'
      },
      {
        roomNo: conversationRoom.roomNo,
        userNo: testUser.userNo,
        messageType: 'USER',
        messageContent: '오늘 복지 서비스 예약하고 싶어요.'
      },
      {
        roomNo: conversationRoom.roomNo,
        userNo: testUser.userNo,
        messageType: 'AI',
        messageContent: '복지 서비스 예약을 도와드리겠습니다. 어떤 종류의 서비스를 원하시나요? 간병, 가사도우미, 한울케어 중에서 선택하실 수 있습니다.',
        responseTime: 950,
        aiModel: 'gpt-4o-mini'
      }
    ];

    await ConversationLog.bulkCreate(conversationLogs);
    console.log('✅ 샘플 대화 내역 생성 완료');

    // 6. 샘플 알림 생성
    const notifications = [
      {
        userNo: testUser.userNo,
        title: '서비스 이용 안내',
        content: '금복이 서비스에 오신 것을 환영합니다! 다양한 기능을 활용해보세요.',
        notificationType: 'SYSTEM',
        priority: 'NORMAL'
      },
      {
        userNo: testUser.userNo,
        title: '이상 거래 탐지',
        content: '평소보다 높은 금액의 거래가 감지되었습니다. 본인 거래가 맞는지 확인해주세요.',
        notificationType: 'ANOMALY',
        priority: 'HIGH'
      },
      {
        userNo: testUser.userNo,
        title: '복지 서비스 예약 가능',
        content: '새로운 복지 서비스 예약이 가능합니다. 지금 바로 예약해보세요!',
        notificationType: 'WELFARE',
        priority: 'NORMAL'
      }
    ];

    await Notification.bulkCreate(notifications);
    console.log('✅ 샘플 알림 생성 완료');

    console.log('🎉 데이터베이스 시드 완료!');
    console.log(`
📋 생성된 데이터:
- 복지 서비스: ${welfareServices.length}개
- 테스트 사용자: ${testUser.userName} (${testUser.userId})
- 소비 내역: ${consumptions.length}개
- 대화방: 1개
- 대화 로그: ${conversationLogs.length}개
- 알림: ${notifications.length}개

🔑 테스트 계정 정보:
- 아이디: testuser
- 비밀번호: password123
- 간편 비밀번호: 1234
    `);

  } catch (error) {
    console.error('❌ 시드 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { seedDatabase };

// 직접 실행시 시드 실행
if (require.main === module) {
  const database = require('../config/database');
  
  async function runSeed() {
    try {
      await database.authenticate();
      console.log('✅ 데이터베이스 연결 성공');
      
      await database.sync({ alter: true });
      console.log('✅ 데이터베이스 동기화 완료');
      
      await seedDatabase();
      
      process.exit(0);
    } catch (error) {
      console.error('❌ 시드 실행 중 오류:', error);
      process.exit(1);
    }
  }
  
  runSeed();
}
