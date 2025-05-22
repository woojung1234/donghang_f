import "alarm/component/AlarmDetailModal.css";
import { call } from 'login/service/ApiService';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';

function AlarmDetailModal({isOpen,closeModal,notificationNo,getAlarmList,fetchAlarmCount}) {
    const [notification, setNotification] =useState([]);
   
    useEffect(()=>{
        call(`/api/v1/notification/read/${notificationNo}`,"GET",null).then((response)=>{
            setNotification(response);
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
                    <p>{notification.notificationCategory}</p>
                </div>

                <div className='adModal-content adModal-dashed'>
                    <p>{notification.notificationContent}</p>
                </div>
                <button className='adModalBtn' onClick={closeModal}>닫기</button>
            </Modal>
        </div>
    );
}

export default AlarmDetailModal;