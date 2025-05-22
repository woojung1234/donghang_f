import React, { useState } from 'react';
import "./LoginOptionModal.css";
import Modal from 'react-modal';
import { useLocation, useNavigate } from 'react-router-dom';
import arrow from 'image/icon/arrow.png';
import pw from 'image/icon/pw.svg';
import id from 'image/icon/id.svg';
import fingerprint from 'image/icon/small-fingerprint.svg';



function LoginOptionModal(props) {
    const navigate =useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenModal = () => {
        setIsOpen(true);
    };
    
    const closeModal = () => {
        setIsOpen(false);
    }
    const handleGoLoginBio = () =>{
        navigate("/loginbio")
    }
    const handleGoLoginId = () =>{
        navigate("/loginid")
    }
    const handleGoLoginPw = () =>{
        navigate("/loginpw")
    }
    const customStyles = {
        overlay:{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
    };
    
    return (
        <div>
            <div className="login-option"  onClick={handleOpenModal}>
                <p className="text-normal" >다른 로그인 방법</p>
                <img src={arrow} alt="다른로그인방법" className="icon-arrow"/> 
            </div>
            <Modal isOpen={isOpen} onRequestClose={closeModal} className="login-modal" style={customStyles}>
                <div className="modal-content">
                    <div className='modal-top'>
                        <p className="modal-title">로그인 방법을 선택해 주세요</p>
                        <div class="modal-close" onClick={closeModal}>
                            <div class="line-box">
                                <span class="line-01"></span>
                                <span class="line-02"></span>
                            </div>
                        </div>
                    </div>
                    <div className="modal-type">
                        {location.pathname !== '/loginbio' &&(
                            <div className="bio" onClick={handleGoLoginBio}>
                                <img src={fingerprint} alt="생체인증로그인" className="icon-fingerprint" onClick={handleGoLoginBio}/> 
                                <p className="modal-text">생체인증</p>
                            </div>
                        )}
                        {location.pathname !== '/loginpw' &&(
                            <div className='pw' onClick={handleGoLoginPw}>
                                <img src={pw} alt="간편비밀번호로그인" className="icon-pw" onClick={handleGoLoginPw}/> 
                                <p className="modal-text">간편비밀번호</p>
                            </div>
                        )}
                            {location.pathname !== '/loginid' &&(
                                <div className='id' onClick={handleGoLoginId} >
                                    <img src={id} alt="아이디로그인" className="icon-id" onClick={handleGoLoginId}/> 
                                    <p className="modal-text">아이디</p>
                                </div>
                            )}
                    </div>

                </div>
               
            </Modal>
           
        </div>
    );
}

export default LoginOptionModal;