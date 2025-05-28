const consumptionService = require('./ConsumptionService');
const WelfareService = require('./WelfareService');
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
        lastRecommendedServices: null, // 마지막으로 추천한 서비스들 저장
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
    
    // 세션에 마지막 추천 서비스가 있고, 상세정보 요청 키워드가 포함된 경우
    return sessionState.lastRecommendedServices && 
           this.detailKeywords.some(keyword => lowercaseMessage.includes(keyword));
  }

  // 활동/복지서비스 추천 요청 감지
  analyzeActivityInquiry(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
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

  // 복지서비스 추천 생성 (간소화된 형태)
  async generateWelfareRecommendation(specificCategory = null, userId = null, sessionId = 'default') {
    try {
      logger.info('복지서비스 추천 생성 시작:', { specificCategory, userId });

      // 사용자 정보 추론 (나이 등) - 실제로는 사용자 DB에서 가져와야 함
      const userAge = 65; // 기본값
      const interests = specificCategory ? [specificCategory] : [];

      // WelfareService의 AI용 추천 함수 사용
      const recommendedServices = await WelfareService.getRecommendedWelfareForAI(
        userAge, 
        interests, 
        3
      );

      if (!recommendedServices || recommendedServices.length === 0) {
        logger.info('추천할 복지서비스가 없습니다.');
        return this.getDefaultActivityRecommendation();
      }

      // 세션에 추천된 서비스들 저장
      this.updateSessionState(sessionId, { 
        lastRecommendedServices: recommendedServices,
        waitingForServiceDetail: true 
      });

      logger.info('추천할 복지서비스 수:', recommendedServices.length);
      return this.formatSimpleWelfareRecommendation(recommendedServices, specificCategory);

    } catch (error) {
      logger.error('복지서비스 추천 생성 오류:', error);
      return this.getDefaultActivityRecommendation();
    }
  }

  // 간소화된 복지서비스 추천 응답 포맷팅 (제목만)
  formatSimpleWelfareRecommendation(services, specificCategory = null) {
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

    response += greetings[Math.floor(Math.random() * greetings.length)] + '\\n\\n';

    // 서비스 제목만 간단히 나열
    services.forEach((service, index) => {
      const emoji = this.getServiceEmoji(service.category);
      response += `${index + 1}. ${service.serviceName}\\n`;
      
      // 카테고리만 간단히 표시
      if (service.category) {
        response += `   카테고리: ${service.category}\\n`;
      }
      
      if (index < services.length - 1) {
        response += '\\n';
      }
    });

    // 상세정보 안내 멘트
    response += '\\n\\n💡 궁금한 서비스가 있으시면 "자세히 알려줘"라고 말씀해주세요!';
    response += '\\n복지서비스 페이지에서도 더 많은 정보를 확인하실 수 있어요! 📋';

    return response;
  }

  // 상세 복지서비스 정보 제공
  formatDetailedWelfareRecommendation(services) {
    if (!services || services.length === 0) {
      return '죄송합니다. 상세 정보를 가져올 수 없습니다.';
    }

    let response = '📋 **복지서비스 상세 정보**\\n\\n';

    services.forEach((service, index) => {
      const emoji = this.getServiceEmoji(service.category);
      response += `${emoji} **${service.serviceName}**\\n`;
      
      if (service.serviceSummary) {
        response += `📝 **내용**: ${service.serviceSummary}\\n`;
      }

      if (service.targetAudience) {
        response += `👥 **대상**: ${service.targetAudience}\\n`;
      }

      if (service.applicationMethod) {
        response += `📋 **신청방법**: ${service.applicationMethod}\\n`;
      }

      if (service.organizationName) {
        response += `🏢 **담당기관**: ${service.organizationName}\\n`;
      }

      if (service.contactInfo) {
        response += `📞 **문의**: ${service.contactInfo}\\n`;
      }

      if (service.website) {
        response += `🌐 **웹사이트**: ${service.website}\\n`;
      }
      
      if (index < services.length - 1) {
        response += '\\n' + '─'.repeat(30) + '\\n\\n';
      }
    });

    response += '\\n\\n📱 더 많은 복지서비스는 복지서비스 메뉴에서 확인하세요!';

    return response;
  }

  // 서비스 카테고리별 이모지 반환
  getServiceEmoji(category) {
    if (!category) return '📝';
    
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('건강') || categoryLower.includes('의료') || categoryLower.includes('보건')) return '🏥';
    if (categoryLower.includes('문화') || categoryLower.includes('예술') || categoryLower.includes('체육')) return '🎨';
    if (categoryLower.includes('교육') || categoryLower.includes('평생학습')) return '📚';
    if (categoryLower.includes('사회') || categoryLower.includes('참여') || categoryLower.includes('봉사')) return '🤝';
    if (categoryLower.includes('돌봄') || categoryLower.includes('지원') || categoryLower.includes('복지')) return '💜';
    if (categoryLower.includes('취업') || categoryLower.includes('일자리') || categoryLower.includes('고용')) return '💼';
    if (categoryLower.includes('주거') || categoryLower.includes('생활')) return '🏠';
    if (categoryLower.includes('법률') || categoryLower.includes('상담')) return '💬';
    if (categoryLower.includes('안전') || categoryLower.includes('보안')) return '🛡️';
    if (categoryLower.includes('환경')) return '🌱';
    
    return '📝';
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
    
    return `오늘은 **${selected.name}**은/는 어떠세요?\\n\\n${selected.description}\\n\\n복지서비스 페이지에서 더 많은 프로그램을 확인하실 수 있어요!`;
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

  // 소비내역 조회 요청 감지 (개선됨)
  isExpenseInquiry(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
    const expenseInquiryKeywords = [
      '소비내역', '소비 내역', '가계부', '지출내역', '지출 내역', '내역',
      '얼마', '썼', '소비', '지출', '돈', '현황', '리포트', '보고서',
      '알려줘', '알려주세요', '보여줘', '보여주세요', '확인', '체크',
      '카테고리', '분류', '항목', '많이', '적게', '가장', '제일',
      '통계', '분석', '비교', '랭킹', '순위'
    ];
    
    const periodKeywords = [
      '오늘', '어제', '이번주', '지난주', '이번달', '지난달', '한달', '월간',
      '주간', '일간', '최근', '전체', '올해', '작년', '5월', '4월', '3월'
    ];
    
    // 소비내역 관련 키워드가 포함되어 있는지 확인
    const hasExpenseKeyword = expenseInquiryKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    // 기간 키워드나 조회 관련 키워드가 포함되어 있는지 확인
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

  // 질문 의도 분석 (새로 추가)
  analyzeExpenseQuestion(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\\s+/g, ' ').trim();
    
    // 카테고리 관련 질문
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
    
    // 총액/요약 질문
    if (lowercaseMessage.includes('총') || lowercaseMessage.includes('전체') || 
        lowercaseMessage.includes('얼마나')) {
      return { type: 'total_amount', intent: 'expense_summary' };
    }
    
    // 특정 상점/장소 질문
    if (lowercaseMessage.includes('어디서') || lowercaseMessage.includes('어떤 곳') || 
        lowercaseMessage.includes('가게') || lowercaseMessage.includes('상점')) {
      return { type: 'merchant_inquiry', intent: 'merchant_analysis' };
    }
    
    // 기간별 비교 질문
    if (lowercaseMessage.includes('비교') || lowercaseMessage.includes('차이') || 
        lowercaseMessage.includes('변화')) {
      return { type: 'period_comparison', intent: 'trend_analysis' };
    }
    
    // 일반적인 내역 조회
    return { type: 'general_inquiry', intent: 'expense_overview' };
  }

  // 소비내역 조회
  async getExpenseHistory(message, userId) {
    try {
      // 기간 분석
      const periodInfo = this.analyzePeriodFromMessage(message);
      
      // ConsumptionService를 통해 데이터 조회
      const result = await consumptionService.getExpenseHistory(userId, periodInfo.type);
      
      return result;
    } catch (error) {
      logger.error('소비내역 조회 오류:', error);
      throw error;
    }
  }

  // 메시지에서 기간 분석
  analyzePeriodFromMessage(message) {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('오늘')) {
      return { type: 'today' };
    }
    
    if (lowercaseMessage.includes('어제')) {
      return { type: 'yesterday' };
    }
    
    if (lowercaseMessage.includes('이번주')) {
      return { type: 'this_week' };
    }
    
    if (lowercaseMessage.includes('지난주')) {
      return { type: 'last_week' };
    }
    
    if (lowercaseMessage.includes('이번달') || lowercaseMessage.includes('한달')) {
      return { type: 'this_month' };
    }
    
    if (lowercaseMessage.includes('지난달')) {
      return { type: 'last_month' };
    }
    
    // 기본값: 최근
    return { type: 'recent' };
  }

  // 소비내역 응답 포맷팅 (개선됨)
  formatExpenseHistory(expenseData, originalMessage, questionAnalysis = null) {
    if (!expenseData || !expenseData.consumptions || expenseData.consumptions.length === 0) {
      return "조회하신 기간에는 소비내역이 없습니다.";
    }
    
    const { consumptions, summary } = expenseData;
    
    // 질문 의도에 따른 맞춤형 응답
    if (questionAnalysis) {
      switch (questionAnalysis.intent) {
        case 'highest_category':
          return this.formatHighestCategoryResponse(summary, originalMessage);
        case 'lowest_category':
          return this.formatLowestCategoryResponse(summary, originalMessage);
        case 'category_comparison':
          return this.formatCategoryComparisonResponse(summary, originalMessage);
        case 'category_breakdown':
          return this.formatCategoryBreakdownResponse(summary, originalMessage);
        case 'merchant_analysis':
          return this.formatMerchantAnalysisResponse(consumptions, originalMessage);
        case 'expense_summary':
          return this.formatExpenseSummaryResponse(summary, originalMessage);
      }
    }
    
    // 기본 응답 포맷 (기존 로직 유지하되 더 자연스럽게)
    let response = "";
    
    // 기간별 제목
    const period = this.getPeriodFromMessage(originalMessage);
    response += `${period} 소비내역을 확인해드릴게요. `;
    
    // 총 금액 및 기본 정보 (소수점 제거)
    const totalAmount = Math.floor(summary.totalAmount);
    response += `총 ${totalAmount.toLocaleString()}원을 ${summary.totalCount}건의 거래로 사용하셨네요. `;
    
    // 카테고리별 통계 (상위 3개)
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

  // 가장 많이 사용한 카테고리 응답
  formatHighestCategoryResponse(summary, originalMessage) {
    if (!summary.categoryStats || summary.categoryStats.length === 0) {
      return "카테고리별 데이터가 없습니다.";
    }
    
    const period = this.getPeriodFromMessage(originalMessage);
    const highestCategory = summary.categoryStats[0];
    const amount = Math.floor(highestCategory.totalAmount);
    
    return `${period} 가장 많이 사용한 카테고리는 **${highestCategory.category}**예요! ` +
           `${amount.toLocaleString()}원으로 전체의 ${highestCategory.percentage}%를 차지하고 있네요. ` +
           `다음으로는 ${summary.categoryStats[1]?.category || '기타'} 카테고리가 많았어요.`;
  }

  // 가장 적게 사용한 카테고리 응답
  formatLowestCategoryResponse(summary, originalMessage) {
    if (!summary.categoryStats || summary.categoryStats.length === 0) {
      return "카테고리별 데이터가 없습니다.";
    }
    
    const period = this.getPeriodFromMessage(originalMessage);
    const lowestCategory = summary.categoryStats[summary.categoryStats.length - 1];
    const amount = Math.floor(lowestCategory.totalAmount);
    
    return `${period} 가장 적게 사용한 카테고리는 **${lowestCategory.category}**예요! ` +
           `${amount.toLocaleString()}원으로 전체의 ${lowestCategory.percentage}%만 사용하셨네요. ` +
           `반대로 가장 많이 사용한 건 ${summary.categoryStats[0].category} 카테고리였어요.`;
  }

  // 카테고리 비교 응답
  formatCategoryComparisonResponse(summary, originalMessage) {
    if (!summary.categoryStats || summary.categoryStats.length === 0) {
      return "카테고리별 데이터가 없습니다.";
    }
    
    const period = this.getPeriodFromMessage(originalMessage);
    let response = `${period} 카테고리별 소비 순위를 알려드릴게요!\\n\\n`;
    
    summary.categoryStats.forEach((category, index) => {
      const amount = Math.floor(category.totalAmount);
      const rank = index + 1;
      const emoji = this.getCategoryEmoji(category.category);
      
      response += `${rank}위. ${emoji} ${category.category}: ${amount.toLocaleString()}원 (${category.percentage}%)\\n`;
    });
    
    response += `\\n가장 큰 차이는 ${summary.categoryStats[0].category}와 ${summary.categoryStats[summary.categoryStats.length - 1].category} 사이네요!`;
    
    return response;
  }

  // 카테고리 세부 분석 응답
  formatCategoryBreakdownResponse(summary, originalMessage) {
    const period = this.getPeriodFromMessage(originalMessage);
    let response = `${period} 카테고리별 소비 분석이에요!\\n\\n`;
    
    if (summary.categoryStats && summary.categoryStats.length > 0) {
      summary.categoryStats.forEach((category, index) => {
        const amount = Math.floor(category.totalAmount);
        const emoji = this.getCategoryEmoji(category.category);
        
        response += `${emoji} **${category.category}**: ${amount.toLocaleString()}원 (${category.percentage}%)\\n`;
      });
      
      const total = Math.floor(summary.totalAmount);
      response += `\\n💰 **총 합계**: ${total.toLocaleString()}원`;
    }
    
    return response;
  }

  // 상점/장소 분석 응답
  formatMerchantAnalysisResponse(consumptions, originalMessage) {
    const period = this.getPeriodFromMessage(originalMessage);
    const merchantStats = this.calculateMerchantStats(consumptions);
    
    let response = `${period} 주로 이용한 곳들을 알려드릴게요!\\n\\n`;
    
    merchantStats.slice(0, 5).forEach((merchant, index) => {
      const amount = Math.floor(merchant.totalAmount);
      response += `${index + 1}. **${merchant.merchantName}**: ${amount.toLocaleString()}원 (${merchant.count}회)\\n`;
    });
    
    if (merchantStats.length > 5) {
      response += `\\n그 외 ${merchantStats.length - 5}곳에서 더 사용하셨어요.`;
    }
    
    return response;
  }

  // 총액/요약 응답
  formatExpenseSummaryResponse(summary, originalMessage) {
    const period = this.getPeriodFromMessage(originalMessage);
    const totalAmount = Math.floor(summary.totalAmount);
    
    let response = `${period} 총 **${totalAmount.toLocaleString()}원**을 사용하셨어요! `;
    
    if (summary.totalCount) {
      response += `${summary.totalCount}건의 거래가 있었고, `;
    }
    
    if (summary.categoryStats && summary.categoryStats.length > 0) {
      const avgPerCategory = Math.floor(totalAmount / summary.categoryStats.length);
      response += `카테고리당 평균 ${avgPerCategory.toLocaleString()}원 정도씩 사용하셨네요. `;
      
      response += `가장 많이 사용한 건 ${summary.categoryStats[0].category}(${summary.categoryStats[0].percentage}%)이고, `;
      response += `가장 적게 사용한 건 ${summary.categoryStats[summary.categoryStats.length - 1].category}(${summary.categoryStats[summary.categoryStats.length - 1].percentage}%)예요.`;
    }
    
    return response;
  }

  // 메시지에서 기간 추출 (개선됨)
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

  // 상점별 통계 계산
  calculateMerchantStats(consumptions) {
    const merchantMap = new Map();
    
    consumptions.forEach(transaction => {
      const merchantName = transaction.merchantName || '기타';
      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          merchantName: merchantName,
          totalAmount: 0,
          count: 0
        });
      }
      
      const merchant = merchantMap.get(merchantName);
      merchant.totalAmount += transaction.amount;
      merchant.count += 1;
    });
    
    return Array.from(merchantMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);
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

  extractDateFromText(text) {
    const today = new Date();
    
    if (text.includes('오늘')) {
      return today.toISOString().split('T')[0];
    }
    
    if (text.includes('어제')) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    if (text.includes('그제') || text.includes('그저께')) {
      const dayBeforeYesterday = new Date(today);
      dayBeforeYesterday.setDate(today.getDate() - 2);
      return dayBeforeYesterday.toISOString().split('T')[0];
    }
    
    const daysAgoPattern = /(\\d+)\\s*일\\s*전/;
    const daysAgoMatch = text.match(daysAgoPattern);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      return targetDate.toISOString().split('T')[0];
    }
    
    const monthDayPattern = /(?:(\\d{1,2})월\\s*)?(\\d{1,2})일/;
    const monthDayMatch = text.match(monthDayPattern);
    if (monthDayMatch) {
      const month = monthDayMatch[1] ? parseInt(monthDayMatch[1]) : today.getMonth() + 1;
      const day = parseInt(monthDayMatch[2]);
      
      let year = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
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

  parseExpenseFromInput(input, requestDate = false) {
    const text = input.toLowerCase().replace(/\\s+/g, ' ').trim();
    logger.info('파싱 시도 - 입력 텍스트:', text);
    
    const amountPatterns = [
      /(\\d+)\\s*원(?:[으로로]+)?/g,
      /(\\d+)\\s*천\\s*원?(?:[으로로]+)?/g,
      /(\\d+)\\s*만\\s*원?(?:[으로로]+)?/g,
      /(\\d+)(?=.*(?:썼|먹|샀|지불|결제|냈))/g
    ];

    let amount = 0;

    for (const pattern of amountPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        
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

    if (amount === 0) {
      return null;
    }

    const expenseKeywords = [
      '썼', '먹', '샀', '구매', '지불', '결제', '냈', '마셨', '타고', '갔다', 
      '사용', '쓰다', '지출', '소비', '소진', '결재', '밥', '식사'
    ];
    
    const isSimpleExpenseMessage = text.includes('원') && text.split(' ').length <= 3;
    const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
    
    if (!hasExpenseKeyword && !isSimpleExpenseMessage) {
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
      needsDateConfirmation: !extractedDate && !requestDate
    };
  }

  inferCategoryFromText(text) {
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

  // 메인 AI 응답 처리 함수 (수정됨)
  async processMessage(message, userId, sessionId = 'default') {
    try {
      logger.info(`AI 메시지 처리 시작 - 사용자: ${userId}, 세션: ${sessionId}, 메시지: ${message}`);
      
      const sessionState = this.getSessionState(sessionId);
      
      const lowercaseMessage = message.toLowerCase().trim();
      
      // 1. 인사 메시지 감지 (우선순위 최상위)
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
      

      // 1. 상세정보 요청 확인 (우선순위 최상위)
      if (this.isDetailRequest(message, sessionState)) {
        logger.info('복지서비스 상세정보 요청 감지');
        const detailedInfo = this.formatDetailedWelfareRecommendation(sessionState.lastRecommendedServices);
        
        // 세션 상태 초기화
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
      
      // 2. 복지서비스/활동 추천 요청 감지
      const activityAnalysis = this.analyzeActivityInquiry(message);
      
      if (activityAnalysis) {
        logger.info('복지서비스 추천 요청 감지:', activityAnalysis);
        const recommendation = await this.generateWelfareRecommendation(
          activityAnalysis.specificCategory, 
          userId,
          sessionId
        );
        
        return {
          type: 'welfare_recommendation',
          content: recommendation,
          needsVoice: true
        };
      }
      
      // 6. 소비내역 조회 요청 감지 (개선됨)
      if (this.isExpenseInquiry(message)) {
        logger.info('소비내역 조회 요청 감지');
        try {
          // 질문 의도 분석
          const questionAnalysis = this.analyzeExpenseQuestion(message);
          logger.info('질문 의도 분석 결과:', questionAnalysis);
          
          const expenseHistory = await this.getExpenseHistory(message, userId);
          const formattedResponse = this.formatExpenseHistory(expenseHistory, message, questionAnalysis);
          
          return {
            type: 'expense_inquiry',
            content: formattedResponse,
            needsVoice: true,
            questionAnalysis: questionAnalysis
          };
        } catch (error) {
          logger.error('소비내역 조회 오류:', error);
          return {
            type: 'expense_inquiry_error',
            content: '소비내역을 조회하는 중 오류가 발생했습니다. 다시 시도해주세요.',
            needsVoice: true
          };
        }
      }

      
      // 3. 기존 소비내역 처리 로직
      const expenseData = this.parseExpenseFromInput(message, true);
      
      if (expenseData && !expenseData.needsDateConfirmation) {
        logger.info('일반 소비 내역 감지:', expenseData);
        const saved = await this.saveExpenseData(expenseData, userId);
        const response = this.generateSmartResponse(expenseData, saved);
        
        return {
          type: 'expense_saved',
          content: response,
          expenseData: expenseData,
          saved: saved,
          needsVoice: true
        };
      }
      
      // 4. 기본 오프라인 응답
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

  getNaturalResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    // 가계부 관련 질문
    if (lowercaseMessage.includes('가계부')) {
      const responses = [
        '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝',
        '가계부는 음성으로 쉽게 등록할 수 있어요! 예를 들어 "만원 커피숍에서 썼어"라고 말씀해주시면 됩니다!',
        '가계부 관리가 필요하시군요! 간단히 "얼마 어디서 썼어" 형태로 말씀해주시면 자동으로 기록해드려요!'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 인사말
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      const responses = [
        "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요! 💰",
        "안녕하세요! 오늘 하루 어떻게 보내고 계신가요? 가계부 정리나 복지서비스 안내가 필요하시면 언제든 말씀해주세요!",
        "반가워요! 좋은 하루 보내고 계신가요? 무엇이든 편하게 말씀해주세요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } 
    
    // 이름/정체성 질문
    if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      const responses = [
        "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!",
        "금복이예요! 여러분의 가계 관리와 복지 생활을 도와드리는 AI 도우미입니다!",
        "안녕하세요, 저는 금복이에요! 돈 관리와 복지서비스가 저의 전문 분야랍니다!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } 
    
    // 도움 요청
    if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘") || lowercaseMessage.includes("도와주세요")) {
      const responses = [
        "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!",
        "물론이죠! 소비 내역 기록, 가계부 관리, 복지서비스 안내 등 무엇이든 말씀해주세요!",
        "도움이 필요하시군요! 구체적으로 어떤 것을 도와드릴까요? 가계부? 복지서비스? 아니면 다른 것?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 기능/할 수 있는 일 질문
    if ((lowercaseMessage.includes('뭘') && (lowercaseMessage.includes('할수') || lowercaseMessage.includes('할 수'))) || 
        lowercaseMessage.includes('무엇') || (lowercaseMessage.includes('어떤') && lowercaseMessage.includes('기능'))) {
      const responses = [
        "제가 할 수 있는 일들을 소개해드릴게요! 가계부 자동 기록, 소비 내역 분석, 복지서비스 추천, 활동 제안 등이 가능해요!",
        "다양한 것들을 도와드릴 수 있어요! '3만원 마트에서 썼어' 하면 가계부에 기록하고, '오늘 뭐할까?' 하면 복지서비스를 추천해드려요!",
        "음성으로 쉽게 가계부를 관리하고, 맞춤형 복지서비스도 추천해드릴 수 있어요! 또 소비 패턴 분석도 가능하답니다!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 감사 인사
    if (lowercaseMessage.includes("고마") || lowercaseMessage.includes("감사")) {
      const responses = [
        "천만에요! 언제든 도움이 필요하시면 말씀해주세요!",
        "별말씀을요! 더 궁금한 것이 있으시면 언제든 물어보세요!",
        "도움이 되었다니 다행이에요! 또 필요한 것이 있으시면 말씀해주세요!",
        "기쁘게 도와드렸어요! 앞으로도 언제든 불러주세요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 기분/안부 질문
    if (lowercaseMessage.includes("기분") || lowercaseMessage.includes("어때") || lowercaseMessage.includes("잘지내")) {
      const responses = [
        "저는 항상 좋아요! 여러분을 도와드릴 수 있어서 기분이 좋답니다!",
        "덕분에 잘 지내고 있어요! 오늘 하루는 어떠셨나요?",
        "매일매일 열심히 일하고 있어요! 무엇을 도와드릴까요?",
        "기분 좋게 지내고 있어요! 여러분이 행복하시면 저도 행복해요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 날씨 관련
    if (lowercaseMessage.includes("날씨")) {
      const responses = [
        "날씨 정보는 직접 제공해드릴 수 없지만, 날씨가 좋으면 산책이나 야외 활동을 추천해드릴 수 있어요! '오늘 뭐할까?'라고 물어보시면 복지서비스도 추천해드려요!",
        "날씨에 관해서는 잘 모르지만, 실내외 활동 추천은 가능해요! 어떤 활동을 원하시는지 말씀해주세요!",
        "직접적인 날씨 정보는 어렵지만, 날씨에 맞는 활동이나 복지서비스는 추천해드릴 수 있어요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 소비/돈 관련 일반적인 언급
    if (lowercaseMessage.includes("돈") || lowercaseMessage.includes("소비") || lowercaseMessage.includes("지출")) {
      const responses = [
        "돈 관리가 고민이시군요! 구체적으로 어떤 도움이 필요하신가요? 가계부 기록이나 소비 분석을 도와드릴 수 있어요!",
        "소비 관리에 관심이 있으시군요! '얼마 어디서 썼다'고 말씀해주시면 자동으로 기록해드려요!",
        "가계 관리가 필요하시군요! 음성으로 간편하게 소비 내역을 기록하고 분석해드릴 수 있어요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 복지 관련 일반적인 언급
    if (lowercaseMessage.includes("복지") || lowercaseMessage.includes("서비스")) {
      const responses = [
        "복지서비스에 관심이 있으시군요! '오늘 뭐할까?' 또는 '복지서비스 추천해줘'라고 말씀해주시면 맞춤형 서비스를 추천해드려요!",
        "복지서비스 정보가 필요하시군요! 어떤 분야의 서비스를 원하시는지 구체적으로 말씀해주세요!",
        "다양한 복지서비스를 안내해드릴 수 있어요! 건강, 문화, 교육, 돌봄 등 어떤 분야가 궁금하신가요?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 일반적인 질문이나 알 수 없는 내용
    const generalResponses = [
      "네, 말씀해주세요! 어떤 것을 도와드릴까요?",
      "궁금한 것이 있으시면 언제든 말씀해주세요!",
      "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요!",
      "무엇이든 편하게 말씀해주세요!",
      "어떤 도움이 필요하신지 알려주시면 최선을 다해 도와드릴게요!",
      "잘 이해하지 못했어요. 조금 더 구체적으로 말씀해주실 수 있나요?",
      "흥미로운 말씀이네요! 어떤 도움을 원하시는 건가요?",
      "네, 듣고 있어요! 더 자세히 설명해주시면 좋겠어요!"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  getOfflineResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요! 💰";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }
}

module.exports = new AIChatService();
