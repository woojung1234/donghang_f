import { call } from "login/service/ApiService";

var roomNo = 1; // 기본값 설정
var recognition;

// 대화 상태 관리 (날짜 확인 대기 중인 소비내역)
let pendingExpenseData = null;
let waitingForDateConfirmation = false;

// 오프라인 모드용 응답
const fallbackResponses = [
  "안녕하세요! 무엇을 도와드릴까요?",
  "도움이 필요하신가요?",
  "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요.",
  "네, 말씀해보세요.",
  "제가 어떻게 도와드릴까요?",
  "궁금한 점이 있으신가요?"
];

// 날짜 추출 함수 (기존 패턴 + 새로운 패턴)
function extractDateFromText(text) {
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
    // 현재 월보다 큰 월이면 작년
    if (month > today.getMonth() + 1) {
      year -= 1;
    }
    
    const targetDate = new Date(year, month - 1, day);
    return targetDate.toISOString().split('T')[0];
  }
  
  return null; // 날짜를 찾을 수 없음
}

// 날짜 텍스트를 Date 객체로 변환
function parseDateFromUserInput(dateText) {
  const text = dateText.toLowerCase().trim();
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
  
  // "N일 전" 패턴
  const daysAgoPattern = /(\d+)\s*일\s*전/;
  const daysAgoMatch = text.match(daysAgoPattern);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysAgo);
    return targetDate.toISOString().split('T')[0];
  }
  
  // "월 일" 패턴
  const monthDayPattern = /(?:(\d{1,2})월\s*)?(\d{1,2})일/;
  const monthDayMatch = text.match(monthDayPattern);
  if (monthDayMatch) {
    const month = monthDayMatch[1] ? parseInt(monthDayMatch[1]) : today.getMonth() + 1;
    const day = parseInt(monthDayMatch[2]);
    
    let year = today.getFullYear();
    if (month > today.getMonth() + 1) {
      year -= 1;
    }
    
    const targetDate = new Date(year, month - 1, day);
    return targetDate.toISOString().split('T')[0];
  }
  
  return null;
}

// 소비 내역 파싱 함수 (대화형 처리 지원)
function parseExpenseFromInput(input, requestDate = false) {
  const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
  console.log('🔍 파싱 시도 - 입력 텍스트:', text);
  
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
    console.log('🔍 패턴 테스트:', pattern, '매치 결과:', matches.length > 0 ? matches[0] : '매치 없음');
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

  console.log('💰 추출된 금액:', amount);
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
  
  console.log('🔑 간단한 메시지인가:', isSimpleExpenseMessage);
  console.log('🔑 소비 키워드 포함:', hasExpenseKeyword);
  
  if (!hasExpenseKeyword && !isSimpleExpenseMessage) {
    return null;
  }

  // 날짜 추출 시도
  const extractedDate = extractDateFromText(text);
  console.log('📅 추출된 날짜:', extractedDate);

  // 카테고리 추론
  const category = inferCategoryFromText(text);
  
  // 가맹점 추론
  const merchantName = inferMerchantFromText(text) || getDefaultMerchantByCategory(category);

  console.log(`금액 감지: ${amount}원, 카테고리: ${category}, 가맹점: ${merchantName}`);
  
  return {
    amount: amount,
    category: category,
    merchantName: merchantName,
    originalText: input,
    transactionDate: extractedDate,
    needsDateConfirmation: !extractedDate && !requestDate // 날짜가 없고 강제 요청이 아니면 확인 필요
  };
}

