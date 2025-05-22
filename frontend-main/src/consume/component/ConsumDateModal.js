import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import "consume/component/ConsumDateModal.css";
import { call } from 'login/service/ApiService';

function ConsumDateModal({ isOpen, closeModal, updateDates, setConsumList, cardId,startDate,endDate }) {

    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    useEffect(() => {
        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
    }, [startDate, endDate]);


    const handleStartDateChange = (event) => {
        const value = event.target.value;
        setLocalStartDate(value);
        if (new Date(value) > new Date(localEndDate)) {
            setLocalEndDate(value); // 시작일 변경 후 종료일이 시작일보다 빠르면 종료일을 시작일과 같게 설정
        }
    };

    const handleEndDateChange = (event) => {
        const value = event.target.value;
        setLocalEndDate(value);
    };

    const handleSaveDates = () => {
        updateDates(localStartDate, localEndDate);
        call('/api/v1/card-history', "GET", { 
            cardId: cardId, 
            startDate: localStartDate,
            endDate: localEndDate
        }).then((response) => {
            setConsumList(response);
        }).catch((error) => {
            console.error("데이터 조회 실패", error);
        });
        closeModal(); // 모달 닫기
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            style={{
                overlay: {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: "2"
                },
                content: {
                    top: "auto",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    height: "auto",
                    borderRadius: "15px 15px 0px 0px",
                    
                },
            }}
        >
            <div className="container">
                <div className="modal-section modal-container">
                    <p className="consume-modal-title">기간 설정</p>
                    <div className="reserve-info-container-box dateModal-line">
                        <div className="consume-info-container1">
                            <span className="consume-info-text">시작일</span>
                            <input 
                                type="date" 
                                className='consume-start-date' 
                                value={localStartDate}
                                onChange={handleStartDateChange} 
                            />
                        </div>
                        <div className="consume-info-container2">
                            <span className="consume-info-text">종료일</span>
                            <input 
                                type="date" 
                                className='consume-end-date' 
                                value={localEndDate}
                                min={localStartDate}
                                onChange={handleEndDateChange} 
                            />
                        </div>
                    </div>
                    <div className="modal-date-buttons">
                        <button className="dateBtn modal-cancel" onClick={closeModal}>닫기</button>
                        <button className="dateBtn modal-yeah" onClick={handleSaveDates}>다음</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default ConsumDateModal;