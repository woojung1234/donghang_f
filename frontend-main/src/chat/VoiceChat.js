import {
  availabilityFunc,
  endRecord,
  handleAutoSub,
  handleChatRoom,
  startAutoRecord,
} from "chat/chatScript";
import "chat/VoiceChat.css";
import VoiceHeader from "chat/VoiceHeader";
import chatbot from "image/chat-char.png";
import { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import SpeakLoading from "./SpeakLoading";
import VoiceChatMovePageModal from "./VoiceChatMovePageModal";

function VoiceChat(props) {
  const [userInfo, setUserInfo] = useState({ roomName: "음성 대화" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [visible, setVisible] = useState(false);
  const [isStart, setIsStart] = useState(false);
  // 예약확인 모달
  const [isOpen, setIsOpen] = useState(false);
  const [serviceUrl, setServiceUrl] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [welfareNo, setWelfareNo] = useState("");
  const [welfareBookStartDate, setWelfareBookStartDate] = useState("");
  const [welfareBookUseTime, setWelfareBookUseTime] = useState("");
  // 오류 상태 추가
  const [error, setError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  // 대화방 상태 추가
  const [chatRoomInitialized, setChatRoomInitialized] = useState(false);
  // 대화 기록
  const [chatHistory, setChatHistory] = useState([]);
  // 현재 사용자 입력
  const [currentInput, setCurrentInput] = useState("");
  // 서버 연결 상태
  const [serverConnected, setServerConnected] = useState(true);
  
  const chatContainerRef = useRef(null);

  const navi = useNavigate();
  
  // 브라우저 음성 인식 지원 여부 확인
  useEffect(() => {
    const checkSpeechSupport = () => {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setSpeechSupported(supported);
      
      if (!supported) {
        setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
      }
    };
    
    checkSpeechSupport();
  }, []);
  
  // AI 서버 연결 상태 확인
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${AI_SERVICE_URL}/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          setServerConnected(true);
          setError(null);
        } else {
          setServerConnected(false);
          setError("AI 서버에 연결할 수 없습니다. 오프라인 모드로 전환합니다.");
        }
      } catch (err) {
        console.warn("AI 서버 연결 확인 실패:", err);
        setServerConnected(false);
        setError("AI 서버에 연결할 수 없습니다. 오프라인 모드로 전환합니다.");
      }
    };
    
    checkServerConnection();
  }, []);
  
  useEffect(() => {
    async function initializeChat() {
      setIsLoading(true);
      
      try {
        // 대화방 생성
        console.log("대화방 생성 요청 시작:", userInfo);
        
        // 기본 대화방을 미리 설정하여 오류 방지
        setChatRoomInitialized(true);
        
        // 대화 기록 초기화
        setChatHistory([
          { role: "bot", content: "안녕하세요! 똑똑이입니다. 무엇을 도와드릴까요?" }
        ]);
        
        // 백엔드 대화방 생성 시도
        try {
          const roomResponse = await handleChatRoom(userInfo);
          console.log("대화방 초기화 완료:", roomResponse);
        } catch (roomError) {
          console.log("대화방 생성 실패, 기본값 사용:", roomError);
          // 오류가 발생해도 계속 진행 (이미 chatRoomInitialized를 true로 설정함)
        }
        
        // 음성 인식 초기화 및 지원 여부 확인
        if (speechSupported) {
          try {
            const recognitionInstance = availabilityFunc(sendMessage, setIsListening);
            if (!recognitionInstance) {
              setSpeechSupported(false);
              setError("음성 인식을 초기화할 수 없습니다. 브라우저 권한을 확인해주세요.");
            }
          } catch (recognitionError) {
            console.error("음성 인식 초기화 오류:", recognitionError);
            setSpeechSupported(false);
            setError("음성 인식을 초기화할 수 없습니다.");
          }
        }
      } catch (err) {
        // 초기화 오류가 발생해도 계속 진행 (이미 chatRoomInitialized를 true로 설정함)
        console.error("초기화 오류:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initializeChat();
    
    // 컴포넌트 언마운트 시 음성 인식 중지
    return () => {
      try {
        if (speechSupported) {
          endRecord();
        }
      } catch (e) {
        console.error("음성 인식 정리 오류:", e);
      }
    };
  }, [speechSupported]);

  // 대화 기록이 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  function sendMessage(recognizedText) {
    // 텍스트가 없거나 초기화되지 않은 경우 반환
    if (!recognizedText || recognizedText.trim() === "" || !chatRoomInitialized) {
      console.log("인식된 텍스트가 없거나 채팅방이 초기화되지 않았습니다.");
      return;
    }
    
    try {
      // 사용자 입력을 대화 기록에 추가
      setCurrentInput(recognizedText);
      setChatHistory(prev => [...prev, { role: "user", content: recognizedText }]);
      
      setChatResponse("");
      setIsLoading(true);
      setIsListening(false);
      setError(null);
      
      handleAutoSub(
        recognizedText,
        handleBotResponse,
        setIsLoading,
        setIsSpeaking,
        setIsOpen,
        setServiceUrl,
        setWelfareNo,
        setWelfareBookStartDate,
        setWelfareBookUseTime
      );
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      setIsLoading(false);
      setError("메시지를 처리하는 중 오류가 발생했습니다.");
    }
  }

  // 봇 응답을 처리하는 함수
  function handleBotResponse(response) {
    try {
      if (!response) {
        response = "죄송합니다. 응답을 받지 못했습니다.";
      }
      
      setChatResponse(response);
      // 봇 응답을 대화 기록에 추가
      setChatHistory(prev => [...prev, { role: "bot", content: response }]);
    } catch (error) {
      console.error("봇 응답 처리 오류:", error);
      setError("응답을 처리하는 중 오류가 발생했습니다.");
    }
  }

  const handleStartChat = () => {
    if (!speechSupported) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
      return;
    }
    
    setError(null);
    
    if (!isStart) {
      try {
        startAutoRecord();
        setIsListening(true);
        setIsStart(true);
      } catch (err) {
        setError("음성 인식을 시작할 수 없습니다. 페이지를 새로고침 해주세요.");
        console.error("시작 오류:", err);
      }
    } else {
      try {
        endRecord();
        setIsListening(false);
        setIsStart(false);
      } catch (err) {
        console.error("중지 오류:", err);
      }
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const customStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 100,
    },
    content: {
      backgroundColor: null,
      border: null,
    },
  };

  const toggleModal = () => {
    setVisible(!visible);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (serviceUrl) {
      if(serviceUrl==="/welfare-input/check-spec"){
        navi("/welfare-input/check-spec",{ state: { welfareNo,welfareBookStartDate,welfareBookUseTime } });
      } else {
        window.location.href = serviceUrl;
      }
    }
    console.log("이동 처리");
    closeModal();
    
    // 음성 인식 중지 (오류 방지를 위해 try/catch로 감싸기)
    try {
      if (speechSupported) {
        endRecord();
      }
    } catch (e) {
      console.error("음성 인식 중지 오류:", e);
    }
  };

  // 대화 기록 렌더링
  const renderChatHistory = () => {
    return chatHistory.map((item, index) => (
      <div key={index} className={`chat-bubble ${item.role}`}>
        <div className="chat-content">{item.content}</div>
      </div>
    ));
  };

  return (
    <div className="voicechat-section">
      <VoiceHeader />
      
      {/* 중앙 캐릭터 영역 */}
      <div className="chatbot-character-container">
        <div className={`chatbot-character ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
          <img 
            src={chatbot} 
            alt="챗봇 캐릭터" 
            className={`character-image ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`} 
          />
          <div className="character-status">
            {isListening && <span className="listening-text">듣고 있어요...</span>}
            {isSpeaking && <span className="speaking-text">대답하고 있어요...</span>}
            {!isListening && !isSpeaking && <span className="idle-text">대화를 시작해보세요</span>}
          </div>
          
          {/* 서버 연결 상태 표시 */}
          {!serverConnected && (
            <div className="server-status">
              <span className="offline-indicator">오프라인 모드</span>
            </div>
          )}
          
          {/* 음성 인식 지원 안 함 표시 */}
          {!speechSupported && (
            <div className="speech-status">
              <span className="speech-unsupported">음성 인식 미지원</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 로딩 표시 */}
      {isLoading && <div className="loading-overlay"><Loading /></div>}
      
      {/* 대화 내용 표시 영역 (하단에 위치) */}
      <div className="chat-history-container">
        <div className="chat-container" ref={chatContainerRef}>
          {renderChatHistory()}
          
          {/* 음성 인식 상태 표시 */}
          {isListening && (
            <div className="listening-indicator">
              <div className="listening-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 오류 메시지 */}
      {error && (
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={handleRetry}>다시 시도</button>
        </div>
      )}
      
      {/* 음성 인식 버튼 */}
      <div className="chat-controls">
        <button 
          className={`chat-startBtn ${!speechSupported ? 'disabled' : ''} ${isStart ? 'recording' : ''}`} 
          onClick={handleStartChat}
          disabled={!speechSupported}
        >
          {isStart ? "음성 인식 중지" : "음성으로 대화하기"}
        </button>
      </div>

      {/* 모달 컴포넌트 */}
      {isOpen && (
        <VoiceChatMovePageModal
          isOpen={isOpen}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          welfareNo={welfareNo}
          welfareBookStartDate={welfareBookStartDate}
          welfareBookUseTime={welfareBookUseTime}
        />
      )}
    </div>
  );
}

export default VoiceChat;