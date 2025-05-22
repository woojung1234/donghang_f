import React from 'react';
import styles from 'header/Header.module.css'; // CSS 모듈 import
import { useLocation, useNavigate } from 'react-router-dom';
import back from "image/Back.png";
import home from "image/gohome.png";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const getTitle = (pathname) => {
        switch (pathname) {
            case '/dolbom-main':
                return '복지 서비스 예약하기';
            case '/welfare-check-pw':
                return '결제하기';
            case '/welfare-check-spec':
                return '복지 서비스 예약하기';
            case '/welfare-input/*':
                return '복지 서비스 예약하기';
            case '/welfare-list':
                return '복지 서비스 예약하기';
            case '/welfare-main':
                return '복지 서비스';
            case '/welfare-reserved-list':
                return '복지 서비스 예약내역';
            case '/welfare-set-pw':
                return '간편 결제 등록';
            
            default:
                return null;
        }
    };

    return (
        <header className={styles['blue-header']}>
            <div className={styles['blue-header-container']}>
                <div className={styles["blue-header-info"]}>
                    <img 
                        src={back} 
                        alt="뒤로가기" 
                        className={styles["back-icon"]} 
                        onClick={() => navigate(-1)} // 뒤로가기 기능 추가
                    />
                    <p className={styles["header-name"]}>
                        {getTitle(location.pathname)}
                    </p>
                    <img 
                        src={home} 
                        alt="홈 가기" 
                        className={styles["home-icon"]} 
                        onClick={() => navigate('/home')} // 홈으로 가기 기능 추가
                    />
                </div>
            </div>

        </header>



    );
}

export default Header;
