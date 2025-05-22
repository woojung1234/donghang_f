const ConversationRoom = require('../models/ConversationRoom');
const ConversationLog = require('../models/ConversationLog');
const User = require('../models/User');
const axios = require('axios');

class ConversationService {
  /**
   * 대화 처리
   */
  static async processConversation({ input, conversationRoomNo, userNo }) {
    try {
      // 1. 대화방 존재 확인
      const room = await ConversationRoom.findOne({
        where: {
          conversationRoomNo,
          userNo,
          conversationRoomIsActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      // 2. 사용자 입력 로그 저장
      const userLog = await ConversationLog.create({
        conversationRoomNo,
        conversationLogSender: 'USER',
        conversationLogMessage: input,
        conversationLogCreatedAt: new Date()
      });

      // 3. AI 서비스 호출 (외부 AI 서비스 또는 더미 응답)
      let botResponse;
      let totalTokens = 0;

      try {
        // AI 서비스 URL이 설정되어 있으면 외부 서비스 호출
        if (process.env.AI_SERVICE_URL) {
          const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/conversation`, {
            message: input,
            conversationRoomNo,
            userNo
          }, {
            timeout: 30000
          });

          botResponse = aiResponse.data.message;
          totalTokens = aiResponse.data.totalTokens || 0;
        } else {
          // AI 서비스가 없으면 더미 응답
          botResponse = this.generateDummyResponse(input);
          totalTokens = Math.floor(Math.random() * 100) + 50;
        }
      } catch (aiError) {
        console.warn('AI 서비스 호출 실패, 더미 응답 사용:', aiError.message);
        botResponse = this.generateDummyResponse(input);
        totalTokens = Math.floor(Math.random() * 100) + 50;
      }

      // 4. 봇 응답 로그 저장
      const botLog = await ConversationLog.create({
        conversationRoomNo,
        conversationLogSender: 'BOT',
        conversationLogMessage: botResponse,
        conversationLogCreatedAt: new Date()
      });

      // 5. 대화방 업데이트 시간 갱신
      await room.update({
        conversationRoomUpdatedAt: new Date()
      });

      console.log(`💬 Conversation completed - UserNo: ${userNo}, RoomNo: ${conversationRoomNo}, Tokens: ${totalTokens}`);

      return {
        message: botResponse,
        conversationLogNo: botLog.conversationLogNo,
        totalTokens,
        actionRequired: false,
        reservationResult: null
      };

    } catch (error) {
      console.error('❌ ConversationService.processConversation Error:', error);
      throw error;
    }
  }

  /**
   * 대화 내역 조회
   */
  static async getConversationHistory(conversationRoomNo, userNo) {
    try {
      // 대화방 소유권 확인
      const room = await ConversationRoom.findOne({
        where: {
          conversationRoomNo,
          userNo,
          conversationRoomIsActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      // 대화 로그 조회
      const logs = await ConversationLog.findAll({
        where: {
          conversationRoomNo
        },
        order: [['conversationLogCreatedAt', 'ASC']]
      });

      return {
        conversationRoomNo,
        conversationRoomTitle: room.conversationRoomTitle,
        logs: logs.map(log => ({
          conversationLogNo: log.conversationLogNo,
          sender: log.conversationLogSender,
          message: log.conversationLogMessage,
          createdAt: log.conversationLogCreatedAt
        }))
      };

    } catch (error) {
      console.error('❌ ConversationService.getConversationHistory Error:', error);
      throw error;
    }
  }

  /**
   * 더미 응답 생성 (AI 서비스가 없을 때)
   */
  static generateDummyResponse(input) {
    const responses = [
      '안녕하세요! 무엇을 도와드릴까요?',
      '네, 말씀해 주세요.',
      '그렇군요. 더 자세히 알려주실 수 있나요?',
      '이해했습니다. 다른 질문이 있으시면 언제든 말씀해 주세요.',
      '복지 서비스에 대해 궁금한 점이 있으시면 알려주세요.',
      '도움이 필요하시면 언제든지 말씀해 주세요.',
      '감사합니다. 또 다른 도움이 필요하시면 연락주세요.'
    ];

    // 입력에 따른 간단한 패턴 매칭
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('안녕') || lowerInput.includes('hello')) {
      return '안녕하세요! 똑똑 서비스입니다. 무엇을 도와드릴까요?';
    }
    
    if (lowerInput.includes('복지') || lowerInput.includes('서비스')) {
      return '복지 서비스에 대해 궁금하신 점이 있으시군요. 일상가사, 가정간병, 한울 서비스 등을 제공하고 있습니다. 어떤 서비스가 궁금하신가요?';
    }
    
    if (lowerInput.includes('예약') || lowerInput.includes('신청')) {
      return '서비스 예약을 원하시는군요. 원하시는 서비스와 날짜를 알려주시면 예약 도움을 드리겠습니다.';
    }
    
    if (lowerInput.includes('감사') || lowerInput.includes('고마워')) {
      return '천만에요! 더 도움이 필요하시면 언제든지 말씀해 주세요.';
    }

    // 랜덤 응답
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = ConversationService;
