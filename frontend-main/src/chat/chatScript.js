import { call } from "login/service/ApiService";

// 기본 대화방 번호 (API 호출이 실패할 경우 대비)
var roomNo = 1;
var recognition = null;
var isRecognitionActive = false;

// 각 키워드별 다양한 응답 목록 (오프라인 모드용)
const responseVariations = {
  "안녕": [
    "안녕하세요! 무엇을 도와드릴까요?",
    "반갑습니다! 오늘은 어떻게 도와드릴까요?",
    "안녕하세요! 오늘 기분은 어떠신가요?",
    "반가워요! 무엇이 필요하신가요?"
  ],
  "이름": [
    "저는 똑똑이라고 합니다. 무엇을 도와드릴까요?",
    "제 이름은 똑똑이에요. 당신을 도울 준비가 되어있어요.",
    "똑똑이라고 해요. 반갑습니다!",
    "똑똑이입니다. 어떻게 도와드릴까요?"
  ],
  // 기타 키워드 응답 생략...
};

// 기본 응답 변형
const defaultResponses = [
  "네, 말씀해주세요. 무엇을 도와드릴까요?",
  "어떻게 도와드릴까요?",
  "더 자세히 말씀해주시면 도움을 드릴 수 있어요.",
  "궁금한 점이 있으시면 언제든지 물어보세요."
];

