import chatbot from "image/chat-char.png";
import 'main/component/chat/ChatSection.css';

function ChatSection({handleVoiceChatClick}) {
  return (
    <div className="chat-section">
      <div className="chat-button" onClick={handleVoiceChatClick}>
        <img src={chatbot} alt="챗봇" className="icon" />
        <div className="main-text">
          <p className="chat-head-text">금복이와 대화해보세요</p>
          <p className="chat-info-text">💰 "5000원 점심 먹었어" ⟶ 가계부 자동 기록!</p>
        </div>
      </div>
      
      {/* 가계부 안내 메시지 */}
      <div className="expense-guide">
        <div className="guide-header">
          <span className="guide-icon">📝</span>
          <span className="guide-title">가계부 자동 기록</span>
        </div>
        <div className="guide-examples">
          <div className="example">"만원 점심 먹었어"</div>
          <div className="example">"3천원 버스비 냈어"</div>
          <div className="example">"커피 4000원 샀어"</div>
        </div>
        <p className="guide-description">
          이런 식으로 말하면 가계부에 자동으로 저장돼요!
        </p>
      </div>
    </div>
  );
}

export default ChatSection;