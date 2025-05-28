import React, { useEffect, useState } from 'react';
import 'alarm/component/AlarmHistory.css';
import AlarmDetailModal from './AlarmDetailModal';
import info from "image/icon/info.png";
import alarmImg01 from "image/icon-alarm.svg";
import alarmImg02 from "image/icon-megaphone.svg";


function AlarmHistory({alarmList,getAlarmList,fetchAlarmCount}) {

    const [selectedAlarm, setSelectedAlarm] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // 모달 열기 핸들러
    const handleOpenModal = (alarm) => {
        setSelectedAlarm(alarm);
        setIsOpen(true);
    };

    // 모달 닫기 핸들러
    const closeModal = () => {
        setIsOpen(false);
        setSelectedAlarm(null); // 모달이 닫힐 때 선택된 알람 초기화
    };

    // 모달 상태에 따라 body 스크롤 설정
    useEffect(() => {
        document.body.classList.toggle("unscrollable", isOpen);
    }, [isOpen]);

    

    let previousDate = '';

    // 알림 타입을 한국어로 변환하는 함수
    const getNotificationTypeLabel = (notificationType) => {
        switch(notificationType) {
            case 'SYSTEM': return '시스템';
            case 'PAYMENT': return '결제';
            case 'WELFARE': return '복지';
            case 'ANOMALY': return '이상징후';
            default: return notificationType || '알림';
        }
    };

    // 날짜와 시간 포맷팅 함수
    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) {
            return { date: '', time: '' };
        }
        
        // ISO 형식의 날짜를 처리 (예: 2025-05-28T12:34:56.789Z)
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) {
            return { date: '', time: '' };
        }
        
        const datePart = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timePart = date.toTimeString().split(' ')[0]; // HH:MM:SS
        
        return {
            date: datePart,
            time: timePart
        };
    };

    // 시간 차이를 계산하는 함수
    const getRelativeTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        
        const now = new Date();
        const notificationTime = new Date(dateTimeStr);
        
        if (isNaN(notificationTime.getTime())) return '';
        
        const differenceInSeconds = Math.floor((now - notificationTime) / 1000);

        if (differenceInSeconds < 60) return `${differenceInSeconds}초 전`;
        if (differenceInSeconds < 3600) return `${Math.floor(differenceInSeconds / 60)}분 전`;
        if (differenceInSeconds < 86400) return `${Math.floor(differenceInSeconds / 3600)}시간 전`;

        // 1일 이상이면 날짜와 시간을 표시
        const { time } = formatDateTime(dateTimeStr);
        return time;
    };

    return (
        <>
            {alarmList.length ===0 ?(<div className='no-data-container'>
            <img 
                src={info} 
                alt="알림내역없음" 
                className="no-data-image" 
            />
            <p className='no-data-text'>알림 내역이 없습니다.</p>
            </div>):""}

            {alarmList.map((alarm, index) => {
                const { date, time } = formatDateTime(alarm.createdAt);

                // 날짜가 이전 날짜와 다른 경우에만 날짜를 표시
                const showDate = date !== previousDate;
                previousDate = date; // 현재 날짜를 이전 날짜로 업데이트

                // 오늘 날짜인지 확인
                const isToday = date === new Date().toISOString().split('T')[0];
                const displayTime = isToday ? getRelativeTime(alarm.createdAt) : time;

                return (
                    <div key={index} className='alarmHistory' onClick={() => handleOpenModal(alarm)}>
                        {showDate && <p className='alarm-date'>{date}</p>}
                        <div className='alarmHistory-content'>
                            <div className='alarm-text-wrap'> 
                                <div className='alarm-text'> 
                                    <img src={alarm.notificationType ==='PAYMENT'?alarmImg01:alarmImg02} alt="알림" className="alarmImg" />
                                    <p><span className={alarm.notificationType==='PAYMENT'?'alarm-category-blue':'alarm-category'}>[{getNotificationTypeLabel(alarm.notificationType)}] </span>{alarm.title}
                                
                                    </p>
                                </div>
                                 {!alarm.isRead && <div className='alarm-circle' />}
                            </div>
                            
                            <p className='alarm-time'>{displayTime}</p> {/* 오늘일 때 상대 시간 표시, 아닐 때 시간만 표시 */}
                        </div>
                    </div>
                );
            })}
            {selectedAlarm && (
                <AlarmDetailModal
                    notificationNo={selectedAlarm.notificationNo}
                    isOpen={isOpen}
                    closeModal={closeModal}
                    getAlarmList={getAlarmList}
                    fetchAlarmCount={fetchAlarmCount}
                />
            )}
        </>
    );
}

export default AlarmHistory;