import { call } from "login/service/ApiService";

// 설정 상수
const CONFIG = {
  DEFAULT_ROOM_NO: 1,
  MAX_HISTORY_ITEMS: 5,
  SPEECH_RATE: 0.9,
  RECOGNITION_LANG: 'ko',
  API_ENDPOINTS: {
    CONSUMPTION: '/api/v1/consumption',
    VOICE_CONSUMPTION: '/api/v1/consumption/voice'
  }
};

// 상태 관리 클래스
class ConversationState {
  constructor() {
    this.reset();
  }

  reset() {
    this.pendingExpenseData = null;
    this.waitingForDateConfirmation = false;
  }

  setPendingExpense(data) {
    this.pendingExpenseData = data;
    this.waitingForDateConfirmation = true;
  }

  confirmExpense(dateString) {
    if (!this.pendingExpenseData) return null;
    
    const finalData = {
      ...this.pendingExpenseData,
      transactionDate: dateString
    };
    
    this.reset();
    return finalData;
  }

  isWaitingForDate() {
    return this.waitingForDateConfirmation && this.pendingExpenseData !== null;
  }
}

// 날짜 처리 유틸리티 클래스
class DateUtils {
  static extractFromText(text) {
    const today = new Date();
    
    // 상대적 날짜 패턴
    const relativePatterns = {
      '오늘': 0,
      '어제': -1,
      '그제': -2,
      '그저께': -2
    };

    for (const [keyword, offset] of Object.entries(relativePatterns)) {
      if (text.includes(keyword)) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + offset);
        return targetDate.toISOString().split('T')[0];
      }
    }

    // "N일 전" 패턴
    const daysAgoMatch = text.match(/(\d+)\s*일\s*전/);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      return targetDate.toISOString().split('T')[0];
    }

    // "월 일" 패턴
    const monthDayMatch = text.match(/(?:(\d{1,2})월\s*)?(\d{1,2})일/);
    if (monthDayMatch) {
      const month = monthDayMatch[1] ? parseInt(monthDayMatch[1]) : today.getMonth() + 1;
      const day = parseInt(monthDayMatch[2]);
      
      let year = today.getFullYear();
      if (month > today.getMonth() + 1) {
        year -= 1;
      }
      
      try {
        const targetDate = new Date(year, month - 1, day);
        return targetDate.toISOString().split('T')[0];
      } catch (error) {
        console.warn('Invalid date:', { year, month, day });
        return null;
      }
    }

    return null;
  }

  static formatForDisplay(dateString) {
    try {
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
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '날짜 미상';
    }
  }

  static getDateRange(period, customMonth = null) {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = endDate = new Date(today);
        break;
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = endDate = yesterday;
        break;
      
      case 'this_week':
        const thisWeekStart = new Date(today);
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        thisWeekStart.setDate(today.getDate() + mondayOffset);
        
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        
        startDate = thisWeekStart;
        endDate = thisWeekEnd;
        break;
      
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      
      case 'custom_month':
        if (customMonth && customMonth >= 1 && customMonth <= 12) {
          const currentMonth = today.getMonth() + 1;
          let targetYear = today.getFullYear();
          
          if (customMonth > currentMonth) {
            targetYear -= 1;
          }
          
          startDate = new Date(targetYear, customMonth - 1, 1);
          endDate = new Date(targetYear, customMonth, 0);
        } else {
          // Fallback to recent
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = new Date(today);
        }
        break;
      
      default: // 'recent'
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date(today);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
}

// 소비내역 파서 클래스
class ExpenseParser {
  static categoryMap = {
    '식비': ['점심', '저녁', '아침', '밥', '식사', '먹', '음식', '치킨', '피자', '커피', '음료', '술', '맥주', '소주', '카페'],
    '교통비': ['버스', '지하철', '택시', '기차', '비행기', '주유', '기름', '교통카드', '전철'],
    '쇼핑': ['옷', '신발', '가방', '화장품', '액세서리', '샀', '구매', '쇼핑'],
    '의료비': ['병원', '약국', '의료', '치료', '진료', '약', '건강'],
    '생활용품': ['마트', '편의점', '생활용품', '세제', '화장지', '샴푸'],
    '문화생활': ['영화', '공연', '책', '게임', '여행', '놀이공원'],
    '통신비': ['핸드폰', '인터넷', '통신비', '요금'],
    '기타': []
  };

