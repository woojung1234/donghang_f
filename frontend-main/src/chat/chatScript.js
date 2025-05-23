import { call } from "login/service/ApiService";

// 기본 대화방 번호 (API 호출이 실패할 경우 대비)
var roomNo = 1;
var recognition;

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

  // 백엔드 API 호출 시도
  call("/api/v1/conversations", "POST", {
    input: message,
    conversationRoomNo: roomNo,
  })
    .then((response) => {
      // 응답 처리
      processResponse(
        response, 
        setChatResponse, 
        setIsLoading, 
        setIsSpeaking, 
        setIsOpen, 
        setServiceUrl, 
        setWelfareNo, 
        setWelfareBookStartDate, 
        setWelfareBookUseTime
      );
    })
    .catch((error) => {
      console.error("API 호출 오류:", error);
      // 오류 발생 시 더미 응답 사용
      const dummyResponse = generateDummyResponse(message);
      processResponse(
        dummyResponse, 
        setChatResponse, 
        setIsLoading, 
        setIsSpeaking, 
        setIsOpen, 
        setServiceUrl, 
        setWelfareNo, 
        setWelfareBookStartDate, 
        setWelfareBookUseTime
      );
    });
}

// 응답 처리 함수
function processResponse(
  response,
  setChatResponse,
  setIsLoading,
  setIsSpeaking,
  setIsOpen,
  setServiceUrl,
  setWelfareNo,
  setWelfareBookStartDate,
  setWelfareBookUseTime
) {
  // 응답이 없거나 필요한 필드가 없는 경우 더미 응답 사용
  if (!response || !response.message) {
    console.log("응답이 없거나 올바르지 않아 더미 응답을 사용합니다.");
    response = generateDummyResponse("기본 질문");
  }

  // 응답에서 필요한 데이터 추출
  const audioData = response.audioData || "";
  const content = response.message || response.content || "응답을 받지 못했습니다.";
  const actionRequired = response.actionRequired || false;
  const redirectionResult = response.redirectionResult || null;
  const reservationResult = response.reservationResult || {};

  // 사용자 정보 설정
  const welfareNo = reservationResult.welfareNo || ""; 
  const welfareBookStartDate = reservationResult.welfareBookStartDate || "";
  const welfareBookUseTime = reservationResult.welfareBookUseTime || "";
  
  setChatResponse(content);
  setWelfareNo(welfareNo);
  setWelfareBookStartDate(welfareBookStartDate);
  setWelfareBookUseTime(welfareBookUseTime);

  // 오디오 데이터가 있으면 재생
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
    } catch (error) {
      console.error("오디오 처리 오류:", error);
      handleRecordingEnd(setIsLoading, setIsSpeaking);
    }
  } else {
    // 오디오 데이터가 없으면 즉시 음성 인식 다시 시작
    handleRecordingEnd(setIsLoading, setIsSpeaking);
  }
}

// 녹음 종료 처리
function handleRecordingEnd(setIsLoading, setIsSpeaking) {
  setIsLoading(false);
  setIsSpeaking(false);
  startAutoRecord();
}

// 더미 응답 생성 (백엔드 API가 작동하지 않을 경우)
function generateDummyResponse(input) {
  // 간단한 규칙 기반 응답 생성
  let response = "안녕하세요! 제가 도와드릴게요.";
  
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("안녕") || lowerInput.includes("hello")) {
    response = "안녕하세요! 무엇을 도와드릴까요?";
  } else if (lowerInput.includes("도움") || lowerInput.includes("help")) {
    response = "어떤 도움이 필요하신가요? 제가 도와드릴게요.";
  } else if (lowerInput.includes("기능") || lowerInput.includes("할 수 있")) {
    response = "저는 질문에 답변하고, 정보를 찾아주고, 간단한 대화를 나눌 수 있어요.";
  }
  
  return {
    audioData: "",
    message: response,
    content: response,
    actionRequired: false,
    redirectionResult: null,
    reservationResult: null
  };
}

// 음성 인식의 자동 시작 상태를 제어하는 함수
export function availabilityFunc(sendMessage, setIsListening) {
  try {
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
      
      // 특정 오류에 따른 처리
      if (event.error === "not-allowed") {
        alert("마이크 권한이 필요합니다. 설정에서 마이크 권한을 허용해주세요.");
      } else if (event.error === "no-speech") {
        console.log("음성이 감지되지 않았습니다.");
      } else {
        alert(`음성 인식 오류: ${event.error}`);
      }
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
      sendMessage(recognizedText);
    });

    // 인식 종료 시 자동 재시작 (필요시)
    newRecognition.addEventListener("end", () => {
      console.log("음성 인식 세션 종료");
    });

    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  } catch (error) {
    console.error("음성 인식 초기화 오류:", error);
    alert("음성 인식을 초기화하는 중 오류가 발생했습니다.");
    return null;
  }
}

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  try {
    if (recognition) {
      recognition.start();
      console.log("음성 인식 자동 시작");
    } else {
      console.error("음성 인식 객체가 초기화되지 않았습니다.");
    }
  } catch (error) {
    console.error("음성 인식 시작 오류:", error);
  }
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  try {
    if (recognition && recognition.stop) {
      recognition.stop();
      console.log("음성 인식 중단");
    } else {
      console.error("음성 인식 객체가 없거나 stop 메서드가 없습니다.");
    }
  } catch (error) {
    console.error("음성 인식 중단 오류:", error);
  }
}

// 채팅 방을 설정하는 함수 (실제 백엔드 API 호출)
export function handleChatRoom(userInfo) {
  return call("/api/v1/conversation-room", "POST", {
    roomName: userInfo?.roomName || "음성 대화"
  })
  .then((response) => {
    if (response && response.conversationRoomNo) {
      roomNo = response.conversationRoomNo;
      console.log("대화방 생성 성공:", roomNo);
      return response;
    } else {
      throw new Error("대화방 번호가 없습니다.");
    }
  })
  .catch((error) => {
    console.error("대화방 생성 오류:", error);
    // 백엔드 서버가 없거나 오류가 발생하면 기본값 사용
    console.log("대화방 생성 실패, 기본값으로 설정:", roomNo);
    return Promise.resolve({ conversationRoomNo: roomNo });
  });
}
