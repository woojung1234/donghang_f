import {
  availabilityFunc,
  endRecord,
  handleAutoSub,
  handleChatRoom,
  startAutoRecord,
  syncOfflineData, // 🚀 새로 추가
  stopSpeaking, // 🚀 음성 중지 기능
  resetSpeechState, // 🚀 음성 상태 초기화
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
// 🚀 새로 추가
import offlineStorage from "services/offlineStorage";

function VoiceChat(props) {
  const [userInfo, setUserInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [visible, setVisible] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [serviceUrl, setServiceUrl] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [welfareNo, setWelfareNo] = useState("");
  const [welfareBookStartDate, setWelfareBookStartDate] = useState("");
  const [welfareBookUseTime, setWelfareBookUseTime] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false });

  // 🚀 새로 추가할 state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("");

  const navi = useNavigate();
  
  useEffect(() => {
    async function initializeChat() {
      await handleChatRoom(userInfo);
      availabilityFunc(sendMessage, setIsListening);
      
      // 🚀 오프라인 저장소 초기화
      try {
        await offlineStorage.init();
        console.log('📱 오프라인 저장소 초기화 완료');
      } catch (error) {
        console.error('오프라인 저장소 초기화 실패:', error);
      }
    }

    // 🚀 온라인/오프라인 상태 감지
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus("동기화 중...");
      console.log('📶 온라인 상태 복구');
      
      // 오프라인 데이터 동기화
      try {
        await syncOfflineData();
        setSyncStatus("동기화 완료!");
        console.log('✅ 오프라인 데이터 동기화 완료');
        
        // 3초 후 상태 메시지 제거
        setTimeout(() => {
          setSyncStatus("");
        }, 3000);
      } catch (error) {
        console.error('❌ 동기화 실패:', error);
        setSyncStatus("동기화 실패");
        setTimeout(() => {
          setSyncStatus("");
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("");
      console.log('📱 오프라인 상태');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    initializeChat();

    // 🚀 speechSynthesis 상태 모니터링 추가
    const speechMonitor = setInterval(() => {
      // speechSynthesis가 말하고 있지 않은데 isSpeaking이 true인 경우 동기화
      if (!speechSynthesis.speaking && isSpeaking) {
        console.log("🔄 speechSynthesis 상태 동기화: speaking 상태 해제");
        setIsSpeaking(false);
        resetSpeechState();
      }
    }, 500); // 0.5초마다 체크

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(speechMonitor); // 🚀 모니터링 정리
    };
  }, [userInfo, isSpeaking]); // eslint-disable-line react-hooks/exhaustive-deps

  function sendMessage(recognizedText) {
    setChatResponse("");
    setIsLoading(true);
    setIsListening(false);
    
    // 🚀 오프라인 상태 로깅
    if (!isOnline) {
      console.log('🔌 오프라인 모드로 메시지 처리:', recognizedText);
    }
    
    handleAutoSub(
      recognizedText,
      setChatResponse,
      setIsLoading,
      setIsSpeaking,
      setIsOpen,
      setServiceUrl,
      setWelfareNo,
      setWelfareBookStartDate,
      setWelfareBookUseTime,
      setShowConfirmModal
    );
  }

  const handleStartChat = () => {
    if (!isStart) {
      startAutoRecord();
      setIsListening(true);
      setIsStart(true);
    } else {
      endRecord();
      setIsListening(false);
      setIsStart(false);
      window.location.reload();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      console.log("텍스트 입력:", textInput);
      sendMessage(textInput);
      setTextInput("");
    }
  };

  // 🚀 음성 중지 함수
  const handleStopSpeaking = () => {
    console.log("🔇 사용자가 음성 중지 버튼 클릭");
    
    // 즉시 UI 상태 업데이트
    setIsSpeaking(false);
    
    // 음성 중지 실행
    const stopped = stopSpeaking();
    
    console.log("🔇 음성 중지 결과:", stopped);
    
    // 상태 초기화 및 음성 인식 재시작
    setTimeout(() => {
      resetSpeechState();
      console.log("🔄 음성 인식 재시작 준비");
      if (isStart) {
        console.log("🔄 음성 인식 재시작");
        startAutoRecord();
      }
    }, 500); // 1초에서 0.5초로 단축
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    }
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
        }else{
          window.location.href = serviceUrl;
        }
      }
      console.log("이동 처리");
      closeModal();
      endRecord();
  };

  const goToConsumptionPage = () => {
    navi("/consumption");
  };

  return (
    <div className="voicechat-section">
      <VoiceHeader />
      
      {/* 🚀 온라인 상태 표시 */}
      {!isOnline && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          borderRadius: '10px',
          margin: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(255, 107, 107, 0.3)'
        }}>
          🔌 오프라인 상태 - 가계부는 임시 저장됩니다
        </div>
      )}
      
      {/* 🚀 동기화 상태 표시 */}
      {syncStatus && (
        <div style={{
          background: syncStatus.includes('완료') ? 'linear-gradient(135deg, #4CAF50, #45a049)' :
                     syncStatus.includes('실패') ? 'linear-gradient(135deg, #f44336, #d32f2f)' :
                     'linear-gradient(135deg, #2196F3, #1976D2)',
          color: 'white',
          padding: '10px 20px',
          textAlign: 'center',
          borderRadius: '8px',
          margin: '10px 20px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {syncStatus.includes('중') && '🔄'} 
          {syncStatus.includes('완료') && '✅'} 
          {syncStatus.includes('실패') && '❌'} 
          {syncStatus}
        </div>
      )}

      {isSpeaking && <SpeakLoading />}
      {isLoading && <Loading />}
      <img src={chatbot} alt="챗봇" className="chatbot" />
      {isListening && <p className="listening-text">금복이가 듣고 있어요</p>}
      
      {/* 텍스트 입력창 */}
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder={isOnline ? "예: 5000원 점심 먹었어" : "오프라인: 가계부만 기록 가능"}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            borderColor: isOnline ? '#ddd' : '#ff6b6b',
            backgroundColor: isOnline ? 'white' : '#fff5f5'
          }}
        />
        <button 
          className="text-submit-btn" 
          onClick={handleTextSubmit}
          style={{
            backgroundColor: isOnline ? '#4A90E2' : '#ff6b6b',
            opacity: textInput.trim() ? 1 : 0.6
          }}
        >
          전송
        </button>
      </div>

      <button className="hiddenBtn" onClick={toggleModal}>
        {visible ? "닫기" : "답변보이기"}
      </button>
      <button 
        className="chat-startBtn" 
        onClick={handleStartChat}
        style={{
          backgroundColor: isOnline ? (isStart ? '#f44336' : '#FF961B') : '#ff6b6b'
        }}
      >
        {isStart ? "중지" : "음성입력"}
        {!isOnline && " (오프라인)"}
      </button>

      {/* 🚀 음성 중지 버튼 - 음성 응답 중일 때만 표시 */}
      {isSpeaking && (
        <button 
          className="voice-stop-btn" 
          onClick={handleStopSpeaking}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateX(-50%) scale(0.95)';
            e.target.style.backgroundColor = '#cc3333';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateX(-50%) scale(1)';
            e.target.style.backgroundColor = '#ff4444';
          }}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '15px 25px',
            fontSize: '18px',
            fontWeight: 'bold',
            margin: '10px',
            cursor: 'pointer',
            boxShadow: '0 6px 12px rgba(255, 68, 68, 0.5)',
            animation: 'pulse 1.5s infinite',
            position: 'fixed',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            transition: 'all 0.1s ease'
          }}
        >
          🔇 음성 중지
        </button>
      )}

      <button className="consumption-btn" onClick={goToConsumptionPage}>
        💰 소비내역 보기
      </button>

      {/* Modal 컴포넌트 */}
      <Modal isOpen={visible} onRequestClose={toggleModal} style={customStyles}>
        <textarea className="textbox" value={chatResponse} readOnly />
      </Modal>
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

      {/* 복지로 사이트 이동 확인 팝업 */}
      {showConfirmModal.show && (
        <Modal 
          isOpen={showConfirmModal.show} 
          onRequestClose={() => setShowConfirmModal({ show: false })}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            },
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '15px',
              padding: '20px',
              maxWidth: '300px',
              width: '90%',
              textAlign: 'center'
            }
          }}
        >
          <div className="confirm-modal">
            <h3 className="confirm-title">{showConfirmModal.title}</h3>
            <p className="confirm-message">{showConfirmModal.message}</p>
            <div className="confirm-buttons">
              <button 
                className="confirm-cancel-btn"
                onClick={showConfirmModal.onCancel}
              >
                취소
              </button>
              <button 
                className="confirm-confirm-btn"
                onClick={showConfirmModal.onConfirm}
              >
                예
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default VoiceChat;