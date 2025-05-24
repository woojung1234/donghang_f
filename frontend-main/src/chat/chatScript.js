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

// 오프라인 응답 생성 함수
function getOfflineResponse(message) {
  if (!message) return fallbackResponses[0]; // 메시지가 없을 경우 기본 응답 제공

  try {
    const lowercaseMessage = message.toLowerCase();
    
    // 키워드 확인
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요?";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 똑똑이라고 합니다. 무엇을 도와드릴까요?";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 더 자세히 말씀해주세요.";
    }
    
    // 추가 패턴 매칭
    if (lowercaseMessage.includes("어디") || lowercaseMessage.includes("위치")) {
      return "현재 위치는 지도에서 확인할 수 있어요. 더 자세한 안내가 필요하신가요?";
    } else if (lowercaseMessage.includes("시간") || lowercaseMessage.includes("몇시")) {
      return "현재 시간은 " + new Date().toLocaleTimeString() + "입니다. 도움이 필요하신가요?";
    }
    
    // 기본 응답
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  } catch (error) {
    console.error("오프라인 응답 생성 오류:", error);
    return "대화를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
}

// AI 서비스에 API 요청하는 함수
async function callAIService(message) {
  try {
    // 환경 변수에서 AI 서비스 URL 가져오기
    const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
    // 직접 라우트 사용 (백업용)
    const url = `${AI_SERVICE_URL}/api/v1/chatbot/chatting-direct?contents=${encodeURIComponent(message)}`;
    
    console.log("AI 서비스 요청 URL:", url);
    
    // API 요청
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      // 타임아웃 설정 (10초로 늘림)
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`AI 서비스 응답 상태: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`AI 서비스 응답 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("AI 서비스 호출 오류:", error);
    // 오류 발생 시 오프라인 응답 사용
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
  setIsLoading(false);
  setIsSpeaking(true);

  console.log("대화 처리:", message);
  
  // 직접 AI 서비스 호출 (백엔드 우회)
  callAIService(message).then(response => {
    console.log("AI 응답:", response);
    setChatResponse(response);
    setIsLoading(false);
    setIsSpeaking(false);
    setTimeout(() => {
      startAutoRecord();
    }, 1000);
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

// 오류 발생 시 대체 응답 생성
function handleFallbackResponse(
  setChatResponse, 
  setIsLoading, 
  setIsSpeaking,
  startAutoRecord
) {
  // 랜덤 응답 선택
  const randomResponse = fallbackResponses[
    Math.floor(Math.random() * fallbackResponses.length)
  ];
  
  setChatResponse(randomResponse);
  setIsLoading(false);
  setIsSpeaking(false);
  
  // 1초 후 음성 인식 재시작
  setTimeout(() => {
    startAutoRecord();
  }, 1000);
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
    console.log(recognizedText);
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
      // 오류 발생 시 1초 후 다시 시도
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
  // 백엔드 서버를 우회하고 항상 성공으로 처리
  return Promise.resolve({ conversationRoomNo: 1 });
}