import { call } from "login/service/ApiService";

var roomNo;
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
    })
    .catch((error) => {
      alert("실패");
      console.error(error);
      setIsSpeaking(false);
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
  recognition.start();
  console.log("음성 인식 자동 시작");
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  if (recognition && recognition.stop) {
    recognition.stop();
    console.log("음성 인식 중단");
  } else {
    console.error("Recognition없음");
  }
}

// 채팅 방을 설정하는 함수
export function handleChatRoom(userInfo) {
  return call("/api/v1/conversation-room", "POST", userInfo)
    .then((response) => {
      roomNo = response.conversationRoomNo;
    })
    .catch((error) => {
      alert("실패");
      console.error(error);
    });
}