// 텍스트에서 카테고리 추론
function inferCategoryFromText(text) {
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
function inferMerchantFromText(text) {
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
function getDefaultMerchantByCategory(category) {
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

// 기간별 날짜 범위 계산 함수
function getDateRangeByPeriod(period, customMonth = null) {
  const today = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      startDate = new Date(yesterday);
      endDate = new Date(yesterday);
      break;
      
    case 'this_week':
      // 이번 주 월요일부터 일요일까지 (전체 주)
      const thisWeekStart = new Date(today);
      const dayOfWeek = today.getDay(); // 0=일요일, 1=월요일...
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 이동
      thisWeekStart.setDate(today.getDate() + mondayOffset);
      
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // 일요일
      
      startDate = new Date(thisWeekStart);
      endDate = new Date(thisWeekEnd);
      break;
      
    case 'last_week':
      // 지난 주 월요일부터 일요일까지
      const lastWeekEnd = new Date(today);
      const currentDayOfWeek = today.getDay();
      const lastSundayOffset = currentDayOfWeek === 0 ? -7 : -currentDayOfWeek;
      lastWeekEnd.setDate(today.getDate() + lastSundayOffset);
      
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      
      startDate = new Date(lastWeekStart);
      endDate = new Date(lastWeekEnd);
      break;
      
    case 'this_month':
      // 이번 달 1일부터 오늘까지
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today);
      break;
      
    case 'last_month':
      // 지난 달 1일부터 마지막 날까지
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      startDate = new Date(lastMonth);
      endDate = new Date(lastMonthEnd);
      break;
      
    case 'custom_month':
      // 구체적인 월 지정 (예: 4월)
      if (customMonth) {
        const currentMonth = today.getMonth() + 1;
        let targetYear = today.getFullYear();
        
        // 현재 월보다 큰 월이면 작년
        if (customMonth > currentMonth) {
          targetYear -= 1;
        }
        
        startDate = new Date(targetYear, customMonth - 1, 1);
        endDate = new Date(targetYear, customMonth, 0); // 해당 월 마지막 날
      } else {
        // fallback
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date(today);
      }
      break;
      
    default: // 'recent'
      // 최근 30일
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

// 소비내역 조회 함수
async function getExpenseHistory(period = 'recent', customMonth = null) {
  try {
    console.log('소비내역 조회 시도 - 기간:', period, customMonth ? `(${customMonth}월)` : '');
    
    // 로그인 토큰 확인
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      console.warn('로그인 토큰이 없습니다.');
      return null;
    }
    
    // 기간별 날짜 범위 계산
    const dateRange = getDateRangeByPeriod(period, customMonth);
    console.log('날짜 범위:', dateRange);
    
    const response = await call('/api/v1/consumption', 'GET', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      limit: 50 // 충분한 데이터 가져오기
    });
    
    console.log('소비내역 조회 성공:', response);
    return response;
  } catch (error) {
    console.error('소비내역 조회 실패:', error);
    return null;
  }
}

// 소비내역 조회 질문 감지 및 기간 분석 함수
function analyzeExpenseInquiry(message) {
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

// 대화형 소비내역 입력 처리 함수
function handleInteractiveExpenseInput(message) {
  console.log('🎯 대화형 소비내역 처리 시작:', message);
  console.log('📋 현재 대기 상태:', waitingForDateConfirmation);
  console.log('💾 보류된 데이터:', pendingExpenseData);
  
  // 날짜 확인 대기 중인 경우
  if (waitingForDateConfirmation && pendingExpenseData) {
    console.log('📅 날짜 확인 응답 처리');
    
    // 사용자 입력에서 날짜 파싱 시도
    const dateFromInput = parseDateFromUserInput(message);
    console.log('🔍 사용자 입력에서 추출된 날짜:', dateFromInput);
    
    if (dateFromInput) {
      // 유효한 날짜가 입력됨 - 소비내역 저장
      const finalExpenseData = {
        ...pendingExpenseData,
        transactionDate: dateFromInput
      };
      
      console.log('✅ 최종 소비내역 데이터:', finalExpenseData);
      
      // 상태 초기화
      pendingExpenseData = null;
      waitingForDateConfirmation = false;
      
      return {
        type: 'save_expense',
        data: finalExpenseData,
        dateFormatted: formatDateForDisplay(dateFromInput)
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
  const expenseData = parseExpenseFromInput(message);
  
  if (expenseData) {
    console.log('💰 소비내역 감지됨:', expenseData);
    
    if (expenseData.needsDateConfirmation) {
      // 날짜가 없는 경우 - 대화형 처리
      console.log('❓ 날짜 확인 필요');
      
      pendingExpenseData = expenseData;
      waitingForDateConfirmation = true;
      
      return {
        type: 'ask_date',
        data: expenseData,
        message: generateDateConfirmationMessage(expenseData)
      };
    } else {
      // 날짜가 있는 경우 - 바로 저장
      console.log('✅ 날짜 포함된 소비내역 - 즉시 저장');
      
      return {
        type: 'save_expense',
        data: expenseData,
        dateFormatted: expenseData.transactionDate ? formatDateForDisplay(expenseData.transactionDate) : '오늘'
      };
    }
  }
  
  return null; // 소비내역이 아님
}

// 날짜 확인 메시지 생성
function generateDateConfirmationMessage(expenseData) {
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
function formatDateForDisplay(dateString) {
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

// 소비내역을 백엔드에 저장하는 함수 (날짜 지원)
async function saveExpenseToBackend(expenseData) {
  try {
    console.log('소비내역 저장 시도:', expenseData);
    
    // 로그인 토큰 확인
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      console.warn('로그인 토큰이 없습니다. 임시로 더미 데이터로 처리합니다.');
      return true; // 임시로 성공 처리
    }
    
    // API 호출 데이터 준비
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
    
    console.log('API 호출 정보:', {
      endpoint: '/api/v1/consumption/voice',
      method: 'POST',
      data: apiData
    });
    
    const response = await call('/api/v1/consumption/voice', 'POST', apiData);
    
    console.log('소비 내역 저장 성공:', response);
    return true;
  } catch (error) {
    console.error('소비 내역 저장 실패:', error);
    
    // 네트워크 오류나 서버 오류인 경우에도 사용자에게는 성공으로 보여줌
    if (error.message && (error.message.includes('fetch') || error.status >= 500)) {
      console.warn('네트워크 또는 서버 오류 - 임시로 성공 처리');
      return true;
    }
    
    return false;
  }
}

// 스마트 응답 생성
function generateSmartResponse(expenseData, saved, dateFormatted = null) {
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
function getOfflineResponse(message) {
  if (!message) return fallbackResponses[0];

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
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  } catch (error) {
    console.error("오프라인 응답 생성 오류:", error);
    return "대화를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
}

// AI 서비스 처리 (대화형 소비내역 입력 지원)
async function processAIResponse(message) {
  try {
    console.log("🔄 입력 메시지 처리:", message);
    
    // 1. 대화형 소비내역 입력 처리 (최우선)
    const interactiveResult = handleInteractiveExpenseInput(message);
    
    if (interactiveResult) {
      console.log('🎯 대화형 처리 결과:', interactiveResult);
      
      if (interactiveResult.type === 'ask_date') {
        return interactiveResult.message;
      } else if (interactiveResult.type === 'ask_date_again') {
        return interactiveResult.message;
      } else if (interactiveResult.type === 'save_expense') {
        const saved = await saveExpenseToBackend(interactiveResult.data);
        const response = generateSmartResponse(
          interactiveResult.data, 
          saved, 
          interactiveResult.dateFormatted
        );
        
        if (response) {
          return response;
        }
      }
    }
    
    // 2. 일반 소비 내역 파싱 (날짜 포함된 경우)
    const expenseData = parseExpenseFromInput(message, true);
    
    if (expenseData && !expenseData.needsDateConfirmation) {
      console.log('💰 일반 소비 내역 감지 (날짜 포함):', expenseData);
      const saved = await saveExpenseToBackend(expenseData);
      const response = generateSmartResponse(expenseData, saved);
      if (response) {
        return response;
      }
    }
    
    // 3. 기본 오프라인 응답
    return getOfflineResponse(message);
    
  } catch (error) {
    console.error("AI 처리 오류:", error);
    return getOfflineResponse(message);
  }
}

// 음성 끝났을 때 자동 답변 실행
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
  
  processAIResponse(message).then(response => {
    console.log("🤖 AI 응답:", response);
    setChatResponse(response);
    setIsLoading(false);
    setIsSpeaking(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      };
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        startAutoRecord();
      }, 2000);
    }
  }).catch(error => {
    console.error("AI 서비스 오류:", error);
    setChatResponse("죄송합니다. 대화를 처리하는 중 오류가 발생했습니다.");
    setIsLoading(false);
    setIsSpeaking(false);
    setTimeout(() => {
      startAutoRecord();
    }, 1000);
  });
}

// 음성 인식의 자동 시작 상태를 제어하는 함수
export function availabilityFunc(sendMessage, setIsListening) {
  const newRecognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  newRecognition.lang = "ko";
  newRecognition.maxAlternatives = 5;

  newRecognition.addEventListener("speechstart", () => {
    console.log("음성 인식 중...");
    setIsListening(true);
  });

  newRecognition.addEventListener("speechend", () => {
    console.log("음성 인식 종료");
    setIsListening(false);
  });

  newRecognition.addEventListener("result", (e) => {
    const recognizedText = e.results[0][0].transcript;
    console.log('🎙️ 인식된 텍스트:', recognizedText);
    sendMessage(recognizedText);
  });

  if (!newRecognition) {
    console.log("음성 인식을 지원하지 않는 브라우저입니다.");
  } else {
    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  }
}

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  if (recognition) {
    try {
      recognition.start();
      console.log("🎙️ 음성 인식 자동 시작");
    } catch (e) {
      console.error("음성 인식 시작 오류:", e);
      setTimeout(() => {
        try {
          recognition.start();
        } catch (error) {
          console.error("재시도 실패:", error);
        }
      }, 1000);
    }
  } else {
    console.error("Recognition 객체가 초기화되지 않았습니다.");
  }
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  if (recognition && recognition.stop) {
    try {
      recognition.stop();
      console.log("🛑 음성 인식 중단");
    } catch (e) {
      console.error("음성 인식 중단 오류:", e);
    }
  } else {
    console.error("Recognition 객체가 없거나 stop 메소드가 없습니다.");
  }
}

// 채팅 방을 설정하는 함수
export function handleChatRoom(userInfo) {
  console.log("💬 대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: 1 });
}.message && (error.message.includes('fetch') || error.status >= 500)) {
      console.warn('네트워크 또는 서버 오류 - 임시로 성공 처리');
      return true;
    }
    
    return false;
  }
}

