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
  // 먼저 로딩 상태 설정
  setIsLoading(true);
  setIsSpeaking(false);

  // 간단한 더미 응답 생성 (네트워크 요청 없이 즉시 응답)
  const generateLocalResponse = (message) => {
    const lowercaseMessage = message.toLowerCase();
    const responses = {
      "안녕": "안녕하세요! 무엇을 도와드릴까요?",
      "이름": "저는 똑똑이라고 합니다. 무엇을 도와드릴까요?",
      "도움": "복지 서비스 안내, 일정 관리, 건강 관리 등을 도와드릴 수 있어요.",
      "기능": "음성으로 대화하고, 다양한 정보를 알려드릴 수 있어요.",
      "고마워": "천만에요! 더 필요한 것이 있으면 말씀해주세요.",
      "감사": "별말씀을요! 더 도움이 필요하시면 말씀해주세요.",
      // 추가 키워드와 응답
      "날씨": "오늘은 맑은 날씨가 예상됩니다. 외출하기 좋은 날이에요.",
      "건강": "규칙적인 운동과 균형 잡힌 식단이 건강 유지에 중요합니다. 오늘 건강 체크를 도와드릴까요?",
      "취미": "독서, 음악 감상, 걷기 등 다양한 취미를 즐기실 수 있어요. 새로운 취미를 추천해 드릴까요?",
      "복지": "현재 이용 가능한 복지 서비스에 대해 알려드릴게요. 어떤 분야에 관심이 있으신가요?",
      "일정": "오늘의 일정을 관리해 드릴 수 있어요. 새로운 일정을 추가하시겠어요?",
      "약": "약 복용 시간을 알려드릴 수 있어요. 복용 알림을 설정하시겠어요?"
    };

    // 메시지에 키워드가 포함되어 있는지 확인
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowercaseMessage.includes(keyword)) {
        return response;
      }
    }

    // 기본 응답
    return "네, 말씀해주세요. 무엇을 도와드릴까요?";
  };

  // 직접 응답 생성 및 처리 (Promise 사용하지 않고 바로 처리)
  setTimeout(() => {
    try {
      // 로딩 상태 해제하고 말하기 상태로 전환
      setIsLoading(false);
      setIsSpeaking(true);
      
      // 응답 내용 생성
      const content = generateLocalResponse(message);
      
      // 1초 후 응답 표시
      setTimeout(() => {
        // 응답 설정
        setChatResponse(content);
        
        // 말하기 상태 해제
        setIsSpeaking(false);
        
        // 음성 인식 재시작
        startAutoRecord();
        
        // 모달 상태 설정 (현재는 필요없지만 나중에 확장 가능)
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      console.error("응답 처리 오류:", error);
      setChatResponse("죄송합니다. 응답을 처리하는 동안 오류가 발생했습니다.");
      setIsSpeaking(false);
      setIsLoading(false);
      startAutoRecord();
    }
  }, 1000);
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
        console.log(`음성 인식 오류: ${event.error}`);
      }
      
      // 오류 발생 후 1초 뒤에 다시 시작 시도
      setTimeout(() => {
        try {
          if (newRecognition) {
            newRecognition.start();
            console.log("오류 후 음성 인식 재시작");
          }
        } catch (e) {
          console.error("재시작 오류:", e);
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
      sendMessage(recognizedText);
    });

    // 인식 종료 시 자동 재시작
    newRecognition.addEventListener("end", () => {
      console.log("음성 인식 세션 종료");
      try {
        newRecognition.start();
        console.log("음성 인식 자동 재시작");
      } catch (e) {
        console.error("자동 재시작 오류:", e);
      }
    });

    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  } catch (error) {
    console.error("음성 인식 초기화 오류:", error);
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
    // 시작 오류 시 1초 후 다시 시도
    setTimeout(() => {
      try {
        if (recognition) {
          recognition.start();
          console.log("오류 후 음성 인식 시작 재시도");
        }
      } catch (e) {
        console.error("재시도 오류:", e);
      }
    }, 1000);
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

// 채팅 방을 설정하는 함수 (백엔드 연결 없이 성공하도록 수정)
export function handleChatRoom(userInfo) {
  // 백엔드 연결 문제로 인해 항상 성공하는 Promise 반환
  return Promise.resolve({ conversationRoomNo: roomNo });
}