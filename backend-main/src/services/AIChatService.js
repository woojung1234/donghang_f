const consumptionService = require('./ConsumptionService');
const WelfareService = require('./WelfareService');
const PublicWelfareApiService = require('./PublicWelfareApiService');
const OpenAIWelfareService = require('./OpenAIWelfareService');
const logger = require('../utils/logger');

class AIChatService {
  constructor() {
    // 대화 상태 관리 (세션별로 관리해야 함)
    this.sessionStates = new Map();
    
    // 오프라인 모드용 응답
    this.fallbackResponses = [
      "안녕하세요! 무엇을 도와드릴까요?",
      "도움이 필요하신가요?",
      "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요.",
      "네, 말씀해보세요.",
      "제가 어떻게 도와드릴까요?",
      "궁금한 점이 있으신가요?"
    ];

    // 복지서비스 추천 관련 키워드
    this.activityKeywords = [
      '오늘 뭐할까', '오늘 뭐하지', '오늘 할일', '오늘 뭐해', '뭐할까', '뭐하지',
      '심심해', '심심하다', '할게 없어', '할게없어', '할일없어', '할일 없어',
      '추천해줘', '추천해주세요', '뭐 좋은거 있나', '뭐 좋은거 있을까',
      '오늘 프로그램', '오늘 서비스', '이용할 수 있는', '할 수 있는',
      '복지서비스', '복지 서비스', '서비스 추천', '프로그램 추천',
      '건강', '운동', '문화', '교육', '봉사', '취미', '여가', '일자리', '취업'
    ];

    // 상세정보 요청 키워드
    this.detailKeywords = [
      '자세히', '상세히', '더 알려줘', '더 알고 싶어', '정보 알려줘', '어떤 서비스',
      '무슨 서비스', '뭔가요', '뭐예요', '설명해줘', '알려주세요', '궁금해'
    ];
  }

  // 세션 상태 초기화
  initSession(sessionId) {
    if (!this.sessionStates.has(sessionId)) {
      this.sessionStates.set(sessionId, {
        pendingExpenseData: null,
        waitingForDateConfirmation: false,
        lastRecommendedServices: null,
        waitingForServiceDetail: false
      });
    }
  }

  // 세션 상태 가져오기
  getSessionState(sessionId) {
    this.initSession(sessionId);
    return this.sessionStates.get(sessionId);
  }

  // 세션 상태 업데이트
  updateSessionState(sessionId, updates) {
    const currentState = this.getSessionState(sessionId);
    this.sessionStates.set(sessionId, { ...currentState, ...updates });
  }

