const consumptionService = require('./ConsumptionService');
const WelfareService = require('./WelfareService');
const welfareBookingAiService = require('./welfareBookingAiService');
const ConversationRoomService = require('./ConversationRoomService');
const ConversationLogService = require('./ConversationLogService');
const OpenAIService = require('./OpenAIService');
const logger = require('../utils/logger');

class aiChatService {
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
        lastRecommendedServices: null, // 마지막으로 추천한 서비스들 저장
        waitingForServiceDetail: false,
        waitingForCancelSelection: false, // 예약 취소 번호 선택 대기
        cancellableBookings: null // 취소 가능한 예약 목록
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
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // 세션에 마지막 추천 서비스가 있고, 상세정보 요청 키워드가 포함된 경우
    return sessionState.lastRecommendedServices && 
           this.detailKeywords.some(keyword => lowercaseMessage.includes(keyword));
  }

  // 활동/복지서비스 추천 요청 감지
  analyzeActivityInquiry(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // 활동 추천 관련 키워드 확인
    const isActivityRequest = this.activityKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    if (!isActivityRequest) {
      return null;
    }

    // 구체적인 카테고리 요청 확인
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

  // 사용자 프로필 분석 (소비 패턴 기반)
  async analyzeUserProfile(userId, specificCategory = null) {
    try {
      // 사용자 기본 정보 (실제 구현시 UserService에서 가져오기)
      const userProfile = {
        age: 65, // 기본값 또는 DB에서 조회
        location: '서울시', // 사용자 위치
        interests: specificCategory ? [specificCategory] : [],
        livingStatus: '독거', // 거주형태
        incomeLevel: '중간' // 소득수준
      };

      // 최근 소비 패턴으로 관심사 추론
      try {
        const recentExpenses = await consumptionService.getExpenseHistory(userId, 'recent');
        if (recentExpenses && recentExpenses.summary && recentExpenses.summary.categoryStats) {
          const topCategories = recentExpenses.summary.categoryStats.slice(0, 3);
          
          // 소비 패턴을 바탕으로 관심사 추가
          topCategories.forEach(category => {
            if (category.category.includes('의료') || category.category.includes('건강')) {
              userProfile.interests.push('건강');
            } else if (category.category.includes('문화') || category.category.includes('여가')) {
              userProfile.interests.push('문화');
            } else if (category.category.includes('교육')) {
              userProfile.interests.push('교육');
            }
          });
        }
      } catch (error) {
        logger.warn('소비 패턴 분석 실패:', error);
      }

      // 중복 제거
      userProfile.interests = [...new Set(userProfile.interests)];
      
      return userProfile;
    } catch (error) {
      logger.error('사용자 프로필 분석 오류:', error);
      return {
        age: 65,
        location: '서울시',
        interests: specificCategory ? [specificCategory] : [],
        livingStatus: '독거',
        incomeLevel: '중간'
      };
    }
  }

  // GPT를 활용한 개인화된 복지서비스 추천 생성
  async generatePersonalizedRecommendation(welfareServices, userProfile, originalMessage, sessionId) {
    try {
      if (!OpenAIService.isAvailable()) {
        return this.formatPublicWelfareRecommendation(welfareServices, userProfile.interests[0]);
      }

      // GPT에게 전달할 컨텍스트 생성
      const context = {
        featurePrompt: `당신은 복지서비스 추천 전문가입니다. 다음 정보를 바탕으로 사용자에게 맞춤형 복지서비스를 추천해주세요.

사용자 정보:
- 연령: ${userProfile.age}세
- 거주지역: ${userProfile.location}
- 관심분야: ${userProfile.interests.join(', ') || '일반'}
- 거주형태: ${userProfile.livingStatus}

사용자 질문: "${originalMessage}"

추천 가능한 복지서비스:
${welfareServices.map((service, index) => 
  `${index + 1}. ${service.serviceName}
     - 내용: ${service.serviceSummary || '복지서비스'}
     - 대상: ${service.targetAudience || '일반'}
     - 담당기관: ${service.organizationName || '관련기관'}
     - 연락처: ${service.contactInfo || '문의처 확인 필요'}
     - 카테고리: ${service.category || '일반'}`
).join('\n\n')}

위 서비스들 중에서 사용자에게 가장 적합한 2-3개를 선별하여 친근하고 자연스럽게 추천해주세요. 
각 서비스의 장점과 사용자에게 도움이 될 부분을 구체적으로 설명하고, 
상세 정보가 필요하면 "자세히 알려줘"라고 말하라고 안내해주세요.
음성으로도 전환될 수 있으니 자연스럽고 대화하는 느낌으로 작성해주세요.`
      };

      const gptResponse = await OpenAIService.generateResponse(originalMessage, context);
      const cleanResponse = OpenAIService.removeEmojisForVoice(gptResponse);

      // 세션에 추천된 서비스들 저장
      this.updateSessionState(sessionId, { 
        lastRecommendedServices: welfareServices.slice(0, 3),
        waitingForServiceDetail: true 
      });

      logger.info('GPT 기반 개인화 추천 완료');
      return cleanResponse;

    } catch (error) {
      logger.error('GPT 복지서비스 추천 생성 오류:', error);
      
      // GPT 실패시 기본 포맷팅으로 폴백
      this.updateSessionState(sessionId, { 
        lastRecommendedServices: welfareServices.slice(0, 3),
        waitingForServiceDetail: true 
      });
      
      return this.formatPublicWelfareRecommendation(welfareServices, userProfile.interests[0]);
    }
  }

  // 복지서비스 추천 생성 (개선된 버전 - DB 데이터 + GPT 활용)
  async generateWelfareRecommendation(specificCategory = null, userId = null, sessionId = 'default') {
    try {
      logger.info('개선된 복지서비스 추천 시작:', { specificCategory, userId });

      // 1. 사용자 프로필 분석
      const userProfile = await this.analyzeUserProfile(userId, specificCategory);
      logger.info('사용자 프로필 분석 완료:', userProfile);

      // 2. DB에서 복지서비스 데이터 가져오기
      let welfareServices;
      
      if (specificCategory) {
        // 특정 카테고리가 있으면 해당 카테고리로 검색
        welfareServices = await WelfareService.getWelfareByCategory(specificCategory);
        
        // 카테고리로 찾지 못했으면 키워드 검색
        if (!welfareServices || welfareServices.length === 0) {
          welfareServices = await WelfareService.searchWelfareServices(specificCategory);
        }
      } else if (userProfile.interests && userProfile.interests.length > 0) {
        // 사용자 관심사로 검색
        welfareServices = await WelfareService.getRecommendedWelfareForAI(
          userProfile.age,
          userProfile.interests,
          8 // 더 많이 가져와서 GPT가 선별하도록
        );
      } else {
        // 일반적인 추천
        welfareServices = await WelfareService.getRecommendedWelfareForAI(
          userProfile.age,
          [],
          8
        );
      }

      // 3. 서비스가 없는 경우 기본 추천
      if (!welfareServices || welfareServices.length === 0) {
        logger.info('추천할 복지서비스가 없어 기본 응답 반환');
        return this.getDefaultActivityRecommendation();
      }

      // 4. GPT를 활용한 개인화된 추천 생성
      const recommendation = await this.generatePersonalizedRecommendation(
        welfareServices,
        userProfile,
        specificCategory || '복지서비스 추천 요청',
        sessionId
      );

      logger.info('복지서비스 추천 완료');
      return recommendation;

    } catch (error) {
      logger.error('복지서비스 추천 생성 오류:', error);
      return this.getDefaultActivityRecommendation();
    }
  }

  // 상세 복지서비스 정보 제공 (GPT 활용)
  async formatDetailedWelfareRecommendation(services) {
    try {
      if (!services || services.length === 0) {
        return '죄송합니다. 상세 정보를 가져올 수 없습니다.';
      }

      // GPT를 활용한 상세 정보 생성
      if (OpenAIService.isAvailable()) {
        const context = {
          featurePrompt: `다음 복지서비스들의 상세 정보를 사용자 친화적으로 정리해서 제공해주세요. 
          각 서비스별로 주요 내용, 신청 방법, 연락처 등을 포함하여 실용적인 정보를 제공하되, 
          음성으로도 전달될 수 있으니 자연스럽게 작성해주세요.

복지서비스 목록:
${services.map((service, index) => 
  `${index + 1}. ${service.serviceName}
     - 서비스 내용: ${service.serviceSummary || '상세 내용 확인 필요'}
     - 대상: ${service.targetAudience || '일반'}
     - 담당기관: ${service.organizationName || '관련기관'}
     - 신청방법: ${service.applicationMethod || '온라인 또는 방문 신청'}
     - 연락처: ${service.contactInfo || '담당기관 문의'}
     - 웹사이트: ${service.website || service.serviceUrl || 'https://www.bokjiro.go.kr'}
     - 카테고리: ${service.category || '일반'}`
).join('\n\n')}

각 서비스를 구분하여 명확하게 설명하고, 마지막에는 복지서비스 페이지에서 더 많은 정보를 확인할 수 있다고 안내해주세요.`
        };

        const gptResponse = await OpenAIService.generateResponse('상세 정보 요청', context);
        return OpenAIService.removeEmojisForVoice(gptResponse);
      }

      // GPT 실패시 기본 포맷 사용
      return this.formatDetailedPublicWelfareRecommendation(services);

    } catch (error) {
      logger.error('상세 복지서비스 정보 생성 오류:', error);
      return this.formatDetailedPublicWelfareRecommendation(services);
    }
  }

  // 공공 API 복지서비스 추천 응답 포맷팅 (기존 방식 유지)
  formatPublicWelfareRecommendation(services, specificCategory = null) {
    if (!services || services.length === 0) {
      return this.getDefaultActivityRecommendation();
    }

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const today = new Date();
    const todayName = dayNames[today.getDay()];

    let response = '';

    // 인사말
    const greetings = [
      `안녕하세요! 오늘 ${todayName}에는 이런 복지서비스는 어떠세요?`,
      `좋은 하루예요! 오늘은 이런 서비스들을 추천해드려요!`,
      `안녕하세요! 오늘 ${todayName}에 이용하실 수 있는 서비스예요!`
    ];

    response += greetings[Math.floor(Math.random() * greetings.length)] + '\n\n';

    // 서비스 제목과 간단한 설명
    const top2 = services.slice(0, 2);
    top2.forEach((service, index) => {
      response += `${index + 1}. ${service.serviceName}\n`;
      if (service.serviceSummary) {
        const summary = service.serviceSummary.length > 100
          ? service.serviceSummary.substring(0, 100) + '...'
          : service.serviceSummary;
        response += `   ${summary}\n`;
      }
      if (service.organizationName) {
        response += `   담당기관: ${service.organizationName}\n`;
      }
      response += '\n';
    });

    // 상세정보 안내 멘트
    response += '더 자세한 정보가 필요하시면 "자세히 알려줘"라고 말씀해주세요!\n';
    response += '복지서비스 페이지에서도 더 많은 정보를 확인하실 수 있어요!';

    return response;
  }

  // 상세 복지서비스 정보 제공 (기존 방식 유지)
  formatDetailedPublicWelfareRecommendation(services) {
    if (!services || services.length === 0) {
      return '죄송합니다. 상세 정보를 가져올 수 없습니다.';
    }

    let response = '**복지서비스 상세 정보**\n\n';

    services.forEach((service, index) => {
      response += `**${service.serviceName}**\n`;
      
      if (service.serviceSummary) {
        response += `📝 **서비스 내용**: ${service.serviceSummary}\n`;
      }

      if (service.targetAudience) {
        response += `👥 **대상**: ${service.targetAudience}\n`;
      }

      if (service.applicationMethod) {
        response += `📋 **신청방법**: ${service.applicationMethod}\n`;
      }

      if (service.organizationName) {
        response += `🏢 **담당기관**: ${service.organizationName}\n`;
      }

      if (service.contactInfo) {
        response += `📞 **문의**: ${service.contactInfo}\n`;
      }

      if (service.website || service.serviceUrl) {
        response += `🌐 **웹사이트**: ${service.website || service.serviceUrl}\n`;
      }
      
      if (index < services.length - 1) {
        response += '\n' + '─'.repeat(30) + '\n\n';
      }
    });

    response += '\n\n더 많은 복지서비스는 복지서비스 메뉴에서 확인하세요!';

    return response;
  }

  // 기본 활동 추천 (복지서비스 데이터가 없을 때)
  getDefaultActivityRecommendation() {
    const defaultActivities = [
      {
        name: '건강한 산책',
        description: '날씨가 좋으니 근처 공원에서 가벼운 산책은 어떠세요?',
        category: '건강'
      },
      {
        name: '독서 시간',
        description: '좋아하는 책을 읽으며 여유로운 시간을 보내보세요!',
        category: '문화'
      },
      {
        name: '가벼운 체조',
        description: '집에서 할 수 있는 간단한 스트레칭으로 몸을 풀어보세요!',
        category: '건강'
      },
      {
        name: '가족과의 시간',
        description: '가족들과 안부 전화를 나누며 따뜻한 시간을 보내세요!',
        category: '가족'
      }
    ];

    const selected = defaultActivities[Math.floor(Math.random() * defaultActivities.length)];
    
    return `오늘은 ${selected.name}은/는 어떠세요?\n\n${selected.description}\n\n복지서비스 페이지에서 더 많은 프로그램을 확인하실 수 있어요!`;
  }

  // ... (나머지 모든 메서드들은 기존과 동일하게 유지)
  
  // 복지서비스 예약 취소 요청 감지
  analyzeWelfareBookingCancelRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const cancelKeywords = [
      '예약 취소', '예약취소', '취소해줘', '취소하고 싶어', '취소해주세요',
      '예약한거 취소', '예약한 거 취소', '복지서비스 취소', '복지 서비스 취소',
      '예약 철회', '예약취소하고 싶어', '예약을 취소', '취소하고싶어', '취소'
    ];
    
    const hasCancelKeyword = cancelKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    const isQuestionAboutCancel = (
      lowercaseMessage.includes('취소') && 
      (lowercaseMessage.includes('할수있어') || lowercaseMessage.includes('할 수 있어') || 
       lowercaseMessage.includes('가능해') || lowercaseMessage.includes('가능한가') ||
       lowercaseMessage.includes('되나') || lowercaseMessage.includes('돼'))
    );
    
    logger.info('취소 요청 분석:', { 
      message: lowercaseMessage, 
      hasCancelKeyword, 
      isQuestionAboutCancel,
      result: hasCancelKeyword || isQuestionAboutCancel
    });
    
    return hasCancelKeyword || isQuestionAboutCancel;
  }

  // 메인 AI 응답 처리 함수에서 상세정보 요청 부분만 수정
  async processMessage(message, userId, sessionId = 'default') {
    try {
      logger.info(`AI 메시지 처리 시작 - 사용자: ${userId}, 세션: ${sessionId}, 메시지: ${message}`);
      
      const sessionState = this.getSessionState(sessionId);
      const lowercaseMessage = message.toLowerCase().trim();
      
      // 대화 로그 저장
      let conversationRoomNo = 1;
      try {
        conversationRoomNo = await this.getOrCreateConversationRoom(userId, sessionId);
        await ConversationLogService.saveConversationLog(conversationRoomNo, message, 'USER', userId);
      } catch (logError) {
        logger.error('로그 저장 실패:', logError);
      }
      
      let aiResponse = null;

      // 1. 인사 메시지 감지
      if (lowercaseMessage.includes('안녕')) {
        logger.info('인사 메시지 감지');
        aiResponse = {
          type: 'greeting',
          content: await this.generateNaturalGreeting(message),
          needsVoice: true
        };
      }
      
      // 2. 기능 문의 감지
      else if ((lowercaseMessage.includes('뭘') && (lowercaseMessage.includes('할수') || lowercaseMessage.includes('할 수'))) || 
          lowercaseMessage.includes('무엇') || lowercaseMessage.includes('도와')) {
        logger.info('기능 문의 메시지 감지');
        aiResponse = {
          type: 'capability',
          content: await this.generateCapabilityResponse(message),
          needsVoice: true
        };
      }
      
      // 3. 복지서비스 예약 취소 감지 (우선 처리)
      else if (this.analyzeWelfareBookingCancelRequest(message) || this.isSpecificWelfareCancelRequest(message)) {
        logger.info('복지서비스 예약 취소 요청 감지');
        if (this.isSpecificWelfareCancelRequest(message)) {
          logger.info('🎯 구체적 복지서비스 예약 취소 요청으로 분기');
          aiResponse = await this.handleSpecificWelfareCancelRequest(userId, message);
        } else {
          aiResponse = await this.handleWelfareBookingCancelRequest(userId, message);
        }
      }
      
      // 4. 복지서비스 예약 플로우 처리
      else if (welfareBookingAiService.getBookingSessionState && welfareBookingAiService.getBookingSessionState(sessionId).waitingForWelfareBooking) {
        logger.info('복지서비스 예약 플로우 처리');
        aiResponse = await welfareBookingAiService.handleWelfareBookingFlow(message, sessionId);
      }
      
      // 5. 복지로 사이트 이동 요청 (우선 처리)
      else if (this.analyzeWelfarePortalRequest(message)) {
        logger.info('복지로 사이트 이동 요청 감지');
        aiResponse = {
          type: 'welfare_portal_request',
          content: this.generateWelfarePortalResponse(),
          needsVoice: true,
          needsConfirmation: true,
          actionType: 'navigate_to_welfare_portal',
          actionUrl: 'https://www.bokjiro.go.kr'
        };
      }
      
      // 6. 복지서비스 예약 시작 감지
      else if (welfareBookingAiService.analyzeWelfareBookingRequest && welfareBookingAiService.analyzeWelfareBookingRequest(message)) {
        logger.info('복지서비스 예약 요청 감지');
        aiResponse = welfareBookingAiService.startWelfareBooking(sessionId);
      }
      
      // 7. 상세정보 요청 확인 (수정됨)
      else if (this.isDetailRequest(message, sessionState)) {
        logger.info('복지서비스 상세정보 요청 감지');
        const detailedInfo = await this.formatDetailedWelfareRecommendation(sessionState.lastRecommendedServices);
        this.updateSessionState(sessionId, { 
          lastRecommendedServices: null, 
          waitingForServiceDetail: false 
        });
        aiResponse = {
          type: 'welfare_detail',
          content: detailedInfo,
          needsVoice: true
        };
      }
      
      // 8. 예약 취소 번호 선택 대기 상태 처리
      else if (sessionState.waitingForCancelSelection && sessionState.cancellableBookings) {
        logger.info('예약 취소 번호 선택 처리 중');
        const selectedNumber = this.extractNumberFromMessage(message);
        
        if (selectedNumber && selectedNumber >= 1 && selectedNumber <= sessionState.cancellableBookings.length) {
          const selectedBooking = sessionState.cancellableBookings[selectedNumber - 1];
          aiResponse = await this.handleDirectCancelBooking(selectedBooking, userId, sessionId);
        } else {
          aiResponse = {
            type: 'cancel_selection_retry',
            content: `1번부터 ${sessionState.cancellableBookings.length}번 중에서 취소할 예약 번호를 말씀해주세요.`,
            needsVoice: true
          };
        }
      }
      
      // 9. 날짜 확인 대기 상태 처리
      else if (sessionState.waitingForDateConfirmation && sessionState.pendingExpenseData) {
        logger.info('날짜 확인 응답 처리 중');
        const dateText = this.extractDateFromText(message);
        
        if (dateText) {
          const expenseData = { ...sessionState.pendingExpenseData, transactionDate: dateText };
          const saved = await this.saveExpenseData(expenseData, userId);
          const response = this.generateSmartResponse(expenseData, saved, this.formatDateForResponse(dateText));
          
          this.updateSessionState(sessionId, { pendingExpenseData: null, waitingForDateConfirmation: false });
          aiResponse = {
            type: 'expense_saved',
            content: response,
            expenseData: expenseData,
            saved: saved,
            needsVoice: true
          };
        } else {
          aiResponse = {
            type: 'date_request_retry',
            content: '날짜를 정확히 말씀해주세요. 예: "오늘", "어제", "5월 15일"',
            needsVoice: true
          };
        }
      }
      
      // 10. 소비내역 조회 감지 (우선 처리)
      else if (this.isExpenseInquiry(message)) {
        logger.info('소비내역 조회 요청 감지');
        try {
          const questionAnalysis = this.analyzeExpenseQuestion(message);
          const expenseHistory = await this.getExpenseHistory(message, userId);
          const formattedResponse = await this.formatExpenseHistory(expenseHistory, message, questionAnalysis);
          
          aiResponse = {
            type: 'expense_inquiry',
            content: formattedResponse,
            needsVoice: true,
            questionAnalysis: questionAnalysis
          };
        } catch (error) {
          logger.error('소비내역 조회 오류:', error);
          aiResponse = {
            type: 'expense_inquiry_error',
            content: '소비내역을 조회하는 중 오류가 발생했습니다. 다시 시도해주세요.',
            needsVoice: true
          };
        }
      }
      
      // 11. 소비내역 입력 감지  
      else {
        const expenseData = this.simpleParseExpense(message);
        
        if (expenseData) {
          logger.info('소비 내역 감지:', expenseData);
          
          if (expenseData.needsDateConfirmation) {
            this.updateSessionState(sessionId, {
              pendingExpenseData: expenseData,
              waitingForDateConfirmation: true
            });
            
            const amount = Math.floor(expenseData.amount).toLocaleString();
            aiResponse = {
              type: 'expense_date_request',
              content: `${expenseData.merchantName}에서 ${amount}원 ${expenseData.category} 지출이군요! 언제 사용하셨나요?`,
              needsVoice: true,
              expenseData: expenseData
            };
          } else {
            const saved = await this.saveExpenseData(expenseData, userId);
            aiResponse = {
              type: 'expense_saved',
              content: this.generateSmartResponse(expenseData, saved),
              expenseData: expenseData,
              saved: saved,
              needsVoice: true
            };
          }
        }
        
        // 12. 복지서비스/활동 추천 요청 (개선된 버전)
        else {
          const activityAnalysis = this.analyzeActivityInquiry(message);
          
          if (activityAnalysis) {
            logger.info('복지서비스 추천 요청 감지:', activityAnalysis);
            const recommendation = await this.generateWelfareRecommendation(activityAnalysis.specificCategory, userId, sessionId);
            aiResponse = {
              type: 'welfare_recommendation',
              content: recommendation,
              needsVoice: true
            };
          } else {
            // 13. 기본 응답
            aiResponse = {
              type: 'general',
              content: await this.getNaturalResponse(message),
              needsVoice: true
            };
          }
        }
      }
      
      // AI 응답 로그 저장
      if (aiResponse && aiResponse.content) {
        try {
          await ConversationLogService.saveConversationLog(conversationRoomNo, aiResponse.content, 'AI', userId);
        } catch (logError) {
          logger.error('AI 응답 로그 저장 실패:', logError);
        }
      }
      
      return aiResponse;
      
    } catch (error) {
      logger.error('AI 처리 오류:', error);
      return {
        type: 'error',
        content: '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        needsVoice: true
      };
    }
  }

  // 나머지 모든 메서드들은 기존과 동일하게 유지...
  
  // 복지서비스 예약 요청 감지
  analyzeWelfareBookingRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (this.analyzeWelfareBookingCancelRequest(message)) {
      return false;
    }
    
    const bookingKeywords = [
      '복지서비스 예약', '복지 서비스 예약', '복지예약', '서비스 예약',
      '예약하고 싶어', '예약해줘', '예약하고 싶다', '예약 신청',
      '가정간병 예약', '일상가사 예약', '정서지원 예약',
      '돌봄 서비스 예약', '돌봄 예약'
    ];
    
    return bookingKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
  }

  // 복지서비스 선택 감지
  analyzeWelfareServiceSelection(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const serviceMap = {
      2: ['가정간병', '간병', '가정 간병', '간병 서비스', '가정간병서비스', '가정간병 서비스'],
      1: ['일상가사', '가사', '일상 가사', '가사 서비스', '일상가사서비스', '일상가사 서비스', '가사돌봄', '가사 돌봄'],
      3: ['정서지원', '정서 지원', '정서지원서비스', '정서지원 서비스', '정서 돌봄', '정서돌봄']
    };
    
    for (const [serviceId, keywords] of Object.entries(serviceMap)) {
      if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return {
          serviceId: parseInt(serviceId),
          serviceName: serviceId === '2' ? '가정간병 돌봄' : 
                      serviceId === '1' ? '일상가사 돌봄' : '정서지원 돌봄'
        };
      }
    }
    
    return null;
  }

  // 복지서비스 예약 취소 요청 처리
  async handleWelfareBookingCancelRequest(userId, message = null) {
    try {
      const WelfareBookService = require('./WelfareBookService');
      const activeBookings = await WelfareBookService.getAllByUserNo(userId);
      
      const cancellableBookings = activeBookings.filter(booking => 
        !booking.welfareBookIsCancel && !booking.welfareBookIsComplete
      );
      
      if (cancellableBookings.length === 0) {
        return {
          type: 'booking_cancel_none',
          content: '현재 취소할 수 있는 복지서비스 예약이 없습니다. 예약 내역은 복지서비스 예약 페이지에서 확인하실 수 있어요!',
          needsVoice: true,
          needsNavigation: true,
          navigationUrl: '/welfare-reserved-list'
        };
      }
      
      if (cancellableBookings.length === 1) {
        const booking = cancellableBookings[0];
        const serviceName = booking.welfare?.welfareName || '복지서비스';
        const startDate = new Date(booking.welfareBookStartDate);
        const month = startDate.getMonth() + 1;
        const day = startDate.getDate();

        return {
          type: 'booking_cancel_single',
          content: `${month}월 ${day}일에 예약된 ${serviceName}이 있네요! 이 예약을 취소하시겠어요? "네 취소해줘" 또는 "취소하고 싶어"라고 말씀해주시면 바로 취소해드릴게요!`,
          needsVoice: true,
          needsNavigation: true,
          navigationUrl: '/welfare-reserved-list'
        };
      }
      
      let bookingList = '취소 가능한 예약이 여러 개 있네요!\n\n';
      cancellableBookings.slice(0, 3).forEach((booking, index) => {
        const serviceName = booking.welfare?.welfareName || '복지서비스';
        const startDate = new Date(booking.welfareBookStartDate);
        const month = startDate.getMonth() + 1;
        const day = startDate.getDate();
        bookingList += `${index + 1}. ${serviceName} ${month}월 ${day}일\n`;
      });
      
      if (cancellableBookings.length > 3) {
        bookingList += `외 ${cancellableBookings.length - 3}개 더 있어요.\n`;
      }
      
      bookingList += '\n원하는 예약을 말씀해주세요!\n';
      bookingList += '예: "1번 취소해줘", "가정간병 돌봄 취소해줘", "6월 1일 예약 취소해줘"';
      
      return {
        type: 'booking_cancel_multiple',
        content: bookingList,
        needsVoice: true,
        needsNavigation: true,
        navigationUrl: '/welfare-reserved-list'
      };
      
    } catch (error) {
      logger.error('예약 취소 요청 처리 오류:', error);
      return {
        type: 'booking_cancel_error',
        content: '예약 내역을 확인하는 중 오류가 발생했습니다. 복지서비스 예약 페이지에서 직접 확인해주세요!',
        needsVoice: true
      };
    }
  }

  // 복지로 포털 요청 분석
  analyzeWelfarePortalRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const welfarePortalKeywords = [
      '복지로', '복지로 사이트', '복지 사이트', '복지로 이동', '복지로 가기',
      '복지로 웹사이트', '복지포털', '복지 포털', '복지로 홈페이지'
    ];
    
    return welfarePortalKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
  }

  // 자연스러운 인사 응답 생성 (GPT 연동)
  async generateNaturalGreeting(message) {
    try {
      if (OpenAIService.isAvailable()) {
        const gptResponse = await OpenAIService.generateFeatureResponse('greeting', message);
        return OpenAIService.removeEmojisForVoice(gptResponse);
      }
    } catch (error) {
      logger.error('GPT 인사 응답 생성 실패:', error);
    }
    
    const greetingResponses = [
      "안녕하세요! 오늘 기분은 어떠신가요? 필요한 정보가 있으시면 언제든 말씀해주세요!",
      "안녕하세요! 좋은 하루 보내고 계신가요? 무엇을 도와드릴까요?",
      "안녕하세요! 반가워요! 오늘 어떤 것을 도와드릴까요?",
      "안녕하세요! 오늘도 좋은 하루네요! 궁금한 것이 있으시면 언제든 말씀해주세요!"
    ];
    
    return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
  }

  // 금복이 역할 소개 응답 생성 (GPT 연동)
  async generateCapabilityResponse(message) {
    try {
      if (OpenAIService.isAvailable()) {
        const context = {
          featurePrompt: `사용자가 금복이의 기능에 대해 질문했습니다. 
          주요 기능: 
          1. 가계부 관리 (음성/텍스트로 소비내역 입력, 월별 분석, 카테고리별 통계)
          2. 복지서비스 추천 및 예약 (맞춤형 추천, 음성 대화형 예약)  
          3. 복지로 사이트 안내
          4. 알림 관리
          
          이 기능들을 자연스럽고 친근하게 소개해주세요.`
        };
        const gptResponse = await OpenAIService.generateResponse(message, context);
        return OpenAIService.removeEmojisForVoice(gptResponse);
      }
    } catch (error) {
      logger.error('GPT 기능 소개 응답 생성 실패:', error);
    }
    
    const capabilityResponses = [
      "저는 여러 가지 기능을 도와드릴 수 있어요! 음성이나 텍스트로 가계부를 기록하고, 소비내역을 분석해드려요. 복지서비스 추천과 예약도 가능하고, 복지로 사이트 안내도 해드릴 수 있어요!",
      "다양한 기능이 있어요! 가계부 관리(소비내역 입력/조회/분석), 복지서비스 추천 및 예약, 알림 관리 등을 도와드릴 수 있습니다. 어떤 기능을 사용해보고 싶으신가요?",
      "제가 도와드릴 수 있는 기능들을 소개해드릴게요! 음성으로 가계부 기록, 월별 소비내역 분석, 복지서비스 예약, 복지로 사이트 이동 등이 가능해요. 구체적으로 뭘 도와드릴까요?",
      "저는 금복이 AI 도우미예요! 가계부 자동 기록, 소비 패턴 분석, 복지서비스 맞춤 추천, 음성 대화형 예약, 알림 관리까지 다양하게 도와드려요!"
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

  // 소비내역 조회 요청 감지
  isExpenseInquiry(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const hasAmount = /(\d+)\s*(원|만|천)/.test(lowercaseMessage);
    if (hasAmount) {
      return false;
    }
    
    const welfareKeywords = ['복지', '복지서비스', '복지 서비스', '서비스'];
    const hasWelfareKeyword = welfareKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    if (hasWelfareKeyword) {
      return false;
    }
    
    const expenseInquiryKeywords = [
      '소비내역', '소비 내역', '가계부', '지출내역', '지출 내역', '내역',
      '얼마', '소비', '지출', '돈', '현황', '리포트', '보고서',
      '알려줘', '알려주세요', '보여줘', '보여주세요', '확인', '체크',
      '카테고리', '분류', '항목', '많이', '적게', '가장', '제일',
      '통계', '분석', '비교', '랭킹', '순위'
    ];
    
    const periodKeywords = [
      '오늘', '어제', '이번주', '지난주', '이번달', '지난달', '한달', '월간',
      '주간', '일간', '최근', '전체', '올해', '작년', '5월', '4월', '3월'
    ];
    
    const hasExpenseKeyword = expenseInquiryKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    const hasPeriodOrInquiry = periodKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    ) || lowercaseMessage.includes('알려') || lowercaseMessage.includes('보여');
    
    return hasExpenseKeyword || (hasPeriodOrInquiry && (
      lowercaseMessage.includes('내역') || 
      lowercaseMessage.includes('소비') || 
      lowercaseMessage.includes('지출') ||
      lowercaseMessage.includes('가계부')
    ));
  }

  // 질문 의도 분석
  analyzeExpenseQuestion(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (lowercaseMessage.includes('카테고리') || lowercaseMessage.includes('분류') || 
        lowercaseMessage.includes('항목')) {
      
      if (lowercaseMessage.includes('가장') && (lowercaseMessage.includes('많이') || 
          lowercaseMessage.includes('높은') || lowercaseMessage.includes('큰'))) {
        return { type: 'category_most', intent: 'highest_category' };
      }
      
      if (lowercaseMessage.includes('가장') && (lowercaseMessage.includes('적게') || 
          lowercaseMessage.includes('낮은') || lowercaseMessage.includes('작은') || 
          lowercaseMessage.includes('적은'))) {
        return { type: 'category_least', intent: 'lowest_category' };
      }
      
      if (lowercaseMessage.includes('순위') || lowercaseMessage.includes('랭킹') || 
          lowercaseMessage.includes('비교')) {
        return { type: 'category_ranking', intent: 'category_comparison' };
      }
      
      return { type: 'category_general', intent: 'category_breakdown' };
    }
    
    if (lowercaseMessage.includes('총') || lowercaseMessage.includes('전체') || 
        lowercaseMessage.includes('얼마나')) {
      return { type: 'total_amount', intent: 'expense_summary' };
    }
    
    return { type: 'general_inquiry', intent: 'expense_overview' };
  }

  // 나머지 메서드들도 모두 기존과 동일하게 유지...
  // (소비내역 관련, 날짜 처리, 기타 모든 메서드들)
  
  async getExpenseHistory(message, userId) {
    try {
      const periodInfo = this.analyzePeriodFromMessage(message);
      
      let result;
      if (['may', 'april', 'march', 'february', 'january'].includes(periodInfo.type)) {
        const monthMap = {
          'january': 1,
          'february': 2,
          'march': 3,
          'april': 4,
          'may': 5
        };
        const monthNumber = monthMap[periodInfo.type];
        result = await consumptionService.getExpenseHistory(userId, 'custom_month', monthNumber);
      } else {
        result = await consumptionService.getExpenseHistory(userId, periodInfo.type);
      }
      
      return result;
    } catch (error) {
      logger.error('소비내역 조회 오류:', error);
      throw error;
    }
  }

  analyzePeriodFromMessage(message) {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('오늘')) return { type: 'today' };
    if (lowercaseMessage.includes('어제')) return { type: 'yesterday' };
    if (lowercaseMessage.includes('이번주')) return { type: 'this_week' };
    if (lowercaseMessage.includes('지난주')) return { type: 'last_week' };
    if (lowercaseMessage.includes('이번달') || lowercaseMessage.includes('한달')) return { type: 'this_month' };
    if (lowercaseMessage.includes('지난달')) return { type: 'last_month' };
    if (lowercaseMessage.includes('5월')) return { type: 'may' };
    if (lowercaseMessage.includes('4월')) return { type: 'april' };
    if (lowercaseMessage.includes('3월')) return { type: 'march' };
    if (lowercaseMessage.includes('2월')) return { type: 'february' };
    if (lowercaseMessage.includes('1월')) return { type: 'january' };
    
    return { type: 'recent' };
  }

  async formatExpenseHistory(expenseData, originalMessage, questionAnalysis = null) {
    if (!expenseData || !expenseData.consumptions || expenseData.consumptions.length === 0) {
      return "조회하신 기간에는 소비내역이 없습니다.";
    }
    
    const { consumptions, summary } = expenseData;
    
    try {
      if (OpenAIService.isAvailable()) {
        const context = {
          featurePrompt: `사용자가 소비내역을 조회했습니다.
          
          조회 결과:
          - 총 소비금액: ${Math.floor(summary.totalAmount).toLocaleString()}원
          - 거래 건수: ${summary.totalCount}건
          - 주요 카테고리: ${summary.categoryStats?.slice(0, 3).map(cat => `${cat.category} ${Math.floor(cat.totalAmount).toLocaleString()}원(${cat.percentage}%)`).join(', ')}
          
          사용자 질문: "${originalMessage}"
          
          이 정보를 바탕으로 친근하고 유용한 소비내역 분석을 제공해주세요. 구체적인 숫자와 카테고리를 언급하되, 음성으로 전환될 수 있으니 자연스럽게 설명해주세요.`
        };
        
        const gptResponse = await OpenAIService.generateResponse(originalMessage, context);
        return OpenAIService.removeEmojisForVoice(gptResponse);
      }
    } catch (error) {
      logger.error('GPT 소비내역 응답 생성 실패:', error);
    }
    
    // Fallback 로직
    let response = "";
    const period = this.getPeriodFromMessage(originalMessage);
    response += `${period} 소비내역을 확인해드릴게요. `;
    
    const totalAmount = Math.floor(summary.totalAmount);
    response += `총 ${totalAmount.toLocaleString()}원을 ${summary.totalCount}건의 거래로 사용하셨네요. `;
    
    if (summary.categoryStats && summary.categoryStats.length > 0) {
      response += "카테고리별로 보면 ";
      summary.categoryStats.slice(0, 3).forEach((category, index) => {
        const categoryAmount = Math.floor(category.totalAmount);
        if (index === 0) {
          response += `${category.category}에서 ${categoryAmount.toLocaleString()}원(${category.percentage}%)`;
        } else if (index === summary.categoryStats.slice(0, 3).length - 1) {
          response += `, ${category.category}에서 ${categoryAmount.toLocaleString()}원(${category.percentage}%)을 사용하셨어요. `;
        } else {
          response += `, ${category.category}에서 ${categoryAmount.toLocaleString()}원(${category.percentage}%)`;
        }
      });
    }
    
    response += "더 자세한 내용은 소비내역 페이지에서 확인하실 수 있어요.";
    return response;
  }

  getPeriodFromMessage(message) {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('오늘')) return '오늘';
    if (lowercaseMessage.includes('어제')) return '어제';
    if (lowercaseMessage.includes('이번주')) return '이번 주';
    if (lowercaseMessage.includes('지난주')) return '지난 주';
    if (lowercaseMessage.includes('이번달') || lowercaseMessage.includes('한달')) return '이번 달';
    if (lowercaseMessage.includes('지난달')) return '지난 달';
    if (lowercaseMessage.includes('5월')) return '5월';
    if (lowercaseMessage.includes('4월')) return '4월';
    if (lowercaseMessage.includes('3월')) return '3월';
    
    return '최근';
  }

  // 간단한 소비내역 파싱
  simpleParseExpense(input) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    logger.info('🔍 간단 파싱 - 입력:', input);
    
    let amount = 0;

    const millionPattern = /(\d+)\s*만\s*원?/;
    const millionMatch = text.match(millionPattern);
    if (millionMatch) {
      amount = parseInt(millionMatch[1]) * 10000;
    } else {
      const thousandPattern = /(\d+)\s*천\s*원?/;
      const thousandMatch = text.match(thousandPattern);
      if (thousandMatch) {
        amount = parseInt(thousandMatch[1]) * 1000;
      } else {
        const wonPattern = /(\d{1,3}(?:,\d{3})*|\d+)\s*원/;
        const wonMatch = text.match(wonPattern);
        if (wonMatch) {
          amount = parseInt(wonMatch[1].replace(/,/g, ''));
        }
      }
    }

    if (amount === 0) {
      return null;
    }

    const expenseKeywords = [
      '썼', '먹', '샀', '구매', '지불', '결제', '냈', '마셨', '타고', '갔다', 
      '사용', '쓰다', '지출', '소비', '소진', '결재', '밥', '식사', '했어', '했다'
    ];
    
    const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
    
    if (!hasExpenseKeyword) {
      return null;
    }

    const extractedDate = this.extractDateFromText(text);
    const category = this.inferCategoryFromText(text);
    const merchantName = this.inferMerchantFromText(text) || this.getDefaultMerchantByCategory(category);
    
    return {
      amount: amount,
      category: category,
      merchantName: merchantName,
      originalText: input,
      transactionDate: extractedDate,
      needsDateConfirmation: !extractedDate
    };
  }

  extractDateFromText(text) {
    const getKSTDateWithOffset = (offsetDays = 0) => {
      const now = new Date();
      const kstOffset = 9 * 60;
      const kstTime = new Date(now.getTime() + (kstOffset * 60 * 1000));
      kstTime.setDate(kstTime.getDate() + offsetDays);
      return kstTime.toISOString().split('T')[0];
    };
    
    if (text.includes('오늘')) {
      return getKSTDateWithOffset(0);
    }
    
    if (text.includes('어제')) {
      return getKSTDateWithOffset(-1);
    }
    
    if (text.includes('그제') || text.includes('그저께')) {
      return getKSTDateWithOffset(-2);
    }
    
    const daysAgoPattern = /(\d+)\s*일\s*전/;
    const daysAgoMatch = text.match(daysAgoPattern);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      return getKSTDateWithOffset(-daysAgo);
    }
    
    const monthDayPattern = /(?:(\d{1,2})월\s*)?(\d{1,2})일/;
    const monthDayMatch = text.match(monthDayPattern);
    if (monthDayMatch) {
      const now = new Date();
      const kstOffset = 9 * 60;
      const kstToday = new Date(now.getTime() + (kstOffset * 60 * 1000));
      
      const month = monthDayMatch[1] ? parseInt(monthDayMatch[1]) : kstToday.getMonth() + 1;
      const day = parseInt(monthDayMatch[2]);
      
      let year = kstToday.getFullYear();
      const currentMonth = kstToday.getMonth() + 1;
      
      if (month > currentMonth) {
        year -= 1;
      }
      
      const targetDate = new Date(year, month - 1, day, 12, 0, 0);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      
      return `${yyyy}-${mm}-${dd}`;
    }
    
    return null;
  }

  inferCategoryFromText(text) {
    const categoryMap = {
      '식비': ['점심', '저녁', '아침', '밥', '식사', '먹', '음식', '치킨', '피자', '커피', '음료', '술', '맥주', '소주', '카페'],
      '교통비': ['버스', '지하철', '택시', '기차', '비행기', '주유', '기름', '교통카드', '전철'],
      '쇼핑': ['옷', '신발', '가방', '화장품', '액세서리', '샀', '구매', '쇼핑'],
      '의료비': ['병원', '약국', '의료', '치료', '진료', '약', '건강', '병원비'],
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

  inferMerchantFromText(text) {
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

  getDefaultMerchantByCategory(category) {
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

  formatDateForResponse(dateString) {
    if (!dateString) return '오늘';
    
    const getKSTDateString = (offsetDays = 0) => {
      const now = new Date();
      const kstOffset = 9 * 60;
      const kstTime = new Date(now.getTime() + (kstOffset * 60 * 1000));
      kstTime.setDate(kstTime.getDate() + offsetDays);
      return kstTime.toISOString().split('T')[0];
    };
    
    const todayKST = getKSTDateString(0);
    const yesterdayKST = getKSTDateString(-1);
    
    if (dateString === todayKST) {
      return '오늘';
    } else if (dateString === yesterdayKST) {
      return '어제';
    } else {
      const date = new Date(dateString + 'T00:00:00');
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  }

  async getOrCreateConversationRoom(userId, sessionId) {
    try {
      let conversationRoom = await ConversationRoomService.findByUserAndSession(userId, sessionId);
      
      if (!conversationRoom) {
        conversationRoom = await ConversationRoomService.createConversationRoom(userId, sessionId);
      }
      
      const roomNo = conversationRoom.roomNo || conversationRoom.conversationRoomNo;
      
      if (roomNo) {
        return roomNo;
      } else {
        logger.error('대화방 ID를 찾을 수 없음:', conversationRoom);
        return 1;
      }
      
    } catch (error) {
      logger.error('대화방 생성/조회 오류:', error.message, error.stack);
      return 1;
    }
  }

  async saveExpenseData(expenseData, userId) {
    try {
      const apiData = {
        merchantName: expenseData.merchantName,
        amount: expenseData.amount,
        category: expenseData.category,
        memo: `음성 입력: ${expenseData.originalText}`
      };
      
      if (expenseData.transactionDate) {
        apiData.transactionDate = expenseData.transactionDate;
      }
      
      const result = await consumptionService.createConsumptionForAI(userId, apiData);
      return true;
    } catch (error) {
      logger.error('소비 내역 저장 실패:', error);
      return false;
    }
  }

  generateSmartResponse(expenseData, saved, dateFormatted = null) {
    if (expenseData && saved) {
      const amount = Math.floor(expenseData.amount).toLocaleString();
      const category = expenseData.category;
      const merchant = expenseData.merchantName;
      const dateText = dateFormatted || '오늘';
      
      const responses = [
        `네! ${dateText} ${merchant}에서 ${amount}원 ${category} 지출을 가계부에 저장했어요!`,
        `${dateText} ${category}로 ${amount}원 지출 기록 완료!`,
        `알겠어요! ${dateText} ${amount}원 지출 내역을 가계부에 추가했습니다`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return null;
  }

  async getNaturalResponse(message) {
    try {
      if (OpenAIService.isAvailable()) {
        const gptResponse = await OpenAIService.generateFeatureResponse('general', message);
        return OpenAIService.removeEmojisForVoice(gptResponse);
      }
    } catch (error) {
      logger.error('GPT 일반 응답 생성 실패:', error);
    }
    
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      const responses = [
        '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요',
        '가계부는 음성으로 쉽게 등록할 수 있어요! 예를 들어 "만원 커피숍에서 썼어"라고 말씀해주시면 됩니다!',
        '가계부 관리가 필요하시군요! 간단히 "얼마 어디서 썼어" 형태로 말씀해주시면 자동으로 기록해드려요!'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      const responses = [
        "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요!",
        "안녕하세요! 오늘 하루 어떻게 보내고 계신가요? 가계부 정리나 복지서비스 안내가 필요하시면 언제든 말씀해주세요!",
        "반가워요! 좋은 하루 보내고 계신가요? 무엇이든 편하게 말씀해주세요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } 
    
    if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      const responses = [
        "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!",
        "금복이예요! 여러분의 가계 관리와 복지 생활을 도와드리는 AI 도우미입니다!",
        "안녕하세요, 저는 금복이에요! 돈 관리와 복지서비스가 저의 전문 분야랍니다!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } 
    
    const generalResponses = [
      "네, 말씀해주세요! 어떤 것을 도와드릴까요?",
      "궁금한 것이 있으시면 언제든 말씀해주세요!",
      "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요!",
      "무엇이든 편하게 말씀해주세요!",
      "어떤 도움이 필요하신지 알려주시면 최선을 다해 도와드릴게요!"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  getOfflineResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요';
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요!";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }

  // 나머지 메서드들 (예약 관련, 취소 관련 등) - 기존과 동일하게 유지
  extractNumberFromMessage(message) {
    const numberMatch = message.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1]) : null;
  }

  async handleDirectCancelBooking(booking, userId, sessionId) {
    try {
      logger.info('직접 예약 취소 처리:', booking);
      
      const WelfareBookService = require('./WelfareBookService');
      const result = await WelfareBookService.deleteWelfareBook(booking.welfareBookNo, userId);
      
      this.updateSessionState(sessionId, {
        waitingForCancelSelection: false,
        cancellableBookings: null
      });
      
      if (result) {
        const serviceName = booking.welfare?.welfareName || '복지서비스';
        const startDate = new Date(booking.welfareBookStartDate);
        const month = startDate.getMonth() + 1;
        const day = startDate.getDate();
        
        return {
          type: 'booking_cancelled_success',
          content: `${month}월 ${day}일 ${serviceName} 예약이 성공적으로 취소되었습니다!`,
          needsVoice: true
        };
      } else {
        return {
          type: 'booking_cancelled_error',
          content: '예약 취소 중 오류가 발생했습니다. 다시 시도해주세요.',
          needsVoice: true
        };
      }
      
    } catch (error) {
      logger.error('직접 예약 취소 오류:', error);
      
      this.updateSessionState(sessionId, {
        waitingForCancelSelection: false,
        cancellableBookings: null
      });
      
      return {
        type: 'booking_cancelled_error',
        content: '예약 취소 중 오류가 발생했습니다. 다시 시도해주세요.',
        needsVoice: true
      };
    }
  }

  isSpecificWelfareCancelRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const serviceKeywords = ['일상가사', '가정간병', '정서지원', '가사', '간병'];
    const hasServiceKeyword = serviceKeywords.some(keyword => 
      lowercaseMessage.includes(keyword)
    );
    
    const datePatterns = [
      /\d{1,2}월\s*\d{1,2}일/,
      /\d{1,2}일/,
      /내일|모레|오늘/
    ];
    const hasDatePattern = datePatterns.some(pattern => 
      pattern.test(lowercaseMessage)
    );
    
    const numberPatterns = [
      /\d+번/,
      /\d+번째/,
      /첫\s*번째|첫번째/
    ];
    const hasNumberPattern = numberPatterns.some(pattern => 
      pattern.test(lowercaseMessage)
    );
    
    const hasCancelKeyword = lowercaseMessage.includes('취소');
    
    const result = (hasServiceKeyword || hasDatePattern || hasNumberPattern) && hasCancelKeyword;
    
    return result;
  }

  async handleSpecificWelfareCancelRequest(userId, message) {
    try {
      logger.info('🎯 구체적 복지서비스 취소 처리 시작:', message);
      
      const WelfareBookService = require('./WelfareBookService');
      const activeBookings = await WelfareBookService.getAllByUserNo(userId);
      
      const cancellableBookings = activeBookings.filter(booking => 
        !booking.welfareBookIsCancel && !booking.welfareBookIsComplete
      );
      
      if (cancellableBookings.length === 0) {
        return {
          type: 'booking_cancel_none',
          content: '현재 취소할 수 있는 복지서비스 예약이 없습니다.',
          needsVoice: true
        };
      }
      
      // 구체적인 예약 찾기 (기존 로직 적용)
      const specificBooking = this.analyzeSpecificCancelRequest(message, cancellableBookings);
      if (specificBooking) {
        logger.info('🎯 구체적 예약 발견, 즉시 취소 처리:', specificBooking);
        return await this.handleDirectCancelBooking(specificBooking, userId);
      } else {
        return await this.handleWelfareBookingCancelRequest(userId, null);
      }
      
    } catch (error) {
      logger.error('구체적 복지서비스 취소 처리 오류:', error);
      return {
        type: 'booking_cancel_error',
        content: '예약 취소 처리 중 오류가 발생했습니다.',
        needsVoice: true
      };
    }
  }

  analyzeSpecificCancelRequest(message, cancellableBookings) {
    // 기존 로직과 동일하게 유지 (번호, 서비스명, 날짜로 예약 선택하는 로직)
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // 1. 번호로 선택
    const numberMatch = message.match(/(\d+)번|(\d+)번째|첫\s*번째|첫번째/);
    if (numberMatch) {
      const number = numberMatch[1] || numberMatch[2] || 1;
      const index = parseInt(number) - 1;
      if (index >= 0 && index < cancellableBookings.length) {
        return cancellableBookings[index];
      }
    }
    
    // 2. 서비스명으로 선택
    for (const booking of cancellableBookings) {
      const serviceName = booking.welfare?.welfareName || '';
      
      const serviceKeywords = {
        '가정간병': ['가정간병', '간병', '간병서비스', '간병 서비스'],
        '일상가사': ['일상가사', '가사', '가사서비스', '가사 서비스', '가사돌봄'],
        '정서지원': ['정서지원', '정서', '정서지원서비스', '정서 지원']
      };
      
      for (const [category, keywords] of Object.entries(serviceKeywords)) {
        if (serviceName.includes(category)) {
          const hasKeyword = keywords.some(keyword => 
            lowercaseMessage.includes(keyword.toLowerCase())
          );
          if (hasKeyword) {
            return booking;
          }
        }
      }
    }
    
    // 3. 날짜로 선택
    for (const booking of cancellableBookings) {
      const startDate = new Date(booking.welfareBookStartDate);
      const month = startDate.getMonth() + 1;
      const day = startDate.getDate();
      
      const monthDayPattern = new RegExp(`${month}월\\s*${day}일|${month}월${day}일|${month}\\/${day}`);
      if (monthDayPattern.test(lowercaseMessage)) {
        return booking;
      }
    }
    
    return null;
  }
}

module.exports = new aiChatService();