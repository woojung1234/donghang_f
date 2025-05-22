import "consume/component/ConsumDetailModal.css";
import Modal from 'react-modal';

function ConsumDetailModal({isOpen,closeModal,cardDetail}) {
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}. ${month}. ${day} ${hours}:${minutes}`;
    }
    
    const customStyles = {
        overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "3"
          },
          content: {
            top: "auto",
            left: "0",
            right: "0",
            bottom: "0",
            height: "auto",
            borderRadius: "15px 15px 0px 0px",
            
        },
    };
    return (
        
            <Modal isOpen={isOpen} onRequestClose={closeModal} style={customStyles}>
                <div className='csModal-wrap'>
                    <p className='csModal-title'>상세조회</p>
                    <div className='csModal-content csModal-line'>
                        <p>{cardDetail.cardHistoryShopname}</p>
                        <p className="card-cancle">{cardDetail.cardHistoryIsCansle?"거래취소":""}</p>
                    </div>
                    <div className='csModal-content'>
                        <p>거래일자</p>
                        <p>{formatDate(cardDetail.cardHistoryApprove)}</p>
                    </div>
                    <div className='csModal-content'>
                        <p>카테고리</p>
                        <p>{cardDetail.cardCategoryName}</p>
                    </div>
                    <div className='csModal-content csModal-dashed'>
                        <p>카드종류</p>
                        <p>{cardDetail.cardFamily?"가족/신용카드":"개인/신용카드"}</p>
                    </div>
                    <div className='csModal-content csModal-line'>
                        <p>이용금액</p>
                        <p className={`csModal-price ${cardDetail.cardHistoryIsCansle?"line-through cancel-text":""}`}><span className={!cardDetail.cardHistoryIsCansle?'csModal-Num':""}>{cardDetail.cardHistoryAmount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>원</p>
                    </div>
                    <button className='csModalBtn' onClick={closeModal}>닫기</button>
                </div>
                
            </Modal>
        
    );
}

export default ConsumDetailModal;