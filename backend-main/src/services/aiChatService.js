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
      '복지서비스', '복지 서비스', '서비스 추천', '프로그램 추천'
    ];
  }

  // 세션 상태 초기화
  initSession(sessionId) {
    if (!this.sessionStates.has(sessionId)) {
      this.sessionStates.set(sessionId, {
        pendingExpenseData: null,
        waitingForDateConfirmation: false
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
      '건강': ['건강', '운동', '체조', '걷기', '산책'],
      '문화': ['문화', '음악', '미술', '독서', '영화'],
      '교육': ['교육', '배우기', '공부', '강의', '수업'],
      '사회': ['봉사', '모임', '커뮤니티', '만남', '사회'],
      '돌봄': ['돌봄', '지원', '도움', '케어', '관리']
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

  // 복지서비스 추천 생성
  async generateWelfareRecommendation(specificCategory = null, userId = null) {
    try {
      logger.info('복지서비스 추천 생성 시작:', { specificCategory, userId });

      // 데이터베이스에서 복지서비스 목록 조회
      const allWelfareServices = await WelfareService.getAllWelfareServices();
      
      if (!allWelfareServices || allWelfareServices.length === 0) {
        return this.getDefaultActivityRecommendation();
      }

      logger.info('조회된 복지서비스 수:', allWelfareServices.length);

      // 카테고리별 필터링 (카테고리가 지정된 경우)
      let recommendedServices = allWelfareServices;
      
      if (specificCategory) {
        recommendedServices = allWelfareServices.filter(service => 
          service.welfareCategory && 
          service.welfareCategory.toLowerCase().includes(specificCategory.toLowerCase())
        );
        
        // 특정 카테고리에 해당하는 서비스가 없으면 전체에서 선택
        if (recommendedServices.length === 0) {
          recommendedServices = allWelfareServices;
        }
      }

      // 무료 서비스 우선 정렬 (가격이 0이거나 낮은 순서)
      recommendedServices.sort((a, b) => {
        const priceA = a.welfarePrice || 0;
        const priceB = b.welfarePrice || 0;
        return priceA - priceB;
      });

      // 최대 3개 서비스 선택 (무료 서비스 우선, 나머지는 랜덤)
      const freeServices = recommendedServices.filter(service => !service.welfarePrice || service.welfarePrice === 0);
      const paidServices = recommendedServices.filter(service => service.welfarePrice && service.welfarePrice > 0);
      
      let selectedServices = [];
      
      // 무료 서비스를 먼저 추가 (최대 2개)
      if (freeServices.length > 0) {
        const shuffledFree = freeServices.sort(() => 0.5 - Math.random());
        selectedServices = selectedServices.concat(shuffledFree.slice(0, 2));
      }
      
      // 부족한 만큼 유료 서비스에서 추가
      if (selectedServices.length < 3 && paidServices.length > 0) {
        const shuffledPaid = paidServices.sort(() => 0.5 - Math.random());
        const needed = 3 - selectedServices.length;
        selectedServices = selectedServices.concat(shuffledPaid.slice(0, needed));
      }
      
      // 그래도 부족하면 전체에서 추가
      if (selectedServices.length < 3) {
        const remaining = allWelfareServices.filter(service => 
          !selectedServices.some(selected => selected.welfareNo === service.welfareNo)
        );
        const shuffledRemaining = remaining.sort(() => 0.5 - Math.random());
        const needed = Math.min(3 - selectedServices.length, shuffledRemaining.length);
        selectedServices = selectedServices.concat(shuffledRemaining.slice(0, needed));
      }

      return this.formatWelfareRecommendationResponse(selectedServices, specificCategory);

    } catch (error) {
      logger.error('복지서비스 추천 생성 오류:', error);
      return this.getDefaultActivityRecommendation();
    }
  }

  // 복지서비스 추천 응답 포맷팅
  formatWelfareRecommendationResponse(services, specificCategory = null) {
    if (!services || services.length === 0) {
      return this.getDefaultActivityRecommendation();
    }

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const today = new Date();
    const todayName = dayNames[today.getDay()];

    let response = '';

    // 인사말
    const greetings = [
      `안녕하세요! 오늘 ${todayName}에는 이런 복지서비스는 어떠세요? 😊`,
      `좋은 하루예요! 오늘은 이런 활동을 추천해드려요! 🌟`,
      `안녕하세요! 오늘 ${todayName}에 해볼 만한 서비스를 소개해드릴게요! 👍`,
      `반갑습니다! 오늘은 이런 복지서비스가 있어요! ✨`
    ];

    response += greetings[Math.floor(Math.random() * greetings.length)] + '\n\n';

    // 서비스별 소개
    services.forEach((service, index) => {
      const emoji = this.getServiceEmoji(service.welfareCategory);
      response += `${emoji} **${service.welfareName}**\n`;
      
      if (service.welfareCategory) {
        response += `   분류: ${service.welfareCategory}\n`;
      }
      
      if (service.welfarePrice && service.welfarePrice > 0) {
        response += `   이용료: ${service.welfarePrice.toLocaleString()}원\n`;
      } else {
        response += `   이용료: 무료 💝\n`;
      }
      
      response += `   ${this.getServiceDescription(service.welfareName, service.welfareCategory)}\n`;
      
      if (index < services.length - 1) {
        response += '\n';
      }
    });

    // 마무리 멘트
    const closingMessages = [
      '\n관심 있는 서비스가 있으시면 복지서비스 페이지에서 자세한 정보를 확인하실 수 있어요!',
      '\n더 자세한 내용은 복지서비스 메뉴에서 확인해보세요! 📋',
      '\n궁금한 서비스가 있으시면 언제든 말씀해주세요! 🤗',
      '\n오늘도 건강하고 즐거운 하루 보내세요! 💝'
    ];

    response += closingMessages[Math.floor(Math.random() * closingMessages.length)];

    return response;
  }

  // 서비스 카테고리별 이모지 반환
  getServiceEmoji(category) {
    if (!category) return '📝';
    
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('건강') || categoryLower.includes('운동')) return '🏃‍♂️';
    if (categoryLower.includes('문화') || categoryLower.includes('음악') || categoryLower.includes('미술')) return '🎨';
    if (categoryLower.includes('교육') || categoryLower.includes('학습')) return '📚';
    if (categoryLower.includes('사회') || categoryLower.includes('봉사')) return '🤝';
    if (categoryLower.includes('돌봄') || categoryLower.includes('지원')) return '💜';
    if (categoryLower.includes('생활')) return '🏠';
    if (categoryLower.includes('의료') || categoryLower.includes('치료')) return '🏥';
    if (categoryLower.includes('상담')) return '💬';
    if (categoryLower.includes('여가') || categoryLower.includes('오락')) return '🎯';
    if (categoryLower.includes('요리') || categoryLower.includes('식사')) return '🍳';
    
    return '📝';
  }

  // 서비스별 설명 생성
  getServiceDescription(serviceName, category) {
    const descriptions = [
      '어르신들의 건강하고 즐거운 생활을 위한 서비스입니다.',
      '많은 분들이 만족하고 계신 인기 프로그램이에요.',
      '전문가가 함께하는 안전하고 유익한 활동입니다.',
      '새로운 경험과 즐거움을 선사하는 프로그램이에요.',
      '건강과 행복을 동시에 챙길 수 있는 서비스입니다.',
      '또래 친구들과 함께 참여할 수 있어 더욱 즐거워요.',
      '전문적이고 체계적인 프로그램으로 준비되어 있습니다.'
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  // 기본 활동 추천 (복지서비스 데이터가 없을 때)
  getDefaultActivityRecommendation() {
    const defaultActivities = [
      {
        name: '건강한 산책',
        description: '날씨가 좋으니 근처 공원에서 가벼운 산책은 어떠세요? 🚶‍♂️',
        category: '건강'
      },
      {
        name: '독서 시간',
        description: '좋아하는 책을 읽으며 여유로운 시간을 보내보세요! 📚',
        category: '문화'
      },
      {
        name: '가벼운 체조',
        description: '집에서 할 수 있는 간단한 스트레칭으로 몸을 풀어보세요! 🤸‍♂️',
        category: '건강'
      },
      {
        name: '가족과의 시간',
        description: '가족들과 안부 전화를 나누며 따뜻한 시간을 보내세요! 📞',
        category: '가족'
      }
    ];

    const selected = defaultActivities[Math.floor(Math.random() * defaultActivities.length)];
    
    return `오늘은 **${selected.name}**은/는 어떠세요?\n\n${selected.description}\n\n복지서비스 페이지에서 더 많은 프로그램을 확인하실 수 있어요! 😊`;
  }

  // 기존 함수들 (날짜 추출, 소비내역 파싱 등)...
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
    
    const daysAgoPattern = /(\d+)\s*일\s*전/;
    const daysAgoMatch = text.match(daysAgoPattern);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      return targetDate.toISOString().split('T')[0];
    }
    
    const monthDayPattern = /(?:(\d{1,2})월\s*)?(\d{1,2})일/;
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
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    logger.info('파싱 시도 - 입력 텍스트:', text);
    
    const amountPatterns = [
      /(\d+)\s*원(?:[으로로]+)?/g,
      /(\d+)\s*천\s*원?(?:[으로로]+)?/g,
      /(\d+)\s*만\s*원?(?:[으로로]+)?/g,
      /(\d+)(?=.*(?:썼|먹|샀|지불|결제|냈))/g
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

  // 메인 AI 응답 처리 함수 (복지서비스 추천 기능 추가)
  async processMessage(message, userId, sessionId = 'default') {
    try {
      logger.info(`AI 메시지 처리 시작 - 사용자: ${userId}, 세션: ${sessionId}, 메시지: ${message}`);
      
      // 1. 복지서비스/활동 추천 요청 감지 (최우선)
      const activityAnalysis = this.analyzeActivityInquiry(message);
      
      if (activityAnalysis) {
        logger.info('복지서비스 추천 요청 감지:', activityAnalysis);
        const recommendation = await this.generateWelfareRecommendation(
          activityAnalysis.specificCategory, 
          userId
        );
        
        return {
          type: 'welfare_recommendation',
          content: recommendation,
          needsVoice: true
        };
      }
      
      // 2. 기존 소비내역 처리 로직...
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
      
      // 3. 기본 오프라인 응답
      const response = this.getOfflineResponse(message);
      return {
        type: 'general',
        content: response,
        needsVoice: true
      };
      
    } catch (error) {
      logger.error('AI 처리 오류:', error);
      return {
        type: 'error',
        content: this.getOfflineResponse(message),
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
      const amount = expenseData.amount.toLocaleString();
      const category = expenseData.category;
      const merchant = expenseData.merchantName;
      const dateText = dateFormatted || '오늘';
      
      const responses = [
        `네! ${dateText} ${merchant}에서 ${amount}원 ${category} 지출을 가계부에 저장했어요! 💰`,
        `${dateText} ${category}로 ${amount}원 지출 기록 완료! 📊`,
        `알겠어요! ${dateText} ${amount}원 지출 내역을 가계부에 추가했습니다 ✅`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return null;
  }

  getOfflineResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시면 가계부에 자동으로 기록해드려요! 💰";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }
}

module.exports = new AIChatService();