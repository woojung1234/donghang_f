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
    if (loginUserStored === "PROTECTOR") {
      call("/api/v1/match", "GET", null)
        .then((response) => {
          setLoginUser({ protegeUserName: response.protegeUserName });
        })
        .catch((error) => {
          console.log(error.message);
        });
    } else {
      const userNo = localStorage.getItem("userNo");
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

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles["main-container"]}>
        <p className={styles["info-container"]}>
          <span className={styles["user-name"]}>{loginUser.protegeUserName ? `${loginUser.protegeUserName}` : `${loginUser.userName || ''}`}</span>
          <span className={styles.for}> 님을 위한</span>
        </p>
        <p className={styles.infomation}>복지 서비스를</p>
        <p className={styles.infomation}>똑똑에서 예약해보세요</p>
        <img src={welfare} alt="복지" className={styles["img-welfare"]} />
        <div className={`${styles["main-section"]} ${styles["detailed-reserve"]}`} onClick={goDetailReserved}>
          <p className={`${styles["main-text"]} ${styles["detailed-reserve-text"]}`}>예약 내역 보기</p>
        </div>
        <div className={`${styles["main-section"]} ${styles["go-reserve"]}`} onClick={goDolbomMain}>
          <p className={`${styles["main-text"]} ${styles["go-reserve-text"]}`}>예약하러 가기</p>
        </div>
      </div>
    </div>
  );
}

export default WelfareMain;
