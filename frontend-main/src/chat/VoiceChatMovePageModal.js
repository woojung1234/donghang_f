// import "matching/MatchingModal.css"; // 제거된 매칭 기능 관련 CSS
import Modal from "react-modal";

function VoiceChatMovePageModal({ isOpen, closeModal,handleSubmit,welfareNo,welfareBookStartDate,welfareBookUseTime}) {
  const customStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 999
    },
    content: {
      position: "fixed",
      top: "40%",
      bottom: "0",
      left: "0",
      right: "0",
      height: "auto",
      width: "100%",
      borderRadius: "15px 15px 0 0",
      padding: "25px 25px 0px 25px",
      boxSizing: "border-box",
    },
  };

  const handleYesClick = () => {
    handleSubmit({welfareNo,welfareBookStartDate,welfareBookUseTime}); // 예 버튼을 누르면 content 값을 넘겨줌
  };

  return (
    <div>
      <Modal isOpen={isOpen} onRequestClose={closeModal} style={customStyles}>
        <p className="matchModal-title">이동</p>
        <div className="matchModal-content matchModal-line">
          <p>
            해당 페이지로<span className="blueText">이동</span>하시겠습니까?
          </p>
        </div>
        <div className="modalContainer">
          <button className="matchModalAgreeBtn" onClick={closeModal}>
            닫기
          </button>
          <button className="matchModalBtn" onClick={handleYesClick}>
            예
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default VoiceChatMovePageModal;
