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
  
  const chatContainerRef = useRef(null);

  const navi = useNavigate();
  
  useEffect(() => {
    async function initializeChat() {
      setError(null);
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
        const recognitionInstance = availabilityFunc(sendMessage, setIsListening);
        if (!recognitionInstance) {
          setSpeechSupported(false);
          setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
        }
      } catch (err) {
        // 초기화 오류가 발생해도 계속 진행 (이미 chatRoomInitialized를 true로 설정함)
        console.error("초기화 오류:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initializeChat();
  }, []);

  // 대화 기록이 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  function sendMessage(recognizedText) {
    if (!recognizedText || recognizedText.trim() === "") {
      console.log("인식된 텍스트가 없습니다.");
      return;
    }
    
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
  }

  // 봇 응답을 처리하는 함수
  function handleBotResponse(response) {
    setChatResponse(response);
    // 봇 응답을 대화 기록에 추가
    setChatHistory(prev => [...prev, { role: "bot", content: response }]);
  }

  const handleStartChat = () => {
    if (!speechSupported) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
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
    endRecord();
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
      {isSpeaking && <SpeakLoading />}
      {isLoading && <Loading />}
      
      {/* 대화 내용 표시 */}
      <div className="chat-container" ref={chatContainerRef}>
        {renderChatHistory()}
        {isListening && (
          <div className="listening-indicator">
            <p>듣고 있어요...</p>
            <div className="listening-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      
      {/* 상태 메시지 영역 */}
      {error && (
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={handleRetry}>다시 시도</button>
        </div>
      )}
      
      {/* 컨트롤 버튼 */}
      <div className="chat-controls">
        <button 
          className={`chat-startBtn ${!speechSupported ? 'disabled' : ''}`} 
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