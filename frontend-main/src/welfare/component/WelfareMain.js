import React, { useEffect, useState } from 'react';
import styles from 'welfare/css/WelfareMain.module.css';
import welfare from "image/welfare.png";
import { useNavigate } from 'react-router-dom';
import Header from 'header/BlueHeader.js';
import { call } from 'login/service/ApiService';

function WelfareMain() {
  // useState를 올바르게 사용하기 위해 배열 구조 분해 할당 사용
  const [loginUser, setLoginUser] = useState({});

  useEffect(() => {
    const loginUserStored = localStorage.getItem("loginUser");
    const userNo = localStorage.getItem("userNo");
    
    // 사용자 정보 조회 (통합)
    if (userNo) {
      call('/api/v1/users', 'GET', userNo)
        .then((response) => {
          setLoginUser({ userName: response.userName });
        })
        .catch(error => {
          console.log("회원 정보 조회 오류", error);
        });
    }
  }, []);
  

  const navigate = useNavigate();

  const goDetailReserved = () => {
    navigate('/welfare-reserved-list');
  }

  const goDolbomMain = () => {
    navigate('/welfare-list');
  }

  // 복지 서비스 예약 페이지로 이동
  const goToReservation = () => {
    navigate('/welfare-reservation');
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles["main-container"]}>
        <p className={styles["info-container"]}>
          <span className={styles["user-name"]}>{loginUser.userName || ''}</span>
          <span className={styles.for}> 님을 위한</span>
        </p>
        <p className={styles.infomation}>복지 서비스를</p>
        <p className={styles.infomation}>금복이에서 예약해보세요</p>
        <img src={welfare} alt="복지" className={styles["img-welfare"]} />
        
        {/* 버튼 컨테이너 추가 */}
        <div className={styles["button-container"]}>
          <div className={`${styles["main-section"]} ${styles["detailed-reserve"]}`} onClick={goDetailReserved}>
            <p className={`${styles["main-text"]} ${styles["detailed-reserve-text"]}`}>예약 내역 보기</p>
          </div>
          <div className={`${styles["main-section"]} ${styles["go-reserve"]}`} onClick={goDolbomMain}>
            <p className={`${styles["main-text"]} ${styles["go-reserve-text"]}`}>예약하러 가기</p>
          </div>
        </div>

        {/* 복지 서비스 더보기와 예약 버튼 섹션 */}
        <div className={styles["service-buttons-container"]}>
          <button className={styles["service-more-button"]} onClick={goDolbomMain}>
            복지 서비스 더보기
          </button>
          <button className={styles["service-reservation-button"]} onClick={goToReservation}>
            복지 서비스 예약하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelfareMain;