  // 상세정보 요청 감지
  isDetailRequest(message, sessionState) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
    return sessionState.lastRecommendedServices && 
           this.detailKeywords.some(keyword => lowercaseMessage.includes(keyword));
  }

  // 활동/복지서비스 추천 요청 감지
  analyzeActivityInquiry(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
    const isActivityRequest = this.activityKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    if (!isActivityRequest) {
      return null;
    }

    let specificCategory = null;
    const categoryKeywords = {
      '건강': ['건강', '운동', '체조', '걷기', '산책', '스포츠', '헬스', '의료'],
      '문화': ['문화', '음악', '미술', '독서', '영화', '공연', '예술', '취미'],
      '교육': ['교육', '배우기', '공부', '강의', '수업', '학습', '스마트폰', '컴퓨터'],
      '사회': ['봉사', '모임', '커뮤니티', '만남', '사회', '참여', '활동'],
      '돌봄': ['돌봄', '지원', '도움', '케어', '관리', '상담', '치료'],
      '취업': ['일자리', '취업', '일', '직업', '근무', '고용', '구직']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        specificCategory = category;
        break;
      }
    }

    return {
      isActivityRequest: true,
      specificCategory: specificCategory,
      originalMessage: message
    };
  }

  // 🚀 NEW: 공공데이터 + GPT 기반 복지서비스 추천 생성
  async generateWelfareRecommendation(specificCategory = null, userId = null, sessionId = 'default', originalMessage = '') {
    try {
      logger.info('🔥 새로운 복지서비스 추천 생성 시작:', { specificCategory, userId });

      const userProfile = {
        age: 65,
        interests: specificCategory ? [specificCategory] : ['건강', '문화'],
        region: '서울',
        originalQuestion: originalMessage
      };

      logger.info('📡 공공데이터 API에서 복지서비스 조회 중...');
      const publicServices = await PublicWelfareApiService.getRecommendedServicesForSeniors(userProfile);

      if (!publicServices || publicServices.length === 0) {
        logger.warn('⚠️ 공공데이터에서 복지서비스를 가져올 수 없음 - 폴백 사용');
        return await this.generateFallbackRecommendation(originalMessage);
      }

      logger.info(`✅ 공공데이터에서 ${publicServices.length}개 복지서비스 조회 완료`);

      logger.info('🤖 GPT로 자연스러운 추천 응답 생성 중...');
      const recommendation = await OpenAIWelfareService.generateWelfareRecommendation(
        publicServices,
        userProfile
      );

      this.updateSessionState(sessionId, { 
        lastRecommendedServices: publicServices,
        waitingForServiceDetail: true 
      });

      logger.info('🎉 복지서비스 추천 생성 완료');
      return recommendation;

    } catch (error) {
      logger.error('❌ 복지서비스 추천 생성 오류:', error);
      return await this.generateFallbackRecommendation(originalMessage);
    }
  }

  // 상세 복지서비스 정보 제공 (GPT 기반)
  async generateDetailedWelfareInfo(services, originalMessage = '') {
    try {
      logger.info('📋 GPT 기반 상세 복지서비스 정보 생성 중...');
      
      const userContext = {
        originalQuestion: originalMessage
      };

      const detailedInfo = await OpenAIWelfareService.generateDetailedWelfareInfo(services, userContext);
      
      logger.info('✅ 상세 정보 생성 완료');
      return detailedInfo;

    } catch (error) {
      logger.error('❌ 상세 정보 생성 오류:', error);
      return this.generateFallbackDetailedInfo(services);
    }
  }

  // 폴백 추천 (API 실패 시)
  async generateFallbackRecommendation(originalMessage = '') {
    logger.info('🔄 폴백 추천 생성');
    
    try {
      const fallbackServices = [
        {
          serviceName: '건강한 산책',
          serviceSummary: '날씨가 좋으니 근처 공원에서 가벼운 산책은 어떠세요?',
          organizationName: '지역보건소'
        },
        {
          serviceName: '독서 시간',
          serviceSummary: '좋아하는 책을 읽으며 여유로운 시간을 보내보세요!',
          organizationName: '지역도서관'
        }
      ];

      const userContext = {
        originalQuestion: originalMessage,
        age: 65
      };

      if (OpenAIWelfareService.checkAvailability()) {
        return await OpenAIWelfareService.generateWelfareRecommendation(fallbackServices, userContext);
      } else {
        return this.getDefaultActivityRecommendation();
      }
    } catch (error) {
      logger.error('폴백 추천 생성 실패:', error);
      return this.getDefaultActivityRecommendation();
    }
  }

  // 기본 활동 추천 (모든 서비스 실패 시)
  getDefaultActivityRecommendation() {
    const defaultActivities = [
      {
        name: '건강한 산책',
        description: '날씨가 좋으니 근처 공원에서 가벼운 산책은 어떠세요? 신선한 공기를 마시며 건강도 챙기실 수 있어요.'
      },
      {
        name: '독서 시간',
        description: '좋아하는 책을 읽으며 여유로운 시간을 보내보세요. 도서관에서 새로운 책을 빌려보시는 것도 좋겠어요.'
      },
      {
        name: '가벼운 체조',
        description: '집에서 할 수 있는 간단한 스트레칭으로 몸을 풀어보세요. TV 체조 프로그램을 따라해보시는 것도 좋아요.'
      },
      {
        name: '가족과의 시간',
        description: '가족들과 안부 전화를 나누며 따뜻한 시간을 보내세요. 손자손녀들 목소리를 들으면 기분이 좋아지실 거예요.'
      }
    ];

    const selected = defaultActivities[Math.floor(Math.random() * defaultActivities.length)];
    
    return `오늘은 ${selected.name}는 어떠세요?

${selected.description}

복지서비스 페이지에서 더 많은 프로그램을 확인하실 수 있어요!`;
  }

  // 폴백 상세정보
  generateFallbackDetailedInfo(services) {
    if (!services || services.length === 0) {
      return '죄송합니다. 상세 정보를 가져올 수 없습니다.';
    }

    let response = '복지서비스 상세 정보를 알려드릴게요.\\n\\n';

    services.forEach((service, index) => {
      response += `📋 **${service.serviceName}**\\n`;
      
      if (service.serviceSummary) {
        response += `📝 내용: ${service.serviceSummary}\\n`;
      }
      
      if (service.targetAudience) {
        response += `👥 대상: ${service.targetAudience}\\n`;
      }
      
      if (service.organizationName) {
        response += `🏢 담당기관: ${service.organizationName}\\n`;
      }
      
      if (service.contactInfo) {
        response += `📞 문의: ${service.contactInfo}\\n`;
      }
      
      if (service.applicationMethod) {
        response += `📋 신청방법: ${service.applicationMethod}\\n`;
      }
      
      if (service.website) {
        response += `🌐 웹사이트: ${service.website}\\n`;
      }
      
      if (index < services.length - 1) {
        response += '\\n' + '─'.repeat(30) + '\\n\\n';
      }
    });

    response += '\\n\\n📱 더 많은 복지서비스는 복지서비스 메뉴에서 확인하세요!';
    return response;
  }

  // 카테고리별 이모지
  getCategoryEmoji(category) {
    if (!category) return '📝';
    
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('식비') || categoryLower.includes('음식')) return '🍽️';
    if (categoryLower.includes('교통')) return '🚗';
    if (categoryLower.includes('쇼핑') || categoryLower.includes('의류')) return '🛍️';
    if (categoryLower.includes('의료') || categoryLower.includes('건강')) return '🏥';
    if (categoryLower.includes('생활용품')) return '🏠';
    if (categoryLower.includes('문화') || categoryLower.includes('여가')) return '🎭';
    if (categoryLower.includes('통신')) return '📱';
    if (categoryLower.includes('교육')) return '📚';
    
    return '💰';
  }

  // 메인 AI 응답 처리 함수
  async processMessage(message, userId, sessionId = 'default') {
    try {
      logger.info(`AI 메시지 처리 시작 - 사용자: ${userId}, 세션: ${sessionId}, 메시지: ${message}`);
      
      const sessionState = this.getSessionState(sessionId);
      const lowercaseMessage = message.toLowerCase().trim();
      
      // 1. 인사 메시지 감지
      if (lowercaseMessage.includes('안녕')) {
        logger.info('인사 메시지 감지');
        return {
          type: 'greeting',
          content: this.generateNaturalGreeting(message),
          needsVoice: true
        };
      }
      
      // 2. 금복이 역할/기능 문의 감지
      if ((lowercaseMessage.includes('뭘') && (lowercaseMessage.includes('할수') || lowercaseMessage.includes('할 수'))) || 
          lowercaseMessage.includes('무엇') || (lowercaseMessage.includes('어떤') && lowercaseMessage.includes('기능')) ||
          lowercaseMessage.includes('도와') || lowercaseMessage.includes('할일')) {
        logger.info('기능 문의 메시지 감지');
        return {
          type: 'capability',
          content: this.generateCapabilityResponse(),
          needsVoice: true
        };
      }
      
      // 3. 복지로 사이트 이동 요청 감지
      if (this.analyzeWelfarePortalRequest(message)) {
        logger.info('복지로 사이트 이동 요청 감지');
        return {
          type: 'welfare_portal_request',
          content: this.generateWelfarePortalResponse(),
          needsVoice: true,
          needsConfirmation: true,
          actionType: 'navigate_to_welfare_portal',
          actionUrl: 'https://www.bokjiro.go.kr'
        };
      }

      // 4. 상세정보 요청 확인
      if (this.isDetailRequest(message, sessionState)) {
        logger.info('복지서비스 상세정보 요청 감지');
        const detailedInfo = await this.generateDetailedWelfareInfo(sessionState.lastRecommendedServices, message);
        
        this.updateSessionState(sessionId, { 
          lastRecommendedServices: null,
          waitingForServiceDetail: false 
        });
        
        return {
          type: 'welfare_detail',
          content: detailedInfo,
          needsVoice: true
        };
      }
      
      // 5. 복지서비스/활동 추천 요청 감지
      const activityAnalysis = this.analyzeActivityInquiry(message);
      
      if (activityAnalysis) {
        logger.info('복지서비스 추천 요청 감지:', activityAnalysis);
        const recommendation = await this.generateWelfareRecommendation(
          activityAnalysis.specificCategory, 
          userId,
          sessionId,
          activityAnalysis.originalMessage
        );
        
        return {
          type: 'welfare_recommendation',
          content: recommendation,
          needsVoice: true
        };
      }
      
      // 6. 기본 응답
      const response = this.getNaturalResponse(message);
      return {
        type: 'general',
        content: response,
        needsVoice: true
      };
      
    } catch (error) {
      logger.error('AI 처리 오류:', error);
      return {
        type: 'error',
        content: this.getNaturalResponse(message),
        needsVoice: true
      };
    }
  }

  // 자연스러운 응답 생성
  getNaturalResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요! 💰";
    }
    
    if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    if (lowercaseMessage.includes("고마") || lowercaseMessage.includes("감사")) {
      return "천만에요! 언제든 도움이 필요하시면 말씀해주세요!";
    }
    
    const generalResponses = [
      "네, 말씀해주세요! 어떤 것을 도와드릴까요?",
      "궁금한 것이 있으시면 언제든 말씀해주세요!",
      "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요!",
      "무엇이든 편하게 말씀해주세요!"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  // 자연스러운 인사 응답 생성
  generateNaturalGreeting(message) {
    const greetingResponses = [
      "안녕하세요! 오늘 기분은 어떠신가요? 필요한 정보가 있으시면 언제든 말씀해주세요!",
      "안녕하세요! 좋은 하루 보내고 계신가요? 무엇을 도와드릴까요?",
      "안녕하세요! 반가워요! 오늘 어떤 것을 도와드릴까요?",
      "안녕하세요! 오늘도 좋은 하루네요! 궁금한 것이 있으시면 언제든 말씀해주세요!"
    ];
    
    return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
  }

  // 금복이 역할 소개 응답 생성
  generateCapabilityResponse() {
    const capabilityResponses = [
      "저는 주로 복지서비스 정보 안내와 금융 서비스 지원을 도와드릴 수 있어요! 혹시 구체적으로 필요한 내용을 알려주시면 더 자세히 도와드릴게요!",
      "저는 복지서비스 추천, 가계부 관리, 소비 내역 기록 등을 도와드릴 수 있어요! 무엇이 필요하신지 말씀해주세요!",
      "복지서비스 정보 안내와 가계부 관리가 저의 주요 기능이에요! 어떤 도움이 필요하신지 구체적으로 말씀해주시면 더 좋은 서비스를 제공해드릴게요!",
      "저는 여러분의 복지 생활과 가계 관리를 도와드리는 AI 도우미예요! 복지서비스 추천부터 소비 내역 관리까지, 필요한 것이 있으시면 언제든 말씀해주세요!"
    ];
    
    return capabilityResponses[Math.floor(Math.random() * capabilityResponses.length)];
  }

  // 복지로 사이트 이동 응답 생성
  generateWelfarePortalResponse() {
    const responses = [
      "복지로 사이트로 이동할 준비가 되었어요! 이동을 원하시면 확인 부탁드릴게요!",
      "복지로 사이트로 안내해드릴게요! 이동하시겠어요? 확인해주세요!",
      "복지로 홈페이지로 바로 이동하실 수 있어요! 이동하시겠습니까?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 복지로 사이트 이동 요청 감지
  analyzeWelfarePortalRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
    const welfarePortalKeywords = [
      '복지로', '복지로 사이트', '복지 사이트', '복지로 이동', '복지로 가기',
      '복지로 웹사이트', '복지포털', '복지 포털', '복지로 홈페이지'
    ];
    
    return welfarePortalKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
  }
}

module.exports = new AIChatService();