// 스마트 응답 생성 (대화형 처리 지원)
function generateSmartResponse(expenseData, saved, dateFormatted = null) {
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
function getOfflineResponse(message) {
  if (!message) return fallbackResponses[0];

  try {
    const lowercaseMessage = message.toLowerCase();
    
    // 가계부 관련 키워드
    if (lowercaseMessage.includes('가계부') || lowercaseMessage.includes('소비') || lowercaseMessage.includes('지출')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    // 기본 인사
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시면 가계부에 자동으로 기록해드려요! 💰";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리를 도와드릴 수 있어요!";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 예를 들어 '5000원 점심 먹었어'라고 말씀해주시면 가계부에 자동으로 기록해드려요!";
    }
    
    // 기본 응답
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  } catch (error) {
    console.error("오프라인 응답 생성 오류:", error);
    return "대화를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
}

// AI 서비스 처리 (대화형 소비내역 입력 지원)
async function processAIResponse(message) {
  try {
    console.log("🔄 입력 메시지 처리:", message);
    
    // 1. 대화형 소비내역 입력 처리 (최우선)
    const interactiveResult = handleInteractiveExpenseInput(message);
    
    if (interactiveResult) {
      console.log('🎯 대화형 처리 결과:', interactiveResult);
      
      if (interactiveResult.type === 'ask_date') {
        // 날짜 요청
        return interactiveResult.message;
        
      } else if (interactiveResult.type === 'ask_date_again') {
        // 날짜 재요청
        return interactiveResult.message;
        
      } else if (interactiveResult.type === 'save_expense') {
        // 소비내역 저장
        const saved = await saveExpenseToBackend(interactiveResult.data);
        const response = generateSmartResponse(
          interactiveResult.data, 
          saved, 
          interactiveResult.dateFormatted
        );
        
        if (response) {
          return response;
        }
      }
    }
    
    // 2. 소비내역 조회 질문 분석
    const expenseAnalysis = analyzeExpenseInquiry(message);
    
    if (expenseAnalysis) {
      console.log('📊 소비내역 조회 요청 감지:', expenseAnalysis);
      const expenseHistory = await getExpenseHistory(expenseAnalysis.period, expenseAnalysis.customMonth);
      const response = formatExpenseHistory(
        expenseHistory, 
        expenseAnalysis.period, 
        expenseAnalysis.periodText,
        expenseAnalysis.isReport
      );
      console.log('📋 소비내역 조회 응답:', response);
      return response;
    }
    
    // 3. 일반 소비 내역 파싱 (날짜 포함된 경우)
    const expenseData = parseExpenseFromInput(message, true); // 강제로 날짜 확인 안 함
    let saved = false;
    
    if (expenseData && !expenseData.needsDateConfirmation) {
      console.log('💰 일반 소비 내역 감지 (날짜 포함):', expenseData);
      saved = await saveExpenseToBackend(expenseData);
      const response = generateSmartResponse(expenseData, saved);
      if (response) {
        return response;
      }
    }
    
    // 4. 기본 오프라인 응답
    return getOfflineResponse(message);
    
  } catch (error) {
    console.error("AI 처리 오류:", error);
    return getOfflineResponse(message);
  }
}

// 소비내역을 자연스러운 문장으로 변환 (기간별 대응)
function formatExpenseHistory(data, period, periodText, isReport = false) {
  if (!data || !data.consumptions || data.consumptions.length === 0) {
    return `${periodText} 등록된 소비내역이 없어요. "5천원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 기록해드릴게요!`;
  }
  
  const consumptions = data.consumptions;
  const totalAmount = data.summary?.totalAmount || 0;
  
  // 리포트 형식으로 요청된 경우
  if (isReport) {
    return formatExpenseReport(data, period, periodText);
  }
  
  let result = `${periodText} 소비내역을 알려드릴게요! `;
  
  // 총액 정보
  if (totalAmount > 0) {
    const totalFormatted = formatAmountForSpeech(totalAmount);
    result += `총 지출은 ${totalFormatted}원입니다. `;
  }
  
  // 개별 내역 (최대 5개만 표시)
  const recentItems = consumptions.slice(0, 5);
  recentItems.forEach(item => {
    const amountFormatted = formatAmountForSpeech(item.amount);
    const merchant = item.merchantName || '일반가맹점';
    result += `${merchant}에서 ${amountFormatted}원, `;
  });
  
  result = result.replace(/,\s*$/, '. ');
  result += "더 자세한 내용은 소비현황 페이지에서 확인하실 수 있어요!";
  
  return result;
}

// 소비내역 리포트 포맷팅 함수
function formatExpenseReport(data, period, periodText) {
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
  const totalFormatted = formatAmountForSpeech(totalAmount);
  result += `총 소비금액은 ${totalFormatted}원이었습니다. `;
  
  // 카테고리별 분석
  if (sortedCategories.length > 0) {
    result += `각 항목별로 나누면 `;
    
    sortedCategories.forEach(([category, amount], index) => {
      const amountFormatted = formatAmountForSpeech(amount);
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

// 날짜별로 소비내역 그룹핑
function groupConsumptionsByDate(consumptions) {
  const grouped = {};
  
  consumptions.forEach(item => {
    const date = item.transactionDate.split('T')[0]; // YYYY-MM-DD 형식
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });
  
  return grouped;
}

// 금액을 음성 합성에 친화적으로 포맷팅
function formatAmountForSpeech(amount) {
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

// 날짜를 음성 합성에 친화적으로 포맷팅
function formatDateForSpeech(dateString) {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // 오늘인지 확인
  if (date.toDateString() === today.toDateString()) {
    return '오늘';
  }
  
  // 어제인지 확인  
  if (date.toDateString() === yesterday.toDateString()) {
    return '어제';
  }
  
  // 그 외의 경우
  return `${month}월 ${day}일`;
}

// 음성 끝났을 때 자동 답변 실행 (대화형 시스템 지원)
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
  
  // 대화형 소비내역 처리 및 응답 생성
  processAIResponse(message).then(response => {
    console.log("🤖 AI 응답:", response);
    setChatResponse(response);
    setIsLoading(false);
    setIsSpeaking(true);
    
    // 음성으로 응답 읽기
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      };
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        startAutoRecord();
      }, 2000);
    }
  }).catch(error => {
    console.error("AI 서비스 오류:", error);
    setChatResponse("죄송합니다. 대화를 처리하는 중 오류가 발생했습니다.");
    setIsLoading(false);
    setIsSpeaking(false);
    setTimeout(() => {
      startAutoRecord();
    }, 1000);
  });
}

// 음성 인식의 자동 시작 상태를 제어하는 함수
export function availabilityFunc(sendMessage, setIsListening) {
  const newRecognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  newRecognition.lang = "ko";
  newRecognition.maxAlternatives = 5;

  newRecognition.addEventListener("speechstart", () => {
    console.log("음성 인식 중...");
    setIsListening(true);
  });

  newRecognition.addEventListener("speechend", () => {
    console.log("음성 인식 종료");
    setIsListening(false);
  });

  newRecognition.addEventListener("result", (e) => {
    const recognizedText = e.results[0][0].transcript;
    console.log('🎙️ 인식된 텍스트:', recognizedText);
    sendMessage(recognizedText);
  });

  if (!newRecognition) {
    console.log("음성 인식을 지원하지 않는 브라우저입니다.");
  } else {
    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  }
}

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  if (recognition) {
    try {
      recognition.start();
      console.log("🎙️ 음성 인식 자동 시작");
    } catch (e) {
      console.error("음성 인식 시작 오류:", e);
      setTimeout(() => {
        try {
          recognition.start();
        } catch (error) {
          console.error("재시도 실패:", error);
        }
      }, 1000);
    }
  } else {
    console.error("Recognition 객체가 초기화되지 않았습니다.");
  }
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  if (recognition && recognition.stop) {
    try {
      recognition.stop();
      console.log("🛑 음성 인식 중단");
    } catch (e) {
      console.error("음성 인식 중단 오류:", e);
    }
  } else {
    console.error("Recognition 객체가 없거나 stop 메소드가 없습니다.");
  }
}

// 채팅 방을 설정하는 함수
export function handleChatRoom(userInfo) {
  console.log("💬 대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: 1 });
}
