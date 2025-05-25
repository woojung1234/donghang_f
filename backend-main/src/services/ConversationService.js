const ConversationRoom = require('../models/ConversationRoom');
const ConversationLog = require('../models/ConversationLog');
const { Consumption } = require('../models');
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

      // 3. 소비 내역 파싱 시도
      const consumptionData = this.parseExpenseFromInput(input);
      let expenseRecorded = false;

      if (consumptionData) {
        try {
          await Consumption.create({
            userNo: userNo,
            merchantName: consumptionData.merchantName,
            amount: consumptionData.amount,
            category: consumptionData.category,
            paymentMethod: '현금', // 기본값
            transactionDate: consumptionData.transactionDate,
            location: consumptionData.location,
            memo: `음성 입력: ${input}`
          });
          expenseRecorded = true;
          console.log(`💰 Expense recorded: ${consumptionData.amount}원 - ${consumptionData.category}`);
        } catch (expenseError) {
          console.error('소비 내역 저장 실패:', expenseError);
        }
      }

      // 4. AI 서비스 호출 또는 더미 응답
      let botResponse;
      let totalTokens = 0;

      try {
        // AI 서비스 URL이 설정되어 있으면 외부 서비스 호출
        if (process.env.AI_SERVICE_URL) {
          const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/conversation`, {
            message: input,
            conversationRoomNo,
            userNo,
            expenseDetected: expenseRecorded
          }, {
            timeout: 30000
          });

          botResponse = aiResponse.data.message;
          totalTokens = aiResponse.data.totalTokens || 0;
        } else {
          // AI 서비스가 없으면 더미 응답
          botResponse = this.generateSmartResponse(input, expenseRecorded, consumptionData);
          totalTokens = Math.floor(Math.random() * 100) + 50;
        }
      } catch (aiError) {
        console.warn('AI 서비스 호출 실패, 더미 응답 사용:', aiError.message);
        botResponse = this.generateSmartResponse(input, expenseRecorded, consumptionData);
        totalTokens = Math.floor(Math.random() * 100) + 50;
      }

      // 5. 봇 응답 로그 저장
      const botLog = await ConversationLog.create({
        conversationRoomNo,
        conversationLogSender: 'BOT',
        conversationLogMessage: botResponse,
        conversationLogCreatedAt: new Date()
      });

      // 6. 대화방 업데이트 시간 갱신
      await room.update({
        conversationRoomUpdatedAt: new Date()
      });

      console.log(`💬 Conversation completed - UserNo: ${userNo}, RoomNo: ${conversationRoomNo}, Tokens: ${totalTokens}, ExpenseRecorded: ${expenseRecorded}`);

      return {
        message: botResponse,
        conversationLogNo: botLog.conversationLogNo,
        totalTokens,
        actionRequired: false,
        reservationResult: null,
        expenseRecorded: expenseRecorded,
        expenseData: expenseRecorded ? consumptionData : null
      };

    } catch (error) {
      console.error('❌ ConversationService.processConversation Error:', error);
      throw error;
    }
  }

  /**
   * 입력 텍스트에서 소비 내역 파싱
   */
  static parseExpenseFromInput(input) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // 금액 패턴 매칭 (다양한 형태의 금액 표현 지원)
    const amountPatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*원/g,  // 1,000원, 5,000원
      /(\d+)\s*천\s*원?/g,           // 5천원, 3천
      /(\d+)\s*만\s*원?/g,           // 1만원, 2만
      /(\d+)\s*원/g,                 // 5000원
      /(\d+)\s*(?=.*(?:썼|먹|샀|지불|결제|냈))/g  // 숫자 + 소비 동사
    ];

    let amount = 0;
    let amountMatch = null;

    for (const pattern of amountPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        amountMatch = match[0];
        
        if (match[0].includes('천')) {
          amount = parseInt(match[1]) * 1000;
        } else if (match[0].includes('만')) {
          amount = parseInt(match[1]) * 10000;
        } else {
          amount = parseInt(match[1].replace(/,/g, ''));
        }
        break;
      }
    }

    // 금액이 없으면 소비 내역이 아님
    if (amount === 0) {
      return null;
    }

    // 소비 관련 키워드 확인
    const expenseKeywords = ['썼', '먹', '샀', '구매', '지불', '결제', '냈', '마셨', '타고', '갔다'];
    const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
    
    if (!hasExpenseKeyword) {
      return null;
    }

    // 카테고리 추론
    const category = this.inferCategoryFromText(text);
    
    // 가맹점 추론
    const merchantName = this.inferMerchantFromText(text) || this.getDefaultMerchantByCategory(category);

    return {
      amount: amount,
      category: category,
      merchantName: merchantName,
      transactionDate: new Date(),
      location: null,
      originalText: input
    };
  }

  /**
   * 텍스트에서 카테고리 추론
   */
  static inferCategoryFromText(text) {
    const categoryMap = {
      '식비': ['점심', '저녁', '아침', '밥', '식사', '먹', '음식', '치킨', '피자', '커피', '음료', '술', '맥주', '소주', '카페'],
      '교통비': ['버스', '지하철', '택시', '기차', '비행기', '주유', '기름', '교통카드', '전철'],
      '쇼핑': ['옷', '신발', '가방', '화장품', '액세서리', '샀', '구매', '쇼핑'],
      '의료비': ['병원', '약국', '의료', '치료', '진료', '약', '건강'],
      '생활용품': ['마트', '편의점', '생활용품', '세제', '화장지', '샴푸'],
      '문화생활': ['영화', '공연', '책', '게임', '여행', '놀이공원'],
      '통신비': ['핸드폰', '인터넷', '통신비', '요금'],
      '기타': []
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return '기타';
  }

  /**
   * 텍스트에서 가맹점 추론
   */
  static inferMerchantFromText(text) {
    const merchantMap = {
      '스타벅스': ['스타벅스', '스벅'],
      '맥도날드': ['맥도날드', '맥날'],
      '버거킹': ['버거킹'],
      'KFC': ['kfc', '케이에프씨'],
      '이마트': ['이마트'],
      '롯데마트': ['롯데마트'],
      'GS25': ['gs25', 'gs편의점'],
      'CU': ['cu', '씨유'],
      'CGV': ['cgv', '씨지브이'],
      '롯데시네마': ['롯데시네마']
    };

    for (const [merchant, keywords] of Object.entries(merchantMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return merchant;
      }
    }

    return null;
  }

  /**
   * 카테고리별 기본 가맹점명
   */
  static getDefaultMerchantByCategory(category) {
    const defaultMerchants = {
      '식비': '일반음식점',
      '교통비': '교통이용',
      '쇼핑': '일반상점',
      '의료비': '병의원',
      '생활용품': '마트/편의점',
      '문화생활': '문화시설',
      '통신비': '통신사',
      '기타': '일반가맹점'
    };

    return defaultMerchants[category] || '일반가맹점';
  }

  /**
   * 스마트 응답 생성 (소비 내역 기록 여부에 따라)
   */
  static generateSmartResponse(input, expenseRecorded, expenseData) {
    if (expenseRecorded && expenseData) {
      const responses = [
        `${expenseData.amount.toLocaleString()}원 ${expenseData.category} 지출을 가계부에 기록했어요! 📝`,
        `네, ${expenseData.merchantName}에서 ${expenseData.amount.toLocaleString()}원 쓰신 걸 저장해드렸어요! 💰`,
        `${expenseData.category}로 ${expenseData.amount.toLocaleString()}원 지출 기록 완료! 가계부에서 확인하실 수 있어요 📊`,
        `알겠어요! ${expenseData.amount.toLocaleString()}원 지출 내역을 가계부에 추가했습니다 ✅`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // 기존 더미 응답 로직
    return this.generateDummyResponse(input);
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

    if (lowerInput.includes('가계부') || lowerInput.includes('소비') || lowerInput.includes('지출')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    if (lowerInput.includes('감사') || lowerInput.includes('고마워')) {
      return '천만에요! 더 도움이 필요하시면 언제든지 말씀해 주세요.';
    }

    // 랜덤 응답
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = ConversationService;