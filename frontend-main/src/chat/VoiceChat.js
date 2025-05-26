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
  const [userInfo, setUserInfo] = useState("");
  // const [recognition, setRecognition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // const [roomNo, setRoomNo] = useState(null);
  const [chatResponse, setChatResponse] = useState("");
  const [visible, setVisible] = useState(false);
  const [isStart, setIsStart] = useState(false);
  //예약확인 모달
  const [isOpen, setIsOpen] = useState(false);
  const [serviceUrl, setServiceUrl] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [welfareNo, setWelfareNo] = useState("");
  const [welfareBookStartDate, setWelfareBookStartDate] = useState("");
  const [welfareBookUseTime, setWelfareBookUseTime] = useState("");

  // 텍스트 입력 관련 상태 추가
  const [textInput, setTextInput] = useState("");

  const navi = useNavigate();
  
  useEffect(() => {
    async function initializeChat() {
      // await handleChatRoom(userInfo);
      // handleAutoSub(
      //   "Greeting",
      //   setChatResponse,
      //   setIsLoading,
      //   setIsSpeaking,
      //   setIsOpen,
      //   setServiceUrl
      // );
      await handleChatRoom(userInfo);
      availabilityFunc(sendMessage, setIsListening);
    }

    initializeChat();
  }, [userInfo]);

  function sendMessage(recognizedText) {
    setChatResponse("");
    setIsLoading(true);
    setIsListening(false);
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

  // 텍스트 입력 처리 함수
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      console.log("텍스트 입력:", textInput);
      sendMessage(textInput);
      setTextInput("");
    }
  };

  // 엔터키 처리
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

  // 소비내역 페이지로 이동하는 함수
  const goToConsumptionPage = () => {
    navi("/consumption");
  };

  return (
    <div className="voicechat-section">
      <VoiceHeader />
      {isSpeaking && <SpeakLoading />}
      {isLoading && <Loading />}
      <img src={chatbot} alt="챗봇" className="chatbot" />
      {isListening && <p className="listening-text">금복이가 듣고 있어요</p>}
      
      {/* 텍스트 입력창 추가 */}
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder="예: 5000원 점심 먹었어"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="text-submit-btn" onClick={handleTextSubmit}>
          전송
        </button>
      </div>

      <button className="hiddenBtn" onClick={toggleModal}>
        {visible ? "닫기" : "답변보이기"}
      </button>
      <button className="chat-startBtn" onClick={handleStartChat}>
        {isStart ? "중지" : "음성입력"}
      </button>

      {/* 소비내역 보기 버튼 */}
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
    </div>
  );
}

export default VoiceChat;
