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
    // 환경 변수에서 AI 서비스 URL 가져오기 (8000 포트로 수정)
    const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
    const url = `${AI_SERVICE_URL}/api/v1/chatbot/chatting?contents=${encodeURIComponent(message)}`;
    
    console.log("AI 서비스 요청 URL:", url);
    
    // API 요청
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin // 현재 오리진 정보 추가
      },
      mode: 'cors', // CORS 모드 추가
      credentials: 'include', // 쿠키를 포함한 요청 활성화
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

  // API 호출 시도
  call("/api/v1/conversation", "POST", {
    input: message,
    conversationRoomNo: roomNo,
  })
    .then((response) => {
      const audioData = response.audioData;
      const content = response.content;
      const actionRequired = response.actionRequired;
      const redirectionResult = response.redirectionResult;

      const reservationResult = response.reservationResult || {};

      const welfareNo = reservationResult.welfareNo || ""; // welfareNo가 없으면 빈 문자열
      const welfareBookStartDate = reservationResult.welfareBookStartDate || ""; // 기본값 설정
      const welfareBookUseTime = reservationResult.welfareBookUseTime || "";
      setChatResponse(content);
      setWelfareNo(welfareNo);
      setWelfareBookStartDate(welfareBookStartDate);
      setWelfareBookUseTime(welfareBookUseTime);

      // 오디오 처리
      if (audioData) {
        try {
          const byteCharacters = atob(audioData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const audioBlob = new Blob([byteArray], { type: "audio/wav" });

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
          setIsLoading(true);
          setIsSpeaking(false);
          audio.onended = () => {
            setIsLoading(false);
            startAutoRecord();

            if (actionRequired === true && redirectionResult) {
              setServiceUrl(redirectionResult.serviceUrl);
              setIsOpen(true);
            } else if (actionRequired === true && reservationResult) {
              setServiceUrl("/welfare-input/check-spec");
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          };
        } catch (e) {
          console.error("오디오 처리 오류:", e);
          handleFallbackResponse(
            setChatResponse, 
            setIsLoading, 
            setIsSpeaking, 
            startAutoRecord
          );
        }
      } else {
        // 오디오 데이터가 없을 경우 텍스트만 표시
        setIsLoading(false);
        setIsSpeaking(false);
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      }
    })
    .catch((error) => {
      console.error("API 호출 오류:", error);
      // AI 서비스를 대체 응답 소스로 사용
      callAIService(message).then(response => {
        setChatResponse(response);
        setIsLoading(false);
        setIsSpeaking(false);
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      });
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
  // 기본값 설정으로 항상 성공하도록 수정
  try {
    return call("/api/v1/conversation-room", "POST", userInfo)
      .then((response) => {
        roomNo = response.conversationRoomNo;
        return response;
      })
      .catch((error) => {
        console.error("대화방 생성 오류:", error);
        // 오류 발생해도 기본값 사용하여 계속 진행
        return { conversationRoomNo: 1 };
      });
  } catch (e) {
    console.error("handleChatRoom 호출 오류:", e);
    // 어떤 오류가 발생해도 Promise를 반환하여 앱이 계속 작동하도록 함
    return Promise.resolve({ conversationRoomNo: 1 });
  }
}