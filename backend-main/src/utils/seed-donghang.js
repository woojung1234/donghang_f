const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const database = require('../config/database');
const User = require('../models/User');
const ConversationRoom = require('../models/ConversationRoom');
const ConversationLog = require('../models/ConversationLog');

async function seed() {
  try {
    // 데이터베이스 연결 확인
    await database.authenticate();
    console.log('✅ Database connected successfully');

    // 테이블 동기화
    await User.sync({ force: false });
    await ConversationRoom.sync({ force: false });
    await ConversationLog.sync({ force: false });
    console.log('✅ Tables synchronized');

    // 테스트 사용자 생성
    const existingUser = await User.findOne({ where: { userId: 'test@example.com' } });
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser = await User.create({
        userId: 'test@example.com',
        userPassword: hashedPassword,
        userName: '테스트 사용자',
        userPhone: '010-1234-5678',
        userType: 'USER',
        isActive: true,
        loginType: 'ID',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Test user created:', testUser.userId);
      
      // 테스트 대화방 생성
      const testRoom = await ConversationRoom.create({
        roomName: '테스트 대화방',
        userNo: testUser.userNo,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Test conversation room created:', testRoom.roomNo);
      
      // 테스트 대화 기록 생성
      await ConversationLog.create({
        conversationRoomNo: testRoom.roomNo,
        sender: 'USER',
        message: '안녕하세요',
        createdAt: new Date()
      });
      
      await ConversationLog.create({
        conversationRoomNo: testRoom.roomNo,
        sender: 'BOT',
        message: '안녕하세요! 무엇을 도와드릴까요?',
        createdAt: new Date()
      });
      
      console.log('✅ Test conversation logs created');
    } else {
      console.log('⚠️ Test user already exists');
    }
    
    console.log('🌱 Seed completed successfully');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    // 연결 종료
    await database.close();
  }
}

// 스크립트 실행
seed();
