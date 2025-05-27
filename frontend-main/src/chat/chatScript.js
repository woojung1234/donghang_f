import { call } from "login/service/ApiService";

var roomNo = 1; // 기본값 설정
var recognition;

// 오프라인 모드용 응답 (백엔드에서 처리되지 못한 경우 fallback)
const fallbackResponses = [
  "죄송합니다. 서버와 연결할 수 없어 응답을 처리하지 못했습니다.",
  "네트워크 문제로 요청을 처리하지 못했습니다. 다시 시도해주세요.",
  "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
];

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  if (recognition) {
    try {
      // 이미 실행 중인지 확인
      if (recognition.abort) {
        recognition.abort(); // 기존 인식 중지
      }
      
      setTimeout(() => {
        try {
          recognition.start();
          console.log("🎙️ 음성 인식 자동 시작");
        } catch (error) {
          console.error("음성 인식 시작 오류:", error);
        }
      }, 100); // 짧은 지연 추가
      
    } catch (e) {
      console.error("음성 인식 시작 오류:", e);
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

// AI 서비스 처리 (백엔드 API 호출)
async function processAIResponse(message, sessionId = 'default') {
  try {
    console.log("🔄 백엔드 AI 서비스 호출:", message);
    
    // 로그인 토큰 확인
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      console.warn('로그인 토큰이 없습니다.');
      return {
        type: 'error',
        content: '로그인이 필요합니다. 다시 로그인해주세요.',
        needsVoice: true
      };
    }
    
    // 백엔드 AI 채팅 API 호출
    const response = await call('/api/v1/ai-chat/message', 'POST', {
      message: message,
      sessionId: sessionId
    });
    
    console.log("🤖 백엔드 AI 응답:", response);
    
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error("AI 서비스 오류:", error);
    
    // 네트워크 오류인 경우 fallback 응답
    return {
      type: 'error',
      content: getOfflineResponse(),
      needsVoice: true
    };
  }
}

// 오프라인 fallback 응답 생성
function getOfflineResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// 음성 끝났을 때 자동 답변 실행 (단순화된 버전)
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
  
  // 백엔드 AI 서비스 호출
  processAIResponse(message).then(result => {
    console.log("🤖 AI 응답 결과:", result);
    
    const response = result.content || result.message || "응답을 처리하지 못했습니다.";
    
    setChatResponse(response);
    setIsLoading(false);
    setIsSpeaking(true);
    
    // 음성으로 응답 읽기
    if ('speechSynthesis' in window && result.needsVoice) {
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

// 채팅 방을 설정하는 함수 (단순화)
export function handleChatRoom(userInfo) {
  console.log("💬 대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: 1 });
}

// 채팅 세션 리셋 함수 (새로 추가)
export async function resetChatSession(sessionId = 'default') {
  try {
    const response = await call('/api/v1/ai-chat/reset-session', 'POST', {
      sessionId: sessionId
    });
    
    console.log("🔄 채팅 세션 리셋 완료:", response);
    return true;
  } catch (error) {
    console.error("채팅 세션 리셋 오류:", error);
    return false;
  }
}

// 채팅 세션 상태 조회 함수 (새로 추가)
export async function getChatSessionStatus(sessionId = 'default') {
  try {
    const response = await call(`/api/v1/ai-chat/session/${sessionId}`, 'GET');
    
    console.log("📊 채팅 세션 상태:", response);
    return response.data;
  } catch (error) {
    console.error("채팅 세션 상태 조회 오류:", error);
    return null;
  }
}