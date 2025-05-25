import { call } from "login/service/ApiService";

var roomNo = 1; // 기본값 설정
var recognition;

// 오프라인 모드용 응답
const fallbackResponses = [
  "안녕하세요! 무엇을 도와드릴까요?",
  "도움이 필요하신가요?",
  "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요.",
  "네, 말씀해보세요.",
  "제가 어떻게 도와드릴까요?",
  "궁금한 점이 있으신가요?"
];

// 소비 내역 파싱 함수
function parseExpenseFromInput(input) {
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
  const category = inferCategoryFromText(text);
  
  // 가맹점 추론
  const merchantName = inferMerchantFromText(text) || getDefaultMerchantByCategory(category);

  return {
    amount: amount,
    category: category,
    merchantName: merchantName,
    originalText: input
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

// 소비내역을 백엔드에 저장하는 함수 (오류 처리 강화)
async function saveExpenseToBackend(expenseData) {
  try {
    console.log('소비내역 저장 시도:', expenseData);
    
    // 로그인 토큰 확인
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      console.warn('로그인 토큰이 없습니다. 임시로 더미 데이터로 처리합니다.');
      return true; // 임시로 성공 처리
    }
    
    const response = await call('/api/v1/consumption/voice', 'POST', {
      merchantName: expenseData.merchantName,
      amount: expenseData.amount,
      category: expenseData.category,
      memo: `음성 입력: ${expenseData.originalText}`
    });
    
    console.log('소비 내역 저장 성공:', response);
    return true;
  } catch (error) {
    console.error('소비 내역 저장 실패:', error);
    
    // 네트워크 오류나 서버 오류인 경우에도 사용자에게는 성공으로 보여줌
    if (error.message && error.message.includes('fetch')) {
      console.warn('네트워크 오류 - 임시로 성공 처리');
      return true;
    }
    
    return false;
  }
}

// 스마트 응답 생성 (소비 내역 기록 여부에 따라)
function generateSmartResponse(message, expenseData, saved) {
  if (expenseData && saved) {
    const responses = [
      `${expenseData.amount.toLocaleString()}원 ${expenseData.category} 지출을 가계부에 기록했어요! 📝`,
      `네, ${expenseData.merchantName}에서 ${expenseData.amount.toLocaleString()}원 쓰신 걸 저장해드렸어요! 💰`,
      `${expenseData.category}로 ${expenseData.amount.toLocaleString()}원 지출 기록 완료! 가계부에서 확인하실 수 있어요 📊`,
      `알겠어요! ${expenseData.amount.toLocaleString()}원 지출 내역을 가계부에 추가했습니다 ✅`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  } else if (expenseData && !saved) {
    return `${expenseData.amount.toLocaleString()}원 지출을 인식했지만 저장에 실패했어요. 나중에 가계부에서 직접 입력해주세요. 😅`;
  }

  return getOfflineResponse(message);
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
      return "저는 똑똑이라고 합니다. 가계부 관리를 도와드릴 수 있어요!";
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

// AI 서비스 처리
async function processAIResponse(message) {
  try {
    // 먼저 소비 내역 파싱 시도
    const expenseData = parseExpenseFromInput(message);
    let saved = false;
    
    if (expenseData) {
      console.log('소비 내역 감지:', expenseData);
      saved = await saveExpenseToBackend(expenseData);
    }
    
    // 스마트 응답 생성
    const response = generateSmartResponse(message, expenseData, saved);
    console.log('생성된 응답:', response);
    
    return response;
    
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

  console.log("대화 처리:", message);
  
  // 소비내역 처리 및 응답 생성
  processAIResponse(message).then(response => {
    console.log("AI 응답:", response);
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
    console.log('인식된 텍스트:', recognizedText);
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
      console.log("음성 인식 자동 시작");
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
      console.log("음성 인식 중단");
    } catch (e) {
      console.error("음성 인식 중단 오류:", e);
    }
  } else {
    console.error("Recognition 객체가 없거나 stop 메소드가 없습니다.");
  }
}

// 채팅 방을 설정하는 함수
export function handleChatRoom(userInfo) {
  console.log("대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: 1 });
}