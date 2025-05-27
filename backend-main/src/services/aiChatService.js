const consumptionService = require('./consumptionService');
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

  // 날짜 추출 함수
  extractDateFromText(text) {
    const today = new Date();
    
    // 상대적 날짜 패턴
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
    
    // "N일 전" 패턴
    const daysAgoPattern = /(\d+)\s*일\s*전/;
    const daysAgoMatch = text.match(daysAgoPattern);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      return targetDate.toISOString().split('T')[0];
    }
    
    // "월 일" 패턴 (예: "5월 20일", "20일")
    const monthDayPattern = /(?:(\d{1,2})월\s*)?(\d{1,2})일/;
    const monthDayMatch = text.match(monthDayPattern);
    if (monthDayMatch) {
      const month = monthDayMatch[1] ? parseInt(monthDayMatch[1]) : today.getMonth() + 1;
      const day = parseInt(monthDayMatch[2]);
      
      let year = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 현재 월 (1-12)
      
      logger.info(`날짜 파싱 디버그 - 입력월: ${month}, 현재월: ${currentMonth}, 일: ${day}`);
      
      // 현재 월보다 큰 월이면 작년으로 가정
      if (month > currentMonth) {
        year -= 1;
        logger.info(`작년으로 설정: ${year}`);
      }
      
      // 한국 시간대로 날짜 생성 (UTC+9)
      const targetDate = new Date(year, month - 1, day, 12, 0, 0); // 정오로 설정하여 시간대 문제 방지
      
      // YYYY-MM-DD 형식으로 직접 문자열 생성 (시간대 영향 없음)
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const result = `${yyyy}-${mm}-${dd}`;
      
      logger.info(`최종 날짜 결과: ${result} (${year}-${month}-${day})`);
      
      return result;
    }
    
    return null;
  }

  // 소비 내역 파싱 함수
  parseExpenseFromInput(input, requestDate = false) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    logger.info('파싱 시도 - 입력 텍스트:', text);
    
    // 금액 패턴 매칭
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

    logger.info('추출된 금액:', amount);
    if (amount === 0) {
      return null;
    }

    // 소비 관련 키워드 확인
    const expenseKeywords = [
      '썼', '먹', '샀', '구매', '지불', '결제', '냈', '마셨', '타고', '갔다', 
      '사용', '쓰다', '지출', '소비', '소진', '결재', '밥', '식사'
    ];
    
    const isSimpleExpenseMessage = text.includes('원') && text.split(' ').length <= 3;
    const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
    
    if (!hasExpenseKeyword && !isSimpleExpenseMessage) {
      return null;
    }

    // 날짜 추출 시도
    const extractedDate = this.extractDateFromText(text);

    // 카테고리 추론
    const category = this.inferCategoryFromText(text);
    
    // 가맹점 추론
    const merchantName = this.inferMerchantFromText(text) || this.getDefaultMerchantByCategory(category);

    logger.info(`금액 감지: ${amount}원, 카테고리: ${category}, 가맹점: ${merchantName}`);
    
    return {
      amount: amount,
      category: category,
      merchantName: merchantName,
      originalText: input,
      transactionDate: extractedDate,
      needsDateConfirmation: !extractedDate && !requestDate
    };
  }

  // 텍스트에서 카테고리 추론
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

  // 텍스트에서 가맹점 추론
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

  // 카테고리별 기본 가맹점명
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

  // 대화형 소비내역 입력 처리 함수
  handleInteractiveExpenseInput(message, sessionId) {
    const sessionState = this.getSessionState(sessionId);
    logger.info('대화형 소비내역 처리 시작:', message, sessionState);
    
    // 날짜 확인 대기 중인 경우
    if (sessionState.waitingForDateConfirmation && sessionState.pendingExpenseData) {
      logger.info('날짜 확인 응답 처리');
      
      // 사용자 입력에서 날짜 파싱 시도
      const dateFromInput = this.parseDateFromUserInput(message);
      
      if (dateFromInput) {
        // 유효한 날짜가 입력됨 - 소비내역 저장
        const finalExpenseData = {
          ...sessionState.pendingExpenseData,
          transactionDate: dateFromInput
        };
        
        logger.info('최종 소비내역 데이터:', finalExpenseData);
        
        // 상태 초기화
        this.updateSessionState(sessionId, {
          pendingExpenseData: null,
          waitingForDateConfirmation: false
        });
        
        return {
          type: 'save_expense',
          data: finalExpenseData,
          dateFormatted: this.formatDateForDisplay(dateFromInput)
        };
      } else {
        // 유효하지 않은 날짜 - 다시 요청
        return {
          type: 'ask_date_again',
          message: '날짜를 정확히 알려주세요. 예를 들어 "오늘", "어제", "3일 전", 또는 "5월 20일" 같이 말씀해주세요.'
        };
      }
    }
    
    // 일반 소비내역 입력 처리
    const expenseData = this.parseExpenseFromInput(message);
    
    if (expenseData) {
      logger.info('소비내역 감지됨:', expenseData);
      
      if (expenseData.needsDateConfirmation) {
        // 날짜가 없는 경우 - 대화형 처리
        logger.info('날짜 확인 필요');
        
        this.updateSessionState(sessionId, {
          pendingExpenseData: expenseData,
          waitingForDateConfirmation: true
        });
        
        return {
          type: 'ask_date',
          data: expenseData,
          message: this.generateDateConfirmationMessage(expenseData)
        };
      } else {
        // 날짜가 있는 경우 - 바로 저장
        logger.info('날짜 포함된 소비내역 - 즉시 저장');
        
        return {
          type: 'save_expense',
          data: expenseData,
          dateFormatted: expenseData.transactionDate ? this.formatDateForDisplay(expenseData.transactionDate) : '오늘'
        };
      }
    }
    
    return null; // 소비내역이 아님
  }

  // 날짜 확인 메시지 생성
  generateDateConfirmationMessage(expenseData) {
    const amount = expenseData.amount.toLocaleString();
    const category = expenseData.category;
    const merchant = expenseData.merchantName;
    
    const messages = [
      `${merchant}에서 ${amount}원 ${category} 지출을 기록할게요! 언제 사용하셨나요? (예: 오늘, 어제, 3일 전, 5월 20일)`,
      `${amount}원 ${category} 내역을 저장하려고 해요. 날짜를 알려주세요! (오늘/어제/며칠 전/구체적 날짜)`,
      `${category}로 ${amount}원 쓰신 걸 확인했어요. 언제 지출하셨는지 말씀해주세요!`,
      `${amount}원 지출을 기록하겠습니다. 정확한 날짜를 알려주시면 더 정확한 가계부가 될 거예요!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // 날짜를 사용자 친화적으로 표시
  formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  }

  // 소비내역 조회 질문 감지 및 기간 분석 함수
  analyzeExpenseInquiry(message) {
    const lowercaseMessage = message.toLowerCase();
    
    // 소비내역 관련 키워드 확인
    const inquiryPatterns = [
      '소비내역', '지출내역', '가계부', '소비현황', '지출현황',
      '얼마 썼', '얼마나 썼', '돈 얼마', '지출 얼마',
      '내역 알려', '내역 보여', '내역 확인',
      '소비 확인', '지출 확인', '가계부 확인',
      '소비 리포트', '지출 리포트', '소비 분석'
    ];
    
    const isExpenseInquiry = inquiryPatterns.some(pattern => lowercaseMessage.includes(pattern));
    
    if (!isExpenseInquiry) {
      return null; // 소비내역 조회가 아님
    }
    
    // 기간 분석
    let period = 'recent'; // 기본값: 최근
    let periodText = '최근';
    let customMonth = null;
    
    // 구체적인 월 인식 (1월~12월, 작년 포함)
    const monthPattern = /(\d{1,2})월/;
    const monthMatch = lowercaseMessage.match(monthPattern);
    if (monthMatch) {
      const monthNum = parseInt(monthMatch[1]);
      if (monthNum >= 1 && monthNum <= 12) {
        customMonth = monthNum;
        period = 'custom_month';
        periodText = `${monthNum}월`;
      }
    }
    
    // 기본 기간 키워드 확인
    if (!customMonth) {
      if (lowercaseMessage.includes('오늘')) {
        period = 'today';
        periodText = '오늘';
      } else if (lowercaseMessage.includes('어제')) {
        period = 'yesterday';
        periodText = '어제';
      } else if (lowercaseMessage.includes('이번주') || lowercaseMessage.includes('이번 주')) {
        period = 'this_week';
        periodText = '이번 주';
      } else if (lowercaseMessage.includes('지난주') || lowercaseMessage.includes('지난 주')) {
        period = 'last_week';
        periodText = '지난주';
      } else if (lowercaseMessage.includes('이번달') || lowercaseMessage.includes('이번 달')) {
        period = 'this_month';
        periodText = '이번 달';
      } else if (lowercaseMessage.includes('지난달') || lowercaseMessage.includes('지난 달')) {
        period = 'last_month';
        periodText = '지난 달';
      }
    }
    
    // 리포트 요청인지 확인
    const isReport = lowercaseMessage.includes('리포트') || lowercaseMessage.includes('분석');
    
    return {
      isExpenseInquiry: true,
      period: period,
      periodText: periodText,
      customMonth: customMonth,
      isReport: isReport
    };
  }

  // 소비내역 저장
  async saveExpenseData(expenseData, userId) {
    try {
      logger.info('소비내역 저장 시도:', expenseData);
      
      const apiData = {
        merchantName: expenseData.merchantName,
        amount: expenseData.amount,
        category: expenseData.category,
        memo: `음성 입력: ${expenseData.originalText}`
      };
      
      // 날짜가 지정된 경우 추가
      if (expenseData.transactionDate) {
        apiData.transactionDate = expenseData.transactionDate;
      }
      
      const result = await consumptionService.createConsumptionForAI(userId, apiData);
      logger.info('소비 내역 저장 성공:', result);
      return true;
    } catch (error) {
      logger.error('소비 내역 저장 실패:', error);
      return false;
    }
  }

  // 스마트 응답 생성
  generateSmartResponse(expenseData, saved, dateFormatted = null) {
    if (expenseData && saved) {
      const amount = expenseData.amount.toLocaleString();
      const category = expenseData.category;
      const merchant = expenseData.merchantName;
      const dateText = dateFormatted || '오늘';
      
      const responses = [
        `네! ${dateText} ${merchant}에서 ${amount}원 ${category} 지출을 가계부에 저장했어요! 💰`,
        `${dateText} ${category}로 ${amount}원 지출 기록 완료! 가계부에서 확인하실 수 있어요 📊`,
        `알겠어요! ${dateText} ${amount}원 지출 내역을 가계부에 추가했습니다 ✅`,
        `${dateText} ${merchant}에서 ${amount}원 쓰신 걸 저장해드렸어요! 📝`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else if (expenseData && !saved) {
      return `${expenseData.amount.toLocaleString()}원 지출을 인식했지만 저장에 실패했어요. 나중에 가계부에서 직접 입력해주세요. 😅`;
    }

    return null;
  }

  // 오프라인 응답 생성 함수
  getOfflineResponse(message) {
    if (!message) return this.fallbackResponses[0];

    try {
      const lowercaseMessage = message.toLowerCase();
      
      if (lowercaseMessage.includes('가계부') || lowercaseMessage.includes('소비') || lowercaseMessage.includes('지출')) {
        return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
      }
      
      if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
        return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시면 가계부에 자동으로 기록해드려요! 💰";
      } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
        return "저는 금복이라고 합니다. 가계부 관리를 도와드릴 수 있어요!";
      } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
        return "네, 어떤 도움이 필요하신가요? 예를 들어 '5000원 점심 먹었어'라고 말씀해주시면 가계부에 자동으로 기록해드려요!";
      }
      
      return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
    } catch (error) {
      logger.error("오프라인 응답 생성 오류:", error);
      return "대화를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.";
    }
  }

  // 소비내역을 자연스러운 문장으로 변환
  formatExpenseHistory(data, period, periodText, isReport = false) {
    if (!data || !data.consumptions || data.consumptions.length === 0) {
      return `${periodText} 등록된 소비내역이 없어요. "5천원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 기록해드릴게요!`;
    }
    
    const consumptions = data.consumptions;
    const totalAmount = data.summary?.totalAmount || 0;
    
    // 리포트 형식으로 요청된 경우
    if (isReport) {
      return this.formatExpenseReport(data, period, periodText);
    }
    
    let result = `${periodText} 소비내역을 알려드릴게요! `;
    
    // 총액 정보
    if (totalAmount > 0) {
      const totalFormatted = this.formatAmountForSpeech(totalAmount);
      result += `총 지출은 ${totalFormatted}원입니다. `;
    }
    
    // 개별 내역 (최대 5개만 표시)
    const recentItems = consumptions.slice(0, 5);
    recentItems.forEach(item => {
      const amountFormatted = this.formatAmountForSpeech(item.amount);
      const merchant = item.merchantName || '일반가맹점';
      result += `${merchant}에서 ${amountFormatted}원, `;
    });
    
    result = result.replace(/,\s*$/, '. ');
    result += "더 자세한 내용은 소비현황 페이지에서 확인하실 수 있어요!";
    
    return result;
  }

  // 소비내역 리포트 포맷팅 함수
  formatExpenseReport(data, period, periodText) {
    const consumptions = data.consumptions || [];
    const totalAmount = data.summary?.totalAmount || 0;
    
    if (totalAmount === 0) {
      return `${periodText} 소비 내역이 없어요.`;
    }
    
    // 카테고리별 집계
    const categoryStats = {};
    consumptions.forEach(item => {
      const category = item.category || '기타';
      const amount = parseFloat(item.amount) || 0;
      
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category] += amount;
    });
    
    // 카테고리별 정렬 (금액 순)
    const sortedCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // 상위 5개만
    
    let result = `네, ${periodText}의 소비 리포트를 알려드릴게요. `;
    
    // 총액
    const totalFormatted = this.formatAmountForSpeech(totalAmount);
    result += `총 소비금액은 ${totalFormatted}원이었습니다. `;
    
    // 카테고리별 분석
    if (sortedCategories.length > 0) {
      result += `각 항목별로 나누면 `;
      
      sortedCategories.forEach(([category, amount], index) => {
        const amountFormatted = this.formatAmountForSpeech(amount);
        const percentage = ((amount / totalAmount) * 100).toFixed(2);
        
        if (index === sortedCategories.length - 1) {
          result += `${category} ${amountFormatted}원으로 ${percentage}%입니다. `;
        } else {
          result += `${category} ${amountFormatted}원으로 ${percentage}%, `;
        }
      });
    }
    
    return result;
  }

  // 금액을 음성 합성에 친화적으로 포맷팅
  formatAmountForSpeech(amount) {
    if (!amount) return '0';
    
    const num = parseInt(amount);
    
    if (num >= 100000000) { // 1억 이상
      const eok = Math.floor(num / 100000000);
      const remainder = num % 100000000;
      if (remainder === 0) {
        return `${eok}억`;
      } else {
        const man = Math.floor(remainder / 10000);
        return `${eok}억 ${man}만`;
      }
    } else if (num >= 10000) { // 1만 이상
      const man = Math.floor(num / 10000);
      const remainder = num % 10000;
      if (remainder === 0) {
        return `${man}만`;
      } else {
        return `${man}만 ${remainder}`;
      }
    } else if (num >= 1000) { // 1천 이상
      const cheon = Math.floor(num / 1000);
      const remainder = num % 1000;
      if (remainder === 0) {
        return `${cheon}천`;
      } else {
        return `${cheon}천 ${remainder}`;
      }
    } else {
      return num.toString();
    }
  }

  // 사용자 입력에서 날짜 파싱
  parseDateFromUserInput(dateText) {
    const text = dateText.toLowerCase().trim();
    return this.extractDateFromText(text);
  }

  // 메인 AI 응답 처리 함수
  async processMessage(message, userId, sessionId = 'default') {
    try {
      logger.info(`AI 메시지 처리 시작 - 사용자: ${userId}, 세션: ${sessionId}, 메시지: ${message}`);
      
      // 1. 대화형 소비내역 입력 처리 (최우선)
      const interactiveResult = this.handleInteractiveExpenseInput(message, sessionId);
      
      if (interactiveResult) {
        logger.info('대화형 처리 결과:', interactiveResult);
        
        if (interactiveResult.type === 'ask_date' || interactiveResult.type === 'ask_date_again') {
          return {
            type: 'text',
            content: interactiveResult.message,
            needsVoice: true
          };
        } else if (interactiveResult.type === 'save_expense') {
          // 소비내역 저장
          const saved = await this.saveExpenseData(interactiveResult.data, userId);
          const response = this.generateSmartResponse(
            interactiveResult.data, 
            saved, 
            interactiveResult.dateFormatted
          );
          
          return {
            type: 'expense_saved',
            content: response,
            expenseData: interactiveResult.data,
            saved: saved,
            needsVoice: true
          };
        }
      }
      
      // 2. 소비내역 조회 질문 분석
      const expenseAnalysis = this.analyzeExpenseInquiry(message);
      
      if (expenseAnalysis) {
        logger.info('소비내역 조회 요청 감지:', expenseAnalysis);
        const expenseHistory = await consumptionService.getExpenseHistory(
          userId, 
          expenseAnalysis.period, 
          expenseAnalysis.customMonth
        );
        const response = this.formatExpenseHistory(
          expenseHistory, 
          expenseAnalysis.period, 
          expenseAnalysis.periodText,
          expenseAnalysis.isReport
        );
        
        return {
          type: 'expense_inquiry',
          content: response,
          data: expenseHistory,
          needsVoice: true
        };
      }
      
      // 3. 일반 소비 내역 파싱 (날짜 포함된 경우)
      const expenseData = this.parseExpenseFromInput(message, true);
      
      if (expenseData && !expenseData.needsDateConfirmation) {
        logger.info('일반 소비 내역 감지 (날짜 포함):', expenseData);
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
}

module.exports = new AIChatService();
