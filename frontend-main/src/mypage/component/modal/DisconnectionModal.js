import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import "mypage/component/modal/DisconnectionModal.css"
import { call } from 'login/service/ApiService';
import { useNavigate } from 'react-router-dom';

function DisconnectionModal({matchNo}) {
    const navi = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const handleOpenModal = () => {
        setIsOpen(true);
    };
    
    const closeModal = () => {
        setIsOpen(false);
    }
    useEffect(()=>{
        document.body.classList.toggle("unscrollable",isOpen)
    },[isOpen]);
    const customStyles = {
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
    const handleSubmit = ()=>{
        // 매칭 기능 제거로 단순히 마이페이지로 이동
        console.log("매칭 기능이 제거되어 단순히 마이페이지로 이동합니다.");
        navi('/mypage');
    };
    return (
        <div>
            <button className='substituteBtn orangeBtn' onClick={handleOpenModal} >현재 상대와 매칭 종료</button>
            <Modal isOpen={isOpen} onRequestClose={closeModal} style={customStyles}>
                <p className='dcModal-title'>매칭종료</p>
                <p className='dcModal-content'>정말로 매칭을&nbsp;<span>종료</span>하시겠습니까?</p>
                <div className='dcModal-btn'>
                    <button onClick={closeModal} className='dcModal-cancelBtn dcModalBtn'>닫기</button>
                    <button className='dcModal-agreeBtn dcModalBtn' onClick={handleSubmit}>예</button>
                </div>
                
            </Modal>
        </div>
    );
}

export default DisconnectionModal;