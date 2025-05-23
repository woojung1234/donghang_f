import { call } from "login/service/ApiService";

// 기본 대화방 번호 (API 호출이 실패할 경우 대비)
var roomNo = 1;
var recognition;

// 각 키워드별 다양한 응답 목록
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
  "도움": [
    "복지 서비스 안내, 일정 관리, 건강 관리 등을 도와드릴 수 있어요.",
    "생활 정보, 건강 관리, 일정 관리 등 다양한 도움을 드릴 수 있어요.",
    "필요한 정보를 알려드리고, 일상생활에 도움이 되는 조언을 드릴 수 있어요.",
    "복지 정보 안내, 생활 관리, 건강 관리 등을 도와드릴게요."
  ],
  "기능": [
    "음성으로 대화하고, 다양한 정보를 알려드릴 수 있어요.",
    "음성 대화, 정보 검색, 일정 관리 등이 가능합니다.",
    "말로 대화하며 필요한 정보를 알려드리고, 일상 관리를 도와드릴 수 있어요.",
    "음성 인식으로 대화하고 여러분의 질문에 답변해 드려요."
  ],
  "고마워": [
    "천만에요! 더 필요한 것이 있으면 말씀해주세요.",
    "별말씀을요! 언제든지 도움이 필요하시면 말씀해주세요.",
    "도움이 되어 기쁩니다! 또 필요하시면 언제든 불러주세요.",
    "감사합니다! 더 도와드릴 일이 있을까요?"
  ],
  "날씨": [
    "오늘은 맑은 날씨가 예상됩니다. 외출하기 좋은 날이에요.",
    "현재 날씨는 대체로 맑고 온화합니다. 산책하기 좋은 날씨네요.",
    "오늘은 화창한 날씨가 계속될 예정입니다. 자외선 차단제 사용을 권장해요.",
    "현재 하늘이 맑고 바람이 선선해요. 외출하기 좋은 날씨입니다."
  ],
  "건강": [
    "규칙적인 운동과 균형 잡힌 식단이 건강 유지에 중요합니다. 오늘 건강 체크를 도와드릴까요?",
    "건강한 생활을 위해서는 충분한 수면과 정기적인 운동이 필요해요. 어떤 건강 정보가 필요하신가요?",
    "꾸준한 운동과 적절한 영양 섭취가 건강의 비결입니다. 건강 관리에 도움이 필요하신가요?",
    "물을 충분히 마시고 가벼운 스트레칭을 하는 것도 건강에 좋아요. 어떤 건강 정보를 알려드릴까요?"
  ],
  "취미": [
    "독서, 음악 감상, 걷기 등 다양한 취미를 즐기실 수 있어요. 새로운 취미를 추천해 드릴까요?",
    "그림 그리기, 요리, 원예 등 집에서도 즐길 수 있는 취미가 많아요. 어떤 취미에 관심이 있으신가요?",
    "요즘에는 홈 가드닝이나 DIY 공예가 인기 있어요. 관심 있는 취미가 있으신가요?",
    "취미 활동은 스트레스 해소에 좋아요. 요가, 명상, 악기 연주 등은 어떠세요?"
  ],
  "복지": [
    "현재 이용 가능한 복지 서비스에 대해 알려드릴게요. 어떤 분야에 관심이 있으신가요?",
    "다양한 복지 혜택이 준비되어 있어요. 어르신 복지, 주거 복지, 의료 복지 중 어떤 것이 필요하신가요?",
    "맞춤형 복지 서비스를 안내해드릴 수 있어요. 어떤 종류의 지원이 필요하신가요?",
    "복지 서비스 신청 방법과 자격 조건에 대해 안내해 드릴 수 있어요. 어떤 정보가 필요하신가요?"
  ],
  "일정": [
    "오늘의 일정을 관리해 드릴 수 있어요. 새로운 일정을 추가하시겠어요?",
    "일정 관리를 도와드릴게요. 오늘 어떤 계획이 있으신가요?",
    "중요한 일정을 기록하고 알림을 설정해 드릴 수 있어요. 어떤 일정을 추가할까요?",
    "일정 관리는 규칙적인 생활에 도움이 됩니다. 오늘의 계획을 말씀해 주세요."
  ],
  "약": [
    "약 복용 시간을 알려드릴 수 있어요. 복용 알림을 설정하시겠어요?",
    "정기적인 약 복용은 건강 관리에 중요해요. 복용 알림이 필요하신가요?",
    "약 복용 시간을 기록하고 알림을 설정해 드릴게요. 어떤 약을 복용하고 계신가요?",
    "약 복용 관리를 도와드릴게요. 복용 중인 약과 시간을 알려주시겠어요?"
  ]
};

// 기본 응답 변형
const defaultResponses = [
  "네, 말씀해주세요. 무엇을 도와드릴까요?",
  "어떻게 도와드릴까요?",
  "더 자세히 말씀해주시면 도움을 드릴 수 있어요.",
  "궁금한 점이 있으시면 언제든지 물어보세요."
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
  // 먼저 로딩 상태 설정
  setIsLoading(true);
  setIsSpeaking(false);

  // 응답 선택 함수: 키워드에 맞는 다양한 응답 중 랜덤 선택
  const getRandomResponse = (keyword) => {
    if (responseVariations[keyword]) {
      const responses = responseVariations[keyword];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // 간단한 더미 응답 생성 (네트워크 요청 없이 즉시 응답)
  const generateLocalResponse = (message) => {
    const lowercaseMessage = message.toLowerCase();
    
    // 키워드 확인
    for (const keyword of Object.keys(responseVariations)) {
      if (lowercaseMessage.includes(keyword)) {
        return getRandomResponse(keyword);
      }
    }
    
    // 추가 패턴 매칭 (더 복잡한 질문들)
    if (lowercaseMessage.includes("어디") || lowercaseMessage.includes("위치")) {
      return "현재 위치는 지도에서 확인할 수 있어요. 더 자세한 안내가 필요하신가요?";
    } else if (lowercaseMessage.includes("시간") || lowercaseMessage.includes("몇시")) {
      return "현재 시간은 " + new Date().toLocaleTimeString() + "입니다. 도움이 필요하신가요?";
    } else if (lowercaseMessage.includes("추천") || lowercaseMessage.includes("좋은")) {
      return "개인 취향과 상황에 맞는 맞춤형 추천을 도와드릴게요. 어떤 분야의 추천이 필요하신가요?";
    }
    
    // 기본 응답
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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