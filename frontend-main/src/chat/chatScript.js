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
      alert("음성 처리 중 오류가 발생했습니다.");
      console.error("API 호출 오류:", error);
      setIsSpeaking(false);
    });
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
      alert("음성 인식을 시작할 수 없습니다. 페이지를 새로고침 해주세요.");
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

// 채팅 방을 설정하는 함수
export function handleChatRoom(userInfo) {
  return call("/api/v1/conversation-room", "POST", userInfo)
    .then((response) => {
      roomNo = response.conversationRoomNo;
      console.log("대화방 생성 성공:", roomNo);
    })
    .catch((error) => {
      alert("대화방 생성에 실패했습니다.");
      console.error("대화방 생성 오류:", error);
    });
}
