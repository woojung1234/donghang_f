import React, { useState, useEffect } from 'react';
import "consume/component/ConsumList.css";
import { call } from 'login/service/ApiService';

function ConsumList({ setIsOpenDetail, setCardDetail, consumList }) {
    const [displayedConsumList, setDisplayedConsumList] = useState([]);

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}. ${month}. ${day}`;
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // 금액 포맷팅 함수 - .00 제거
    function formatAmount(amount) {
        if (!amount) return '0원';
        
        // 숫자로 변환하여 소수점 제거
        const numAmount = Math.floor(parseFloat(amount));
        return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
    }

    // 모달을 열고 선택한 소비 내역의 상세 정보를 설정하는 함수
    const handleOpenDetailModal = (consumptionNo) => {
        call(`/api/v1/consumption/${consumptionNo}`)
                .then((response) => setCardDetail(response.consumption))
                .catch(() => console.log("소비 내역 상세 조회 실패"));
        setIsOpenDetail(true); // 모달 열기
    };

    useEffect(() => {
        let previousDate = '';
        const updatedList = consumList.map((consum) => {
            const currentDate = formatDate(consum.transactionDate);
            const showDate = currentDate !== previousDate;
            previousDate = currentDate;
            return { ...consum, showDate };
        });
        setDisplayedConsumList(updatedList);
    }, [consumList]);

    return (
        <div className='consumList-container'>
            {displayedConsumList.map((consum, index) => (
                <div key={index} className='consumList-container' onClick={() => handleOpenDetailModal(consum.consumptionNo)}>
                    {consum.showDate && <p className='consumList-date'>{formatDate(consum.transactionDate)}</p>}
                    <div className='consumList-box'>
                        <p className='consumList-time'>{formatTime(consum.transactionDate)} <span>{consum.category || "기타"}</span></p>
                        <div className='consumList-content'>
                            <p className={consum.isAnomalous ? 'cancel-text' : null}>
                                {consum.merchantName}
                                {consum.isAnomalous ? <span className='payment-cancel'>이상거래</span> : ""}
                            </p>
                            <p className={consum.isAnomalous ? 'cancel-text' : null}>
                                {formatAmount(consum.amount)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ConsumList;