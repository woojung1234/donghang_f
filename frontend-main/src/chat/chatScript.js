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
      handleFallbackResponse(
        setChatResponse, 
        setIsLoading, 
        setIsSpeaking, 
        startAutoRecord
      );
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
