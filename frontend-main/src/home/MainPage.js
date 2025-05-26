import Button from "home/component/Button";
import Header from "home/component/Header";
import WelfareSlide from "home/component/WelfareSlide";
import "home/MainPage.css";
import { useEffect, useState } from "react";
import { 
  availabilityFunc, 
  endRecord, 
  handleAutoSub, 
  handleChatRoom, 
  startAutoRecord 
} from "chat/chatScript";
import Modal from "react-modal";
import SpeakLoading from "chat/SpeakLoading";
import Loading from "chat/Loading";
import VoiceChatMovePageModal from "chat/VoiceChatMovePageModal";
import chatbot from "image/chat-char.png";

function MainPage() {
  const [isProtege, setIsProtege] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [visible, setVisible] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [serviceUrl, setServiceUrl] = useState("");
  const [welfareNo, setWelfareNo] = useState("");
  const [welfareBookStartDate, setWelfareBookStartDate] = useState("");
  const [welfareBookUseTime, setWelfareBookUseTime] = useState("");

  useEffect(() => {
    const userType = localStorage.getItem("loginUser");
    // 모든 사용자가 USER 타입이므로 항상 true로 설정
    setIsProtege(true);
  }, []);

  useEffect(() => {
    async function initializeChat() {
      await handleChatRoom({});
      availabilityFunc(sendMessage, setIsListening);
    }

    initializeChat();
    return () => {
      // 컴포넌트가 언마운트될 때 음성 인식 중지
      if (isStart) {
        endRecord();
      }
    };
  }, []);

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

  const toggleModal = () => {
    setVisible(!visible);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (serviceUrl) {
      if (serviceUrl === "/welfare-input/check-spec") {
        window.location.href = `/welfare-input/check-spec?welfareNo=${welfareNo}&welfareBookStartDate=${welfareBookStartDate}&welfareBookUseTime=${welfareBookUseTime}`;
      } else {
        window.location.href = serviceUrl;
      }
    }
    console.log("이동 처리");
    closeModal();
    endRecord();
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

  return (
    <div className="main-container">
      <Header isProtege={isProtege} />
      <WelfareSlide isProtege={isProtege}/>
      <Button isProtege={isProtege} />
      
      {/* AI 음성 대화 기능 */}
      <div className="ai-voice-container">
        {isSpeaking && <SpeakLoading />}
        {isLoading && <Loading />}
        {isListening && <p className="listening-text">금복이가 듣고 있어요</p>}
        <button className="hiddenBtn" onClick={toggleModal}>
          {visible ? "닫기" : "답변보이기"}
        </button>
        <button className="chat-startBtn" onClick={handleStartChat}>
          {isStart ? "중지" : "금복이!"}
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
    </div>
  );
}

export default MainPage;