  static merchantMap = {
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

  static defaultMerchants = {
    '식비': '일반음식점',
    '교통비': '교통이용',
    '쇼핑': '일반상점',
    '의료비': '병의원',
    '생활용품': '마트/편의점',
    '문화생활': '문화시설',
    '통신비': '통신사',
    '기타': '일반가맹점'
  };

  static parseFromInput(input, skipDateConfirmation = false) {
    try {
      const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
      console.log('🔍 소비내역 파싱 시도:', text);

      const amount = this.extractAmount(text);
      if (amount === 0) {
        console.log('❌ 금액을 찾을 수 없음');
        return null;
      }

      if (!this.hasExpenseIndicators(text)) {
        console.log('❌ 소비 관련 키워드 없음');
        return null;
      }

      const category = this.inferCategory(text);
      const merchantName = this.inferMerchant(text) || this.defaultMerchants[category];
      const extractedDate = DateUtils.extractFromText(text);

      console.log(`✅ 파싱 완료: ${amount}원, ${category}, ${merchantName}`);

      return {
        amount,
        category,
        merchantName,
        originalText: input,
        transactionDate: extractedDate,
        needsDateConfirmation: !extractedDate && !skipDateConfirmation
      };

    } catch (error) {
      console.error('소비내역 파싱 오류:', error);
      return null;
    }
  }

  static extractAmount(text) {
    const patterns = [
      /(\d+)\s*원(?:[으로로]+)?/g,
      /(\d+)\s*천\s*원?(?:[으로로]+)?/g,
      /(\d+)\s*만\s*원?(?:[으로로]+)?/g,
      /(\d+)(?=.*(?:썼|먹|샀|지불|결제|냈))/g
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        
        if (match[0].includes('천')) {
          return parseInt(match[1]) * 1000;
        } else if (match[0].includes('만')) {
          return parseInt(match[1]) * 10000;
        } else {
          return parseInt(match[1].replace(/,/g, ''));
        }
      }
    }

    return 0;
  }

  static hasExpenseIndicators(text) {
    const expenseKeywords = [
      '썼', '먹', '샀', '구매', '지불', '결제', '냈', '마셨', '타고', '갔다',
      '사용', '쓰다', '지출', '소비', '소진', '결재', '밥', '식사'
    ];

    const isSimpleExpenseMessage = text.includes('원') && text.split(' ').length <= 3;
    const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
    
    return hasExpenseKeyword || isSimpleExpenseMessage;
  }

  static inferCategory(text) {
    for (const [category, keywords] of Object.entries(this.categoryMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    return '기타';
  }

  static inferMerchant(text) {
    for (const [merchant, keywords] of Object.entries(this.merchantMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return merchant;
      }
    }
    return null;
  }
}

// API 서비스 클래스
class ExpenseAPIService {
  static async saveExpense(expenseData) {
    try {
      console.log('💾 소비내역 저장 시도:', expenseData);

      const token = localStorage.getItem('ACCESS_TOKEN');
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const apiData = {
        merchantName: expenseData.merchantName,
        amount: expenseData.amount,
        category: expenseData.category,
        memo: `음성 입력: ${expenseData.originalText}`
      };

      if (expenseData.transactionDate) {
        apiData.transactionDate = expenseData.transactionDate;
      }

      const response = await call(CONFIG.API_ENDPOINTS.VOICE_CONSUMPTION, 'POST', apiData);
      console.log('✅ 소비내역 저장 성공:', response);
      return { success: true, data: response };

    } catch (error) {
      console.error('❌ 소비내역 저장 실패:', error);
      return { success: false, error: error.message };
    }
  }

  static async getExpenseHistory(period = 'recent', customMonth = null) {
    try {
      console.log('📊 소비내역 조회 시도:', period, customMonth);

      const token = localStorage.getItem('ACCESS_TOKEN');
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const dateRange = DateUtils.getDateRange(period, customMonth);
      console.log('📅 조회 기간:', dateRange);

      const response = await call(CONFIG.API_ENDPOINTS.CONSUMPTION, 'GET', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 50
      });

      console.log('✅ 소비내역 조회 성공:', response);
      return { success: true, data: response };

    } catch (error) {
      console.error('❌ 소비내역 조회 실패:', error);
      return { success: false, error: error.message };
    }
  }
}

// 음성 처리 클래스
class VoiceHandler {
  constructor() {
    this.recognition = null;
    this.isInitialized = false;
  }

