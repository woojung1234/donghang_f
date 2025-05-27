// 파일: src/consume/component/ConsumCard.js
// 기존 카드 UI를 음성 입력 UI로 변경 (파일명과 API는 그대로 유지)

import "consume/component/ConsumCard.css";
import "consume/component/ConsumFilter.css";
// 카드 이미지 import 제거
// import cardP from "image/personalCard.svg";
// import cardF from "image/familyCard.svg";

function ConsumCard({ cardlist, startDate, endDate, handleOpenModal, totalAmount, isRecording, onVoiceInput }) {
    return (
        <div className='consumCard-container'>
            {/* 카드 이미지 대신 음성 입력 섹션 */}
            

            {/* 기존 카드 정보 표시 부분 제거 */}
            
            <div className='filter-content'>
                <div className="filter-date">
                    <p>{startDate && endDate ? `${startDate} ~ ${endDate}` : '날짜 선택'}</p>
                    <button onClick={() => handleOpenModal()} className="filterBtn">기간설정</button>
                </div>
                <div className="filter-totalPrice">
                    <p className='filter-price'>총 소비금액</p>
                    <p className='filter-num'>
                        {Math.floor(parseFloat(totalAmount) || 0).toLocaleString()} 원
                    </p>
                </div>
            </div> 
        </div>
    );
}

export default ConsumCard;