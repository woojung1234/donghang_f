import "alarm/component/AlarmDetailModal.css";
import { call } from 'login/service/ApiService';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';

function AlarmDetailModal({isOpen,closeModal,notificationNo,getAlarmList,fetchAlarmCount}) {
    const [notification, setNotification] =useState([]);

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
   
    useEffect(()=>{
        call(`/api/v1/notifications/${notificationNo}`,"GET",null).then((response)=>{
            setNotification(response.notification || response);
            getAlarmList();
            fetchAlarmCount();
        }).catch((error)=>{
            alert("상세 조회 실패");
        });
    },[notificationNo, isOpen]);

    const AlarmDetailStyles = {
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
    };
    return (
        <div>
            <Modal isOpen={isOpen} onRequestClose={closeModal} style={AlarmDetailStyles}>
                <p className='adModal-title'>상세조회</p>
                {/* <hr></hr> */}
                <div className='adModal-info-title'>
                    <p>{getNotificationTypeLabel(notification.notificationType)} - {notification.title}</p>
                </div>

                <div className='adModal-content adModal-dashed'>
                    <p>{notification.content}</p>
                </div>
                <button className='adModalBtn' onClick={closeModal}>닫기</button>
            </Modal>
        </div>
    );
}

export default AlarmDetailModal;