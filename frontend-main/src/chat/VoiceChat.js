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
import { useEffect, useState } from "react";
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
  // 디버깅용 상태 추가
  const [debugInfo, setDebugInfo] = useState("");

  const navi = useNavigate();
  
  useEffect(() => {
    async function initializeChat() {
      setError(null);
      setIsLoading(true);
      setDebugInfo("초기화 중...");
      
      try {
        // 대화방 생성
        console.log("대화방 생성 요청 시작:", userInfo);
        const roomResponse = await handleChatRoom(userInfo);
        console.log("대화방 초기화 완료:", roomResponse);
        setDebugInfo(prev => prev + "\n대화방 생성 완료: " + JSON.stringify(roomResponse));
        setChatRoomInitialized(true);
        
        // 음성 인식 초기화 및 지원 여부 확인
        const recognitionInstance = availabilityFunc(sendMessage, setIsListening);
        if (!recognitionInstance) {
          setSpeechSupported(false);
          setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
          setDebugInfo(prev => prev + "\n음성 인식 미지원");
        } else {
          setDebugInfo(prev => prev + "\n음성 인식 초기화 완료");
        }
      } catch (err) {
        setError("초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.");
        console.error("초기화 오류:", err);
        setDebugInfo(prev => prev + "\n초기화 오류: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    initializeChat();
  }, []);

  function sendMessage(recognizedText) {
    if (!recognizedText || recognizedText.trim() === "") {
      console.log("인식된 텍스트가 없습니다.");
      setDebugInfo(prev => prev + "\n인식된 텍스트 없음");
      return;
    }
    
    if (!chatRoomInitialized) {
      setError("대화방이 초기화되지 않았습니다. 페이지를 새로고침 해주세요.");
      setDebugInfo(prev => prev + "\n대화방 초기화 안됨");
      return;
    }
    
    setChatResponse("");
    setIsLoading(true);
    setIsListening(false);
    setError(null);
    setDebugInfo(prev => prev + "\n메시지 전송: " + recognizedText);
    
    handleAutoSub(
      recognizedText,
      setChatResponse,
      setIsLoading,
      setIsSpeaking,
      setIsOpen,
      setServiceUrl,
      setWelfareNo,
      setWelfareBookStartDate,
      setWelfareBookUseTime
    );
  }

  const handleStartChat = () => {
    if (!speechSupported) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.");
      setDebugInfo(prev => prev + "\n음성 인식 미지원으로 시작 불가");
      return;
    }
    
    if (!chatRoomInitialized) {
      setError("대화방이 초기화되지 않았습니다. 페이지를 새로고침 해주세요.");
      setDebugInfo(prev => prev + "\n대화방 초기화 안됨");
      return;
    }
    
    setError(null);
    
    if (!isStart) {
      try {
        startAutoRecord();
        setIsListening(true);
        setIsStart(true);
        setDebugInfo(prev => prev + "\n음성 인식 시작");
      } catch (err) {
        setError("음성 인식을 시작할 수 없습니다. 페이지를 새로고침 해주세요.");
        console.error("시작 오류:", err);
        setDebugInfo(prev => prev + "\n시작 오류: " + err.message);
      }
    } else {
      try {
        endRecord();
        setIsListening(false);
        setIsStart(false);
        setDebugInfo(prev => prev + "\n음성 인식 중지");
      } catch (err) {
        console.error("중지 오류:", err);
        setDebugInfo(prev => prev + "\n중지 오류: " + err.message);
      }
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const toggleDebug = () => {
    setVisible(!visible);
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

  return (
    <div className="voicechat-section">
      <VoiceHeader />
      {isSpeaking && <SpeakLoading />}
      {isLoading && <Loading />}
      <img src={chatbot} alt="챗봇" className="chatbot" />
      
      {/* 상태 메시지 영역 */}
      {isListening && <p className="listening-text">똑똑이가 듣고 있어요</p>}
      {error && (
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={handleRetry}>다시 시도</button>
        </div>
      )}
      
      <button className="hiddenBtn" onClick={toggleModal}>
        {visible ? "닫기" : "답변보이기"}
      </button>
      <button 
        className={`chat-startBtn ${(!speechSupported || !chatRoomInitialized) ? 'disabled' : ''}`} 
        onClick={handleStartChat}
        disabled={!speechSupported || !chatRoomInitialized}
      >
        {isStart ? "중지" : "똑똑!"}
      </button>

      {/* 디버그 정보 버튼 */}
      <button className="debug-btn" onClick={toggleDebug}>
        디버그 정보
      </button>

      {/* 디버그 정보 */}
      {visible && (
        <div className="debug-container">
          <h3>디버그 정보</h3>
          <pre className="debug-text">{debugInfo}</pre>
          <p>챗봇 응답:</p>
          <pre className="chat-response">{chatResponse}</pre>
        </div>
      )}

      {/* 모달 컴포넌트 */}
      <Modal isOpen={isOpen} onRequestClose={closeModal} style={customStyles}>
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
      </Modal>
    </div>
  );
}

export default VoiceChat;