  initialize(sendMessage, setIsListening) {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('음성 인식을 지원하지 않는 브라우저입니다.');
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = CONFIG.RECOGNITION_LANG;
      this.recognition.maxAlternatives = 5;

      this.recognition.addEventListener('speechstart', () => {
        console.log('🎙️ 음성 인식 시작');
        setIsListening(true);
      });

      this.recognition.addEventListener('speechend', () => {
        console.log('🔇 음성 인식 종료');
        setIsListening(false);
      });

      this.recognition.addEventListener('result', (event) => {
        const recognizedText = event.results[0][0].transcript;
        console.log('📝 인식된 텍스트:', recognizedText);
        sendMessage(recognizedText);
      });

      this.recognition.addEventListener('error', (event) => {
        console.error('❌ 음성 인식 오류:', event.error);
        setIsListening(false);
      });

      this.isInitialized = true;
      console.log('✅ 음성 인식 초기화 완료');
      return this.recognition;

    } catch (error) {
      console.error('❌ 음성 인식 초기화 실패:', error);
      return null;
    }
  }

  start() {
    if (!this.isInitialized || !this.recognition) {
      console.error('❌ 음성 인식이 초기화되지 않았습니다.');
      return false;
    }

    try {
      this.recognition.start();
      console.log('🎙️ 음성 인식 시작됨');
      return true;
    } catch (error) {
      console.error('❌ 음성 인식 시작 실패:', error);
      // 재시도
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (retryError) {
          console.error('❌ 음성 인식 재시도 실패:', retryError);
        }
      }, 1000);
      return false;
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('🛑 음성 인식 중단됨');
        return true;
      } catch (error) {
        console.error('❌ 음성 인식 중단 실패:', error);
        return false;
      }
    }
    return false;
  }

  static speak(text, onEnd = null) {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ 음성 합성을 지원하지 않는 브라우저입니다.');
      if (onEnd) onEnd();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = CONFIG.SPEECH_RATE;
      
      if (onEnd) {
        utterance.onend = onEnd;
      }

      speechSynthesis.speak(utterance);
      console.log('🔊 음성 출력 시작:', text);
    } catch (error) {
      console.error('❌ 음성 출력 실패:', error);
      if (onEnd) onEnd();
    }
  }
}

// 전역 인스턴스들
const conversationState = new ConversationState();
const voiceHandler = new VoiceHandler();

// 응답 생성기 클래스
class ResponseGenerator {
  static fallbackResponses = [
    "안녕하세요! 무엇을 도와드릴까요?",
    "도움이 필요하신가요?",
    "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요.",
    "네, 말씀해보세요.",
    "제가 어떻게 도와드릴까요?",
    "궁금한 점이 있으신가요?"
  ];