// AI 서비스에 API 요청하는 함수
async function callAIService(message) {
  try {
    // 환경 변수에서 AI 서비스 URL 가져오기
    const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
    const url = `${AI_SERVICE_URL}/api/v1/chatbot/chatting?contents=${encodeURIComponent(message)}`;
    
    console.log("AI 서비스 요청 URL:", url);
    
    // API 요청
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 타임아웃 설정 (5초)
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`AI 서비스 응답 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("AI 서비스 호출 오류:", error);
    // 오류 발생 시 오프라인 응답 사용
    return getOfflineResponse(message);
  }
}

// 오프라인 응답 생성 함수
function getOfflineResponse(message) {
  const lowercaseMessage = message.toLowerCase();
  
  // 키워드 확인
  for (const keyword of Object.keys(responseVariations)) {
    if (lowercaseMessage.includes(keyword)) {
      const responses = responseVariations[keyword];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // 추가 패턴 매칭
  if (lowercaseMessage.includes("어디") || lowercaseMessage.includes("위치")) {
    return "현재 위치는 지도에서 확인할 수 있어요. 더 자세한 안내가 필요하신가요?";
  } else if (lowercaseMessage.includes("시간") || lowercaseMessage.includes("몇시")) {
    return "현재 시간은 " + new Date().toLocaleTimeString() + "입니다. 도움이 필요하신가요?";
  }
  
  // 기본 응답
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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
  // 먼저 로딩 상태 설정
  setIsLoading(true);
  setIsSpeaking(false);

  // 음성 인식 중지 (응답 처리 중에는 인식 중지)
  if (recognition) {
    try {
      isRecognitionActive = false;
      recognition.stop();
      console.log("응답 처리 중 음성 인식 중지");
    } catch (e) {
      console.error("음성 인식 중지 오류:", e);
    }
  }

  // 응답 처리 함수
  const processResponse = async () => {
    try {
      // 로딩 상태 유지
      setIsLoading(true);
      
      // AI 서비스 호출 시도
      let content;
      
      try {
        // 서버 응답 대기
        content = await callAIService(message);
      } catch (error) {
        console.warn("AI 서비스 호출 실패, 오프라인 응답 사용:", error);
        // 오류 발생 시 오프라인 응답 사용
        content = getOfflineResponse(message);
      }
      
      // 로딩 종료, 말하기 시작
      setIsLoading(false);
      setIsSpeaking(true);
      
      // 1초 후 응답 표시 (말하기 애니메이션을 위한 지연)
      setTimeout(() => {
        // 응답 설정
        setChatResponse(content);
        
        // 말하기 상태 해제
        setIsSpeaking(false);
        
        // 모달 상태 설정 (현재는 필요없지만 나중에 확장 가능)
        setIsOpen(false);
        
        // 음성 인식 재시작 (약간의 지연 후)
        setTimeout(() => {
          startAutoRecord();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error("응답 처리 중 오류 발생:", error);
      setChatResponse("죄송합니다. 응답을 처리하는 동안 오류가 발생했습니다.");
      setIsSpeaking(false);
      setIsLoading(false);
      
      // 음성 인식 재시작 (약간의 지연 후)
      setTimeout(() => {
        startAutoRecord();
      }, 500);
    }
  };

  // 응답 처리 시작
  processResponse();
}

// 음성 인식의 자동 시작 상태를 제어하는 함수
export function availabilityFunc(sendMessage, setIsListening) {
  try {
    // 이미 인스턴스가 있다면 중지 및 정리
    if (recognition) {
      try {
        recognition.stop();
        recognition = null;
        isRecognitionActive = false;
        console.log("기존 음성 인식 인스턴스 정리");
      } catch (e) {
        console.error("기존 인스턴스 정리 오류:", e);
      }
    }
    
    // SpeechRecognition API 지원 여부 확인
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
      console.error("SpeechRecognition API를 지원하지 않는 브라우저입니다.");
      return null;
    }
    
    // SpeechRecognition 객체 생성
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const newRecognition = new SpeechRecognition();
    
    newRecognition.lang = "ko";
    newRecognition.maxAlternatives = 5;
    newRecognition.continuous = false;
    newRecognition.interimResults = false;

    // 오류 이벤트 핸들러 추가
    newRecognition.addEventListener("error", (event) => {
      console.error("음성 인식 오류:", event.error);
      setIsListening(false);
      isRecognitionActive = false;
      
      // 특정 오류에 따른 처리
      if (event.error === "not-allowed") {
        alert("마이크 권한이 필요합니다. 설정에서 마이크 권한을 허용해주세요.");
      } else if (event.error === "no-speech") {
        console.log("음성이 감지되지 않았습니다.");
      } else {
        console.log(`음성 인식 오류: ${event.error}`);
      }
      
      // 오류 발생 후 1초 뒤에 다시 시작 시도 (이미 실행 중이 아닐 경우에만)
      setTimeout(() => {
        try {
          if (newRecognition && !isRecognitionActive) {
            newRecognition.start();
            isRecognitionActive = true;
            console.log("오류 후 음성 인식 재시작");
          }
        } catch (e) {
          console.error("재시작 오류:", e);
          isRecognitionActive = false;
        }
      }, 1000);
    });

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
      console.log("인식된 텍스트:", recognizedText);
      isRecognitionActive = false;
      sendMessage(recognizedText);
    });

    // 인식 종료 시 자동 재시작 (이미 실행 중이 아닐 경우에만)
    newRecognition.addEventListener("end", () => {
      console.log("음성 인식 세션 종료");
      // 플래그로 상태 확인 후 재시작
      setTimeout(() => {
        try {
          if (newRecognition && !isRecognitionActive) {
            newRecognition.start();
            isRecognitionActive = true;
            console.log("음성 인식 자동 재시작");
          }
        } catch (e) {
          console.error("자동 재시작 오류:", e);
          isRecognitionActive = false;
        }
      }, 500);
    });

    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  } catch (error) {
    console.error("음성 인식 초기화 오류:", error);
    isRecognitionActive = false;
    return null;
  }
}

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  try {
    // 이미 실행 중이면 중복 시작 방지
    if (recognition && !isRecognitionActive) {
      recognition.start();
      isRecognitionActive = true;
      console.log("음성 인식 자동 시작");
    } else if (isRecognitionActive) {
      console.log("음성 인식이 이미 실행 중입니다.");
    } else {
      console.error("음성 인식 객체가 초기화되지 않았습니다.");
    }
  } catch (error) {
    console.error("음성 인식 시작 오류:", error);
    isRecognitionActive = false;
    
    // 시작 오류 시 1초 후 다시 시도
    setTimeout(() => {
      try {
        if (recognition && !isRecognitionActive) {
          recognition.start();
          isRecognitionActive = true;
          console.log("오류 후 음성 인식 시작 재시도");
        }
      } catch (e) {
        console.error("재시도 오류:", e);
        isRecognitionActive = false;
      }
    }, 1000);
  }
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  try {
    if (recognition && recognition.stop) {
      recognition.stop();
      isRecognitionActive = false;
      console.log("음성 인식 중단");
    } else {
      console.error("음성 인식 객체가 없거나 stop 메서드가 없습니다.");
    }
  } catch (error) {
    console.error("음성 인식 중단 오류:", error);
    isRecognitionActive = false;
  }
}

// 채팅 방을 설정하는 함수 (백엔드 연결 없이 성공하도록 수정)
export function handleChatRoom(userInfo) {
  // 백엔드 연결 문제로 인해 항상 성공하는 Promise 반환
  return Promise.resolve({ conversationRoomNo: roomNo });
}