  static generateExpenseResponse(expenseData, saveResult, dateFormatted = null) {
    if (!expenseData) return null;

    const amount = expenseData.amount.toLocaleString();
    const category = expenseData.category;
    const merchant = expenseData.merchantName;
    const dateText = dateFormatted || '오늘';

    if (saveResult.success) {
      const responses = [
        `네! ${dateText} ${merchant}에서 ${amount}원 ${category} 지출을 가계부에 저장했어요! 💰`,
        `${dateText} ${category}로 ${amount}원 지출 기록 완료! 가계부에서 확인하실 수 있어요 📊`,
        `알겠어요! ${dateText} ${amount}원 지출 내역을 가계부에 추가했습니다 ✅`,
        `${dateText} ${merchant}에서 ${amount}원 쓰신 걸 저장해드렸어요! 📝`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else {
      return `${amount}원 지출을 인식했지만 저장에 실패했어요. 나중에 가계부에서 직접 입력해주세요. 😅`;
    }
  }

  static generateDateConfirmationMessage(expenseData) {
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

  static generateFallbackResponse(message) {
    if (!message) return this.fallbackResponses[0];

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
  }
}

// 메인 처리 함수들
export async function processAIResponse(message) {
  try {
    console.log("🔄 입력 메시지 처리:", message);

    // 1. 대화형 소비내역 입력 처리 (최우선)
    if (conversationState.isWaitingForDate()) {
      console.log('📅 날짜 확인 응답 처리');
      
      const dateFromInput = DateUtils.extractFromText(message);
      
      if (dateFromInput) {
        const finalExpenseData = conversationState.confirmExpense(dateFromInput);
        const saveResult = await ExpenseAPIService.saveExpense(finalExpenseData);
        return ResponseGenerator.generateExpenseResponse(
          finalExpenseData, 
          saveResult, 
          DateUtils.formatForDisplay(dateFromInput)
        );
      } else {
        return '날짜를 정확히 알려주세요. 예를 들어 "오늘", "어제", "3일 전", 또는 "5월 20일" 같이 말씀해주세요.';
      }
    }

    // 2. 일반 소비 내역 파싱
    const expenseData = ExpenseParser.parseFromInput(message);
    
    if (expenseData) {
      console.log('💰 소비내역 감지됨:', expenseData);
      
      if (expenseData.needsDateConfirmation) {
        // 날짜 확인 필요
        conversationState.setPendingExpense(expenseData);
        return ResponseGenerator.generateDateConfirmationMessage(expenseData);
      } else {
        // 바로 저장
        const saveResult = await ExpenseAPIService.saveExpense(expenseData);
        return ResponseGenerator.generateExpenseResponse(
          expenseData, 
          saveResult, 
          expenseData.transactionDate ? DateUtils.formatForDisplay(expenseData.transactionDate) : '오늘'
        );
      }
    }

    // 3. 기본 응답
    return ResponseGenerator.generateFallbackResponse(message);

  } catch (error) {
    console.error("❌ AI 처리 오류:", error);
    return ResponseGenerator.generateFallbackResponse(message);
  }
}

export function handleAutoSub(
  message,
  setChatResponse,
  setIsLoading,
  setIsSpeaking,
  setIsOpen,
  setServiceUrl,
  setWelfareNo,
  setWelfareBookStartDate,
  setWelfareBookUseTime
) {
  setIsLoading(true);
  setIsSpeaking(false);

  console.log("🔄 대화 처리:", message);
  
  processAIResponse(message)
    .then(response => {
      console.log("🤖 AI 응답:", response);
      setChatResponse(response);
      setIsLoading(false);
      setIsSpeaking(true);
      
      VoiceHandler.speak(response, () => {
        setIsSpeaking(false);
        setTimeout(() => {
          voiceHandler.start();
        }, 1000);
      });
    })
    .catch(error => {
      console.error("❌ AI 서비스 오류:", error);
      setChatResponse("죄송합니다. 대화를 처리하는 중 오류가 발생했습니다.");
      setIsLoading(false);
      setIsSpeaking(false);
      setTimeout(() => {
        voiceHandler.start();
      }, 1000);
    });
}

export function availabilityFunc(sendMessage, setIsListening) {
  const recognition = voiceHandler.initialize(sendMessage, setIsListening);
  console.log(recognition ? "✅ 음성 인식 초기화 성공" : "❌ 음성 인식 초기화 실패");
  return recognition;
}

export function startAutoRecord() {
  const started = voiceHandler.start();
  if (!started) {
    console.error("❌ 음성 인식 시작 실패");
  }
}

export function endRecord() {
  const stopped = voiceHandler.stop();
  if (!stopped) {
    console.error("❌ 음성 인식 중단 실패");
  }
}

export function handleChatRoom(userInfo) {
  console.log("💬 대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: CONFIG.DEFAULT_ROOM_NO });
}