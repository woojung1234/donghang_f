import Header from 'header/Header.js';
import dolbomi from "image/dolbomi.png";
import hanwool1 from "image/welfare02.svg";
import hanwool2 from "image/hanwool_2.png";
import housework1 from "image/welfare01.svg";
import housework2 from "image/housework_3.png";
import nursing1 from "image/welfare03.svg";
import nursing2 from "image/nursing_3.png";
import { call } from 'login/service/ApiService';
import { useEffect, useState } from 'react';
import Modal from "react-modal";
import WelfareHanwoolModal from 'welfare/component/WelfareHanwoolModal';
import WelfareHouseworkModal from 'welfare/component/WelfareHouseworkModal';
import WelfareNursingModal from 'welfare/component/WelfareNursingModal';
import styles from 'welfare/css/DolbomMain.module.css';
import { useSpecHook } from './WelfareInputTotal';
import ExtraInfo from 'cardCreate/application/ExtraInfo';
Modal.setAppElement('#root');
function DolbomMain() {
  const [selectedId, setSelectedId] = useState('nursing');
  const [isOpen, setIsOpen] = useState(false);
  const [isCard, setIsCard] = useState(false);
  const [isExtraInfo, setIsExtraInfo] = useState(false);
  const [loginUser, setLoginUser] = useState(null); // loginUser 상태 추가
  const { userSpec, setUserSpec } = useSpecHook();
  useEffect(() => {
    const storedLoginUser = localStorage.getItem("loginUser");
    setLoginUser(storedLoginUser);
    call("/api/v1/card/isCard", "GET", null)
      .then((response) => {
        setIsCard(response.isCard);
      })
      .catch((error) => {
        console.error("Error fetching card status:", error);
      });
      if (storedLoginUser === "PROTECTOR") {
        call('/api/v1/users', 'GET', null)
            .then(response => {
                setUserSpec(response);
    
                // response 객체를 직접 사용하여 조건 평가
                if(response.protegeAddress === null 
                  || response.protegeBirth === null 
                  || response.protegeDisease === null
                  || response.protegeHeight === 0
                  || response.protegeWeight === 0) {
                  setIsExtraInfo(false);
                } else {
                  setIsExtraInfo(true);
                }
            })
            .catch(error => {
                console.log("매칭된 피보호자의 정보 조회 오류", error);
            });
    } else {
        call('/api/v1/users', 'GET', null)
            .then(response => {
                setUserSpec(response);
    
                // response 객체를 직접 사용하여 조건 평가
                if(response.protegeAddress === null 
                  || response.protegeBirth === null 
                  || response.protegeDisease === null
                  || response.protegeHeight === 0
                  || response.protegeWeight === 0) {
                  setIsExtraInfo(false);
                } else {
                  setIsExtraInfo(true);
                }
            })
            .catch(error => {
                console.log("피보호자 본인 정보 조회 오류", error);
            });
    }
    
    
  }, []);
  useEffect(()=> { // 해당 값 바뀔때마다 콘솔로 찍음
    console.log("isExtraInfo 값: " + isExtraInfo);
  },[isExtraInfo]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  const openModal = () => {
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
  };
  const ReserveStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: "2"
    },
    content: {
      position: "fixed",
      top: "40%",
      bottom: "0",
      left: "0",
      right: "0",
      height: "auto",
      width: "100%",
      borderRadius: "15px 15px 0 0",
      padding: "25px 25px 0px 25px",
      boxSizing: "border-box",
    },
  };
  const handleClick = (id) => {
    setSelectedId(id);
  };
  const renderModalContent = () => {
    switch (selectedId) {
      case 'nursing':
        return <WelfareNursingModal closeModal={closeModal} loginUser={loginUser} isExtraInfo={isExtraInfo} />;
      case 'housework':
        return <WelfareHouseworkModal closeModal={closeModal} loginUser={loginUser} isExtraInfo={isExtraInfo} />;
      case 'hanwool':
        return <WelfareHanwoolModal closeModal={closeModal} loginUser={loginUser} isExtraInfo={isExtraInfo} />;
      default:
        return null;
    }
  };
  const renderButtonText = () => {
    return isCard ? '신청하기' : '카드를 신청하고 이용해주세요';
  };
  const renderContent = () => {
    switch (selectedId) {
      case 'nursing':
        return (
          <div className={styles["info-container"]}>
            <img src={nursing1} alt='가정간병1' className={styles['img-info-first']} />
            <img src={dolbomi} alt='똑돌보미' className={styles['img-info']} />
            <img src={nursing2} alt='가정간병2' className={styles['img-info']} />
            
            <div 
              className={`${styles["button-section"]} ${styles["go-reserve-nursing"]}`} 
              onClick={isCard ? openModal : null}
              style={{ cursor: isCard ? 'pointer' : 'not-allowed', opacity: isCard ? 1 : 0.5 }}
            >
              <p className={`${styles["main-text"]} ${styles["go-reserve-nursing-text"]}`}>{renderButtonText()}</p>
            </div>
          </div>
        );
      case 'housework':
        return (
          <div className={styles["info-container"]}>
            <img src={housework1} alt='일상가사1' className={styles['img-info-first']} />
            <img src={dolbomi} alt='똑돌보미' className={styles['img-info']} />
            <img src={housework2} alt='일상가사2' className={styles['img-info']} />
            <div 
              className={`${styles["button-section"]} ${styles["go-reserve-nursing"]}`} 
              onClick={isCard ? openModal : null}
              style={{ cursor: isCard ? 'pointer' : 'not-allowed', opacity: isCard ? 1 : 0.5 }}
            >
              <p className={`${styles["main-text"]} ${styles["go-reserve-nursing-text"]}`}>{renderButtonText()}</p>
            </div>
          </div>
        );
      case 'hanwool':
        return (
          <div className={styles["info-container"]}>
            <img src={hanwool1} alt='한울돌봄1' className={styles['img-info-first']} />
            <img src={dolbomi} alt='똑돌보미' className={styles['img-info']} />
            <img src={hanwool2} alt='한울돌봄2' className={styles['img-info']} />
            <div 
              className={`${styles["button-section"]} ${styles["go-reserve-nursing"]}`} 
              onClick={isCard ? openModal : null}
              style={{ cursor: isCard ? 'pointer' : 'not-allowed', opacity: isCard ? 1 : 0.5 }}
            >
              <p className={`${styles["main-text"]} ${styles["go-reserve-nursing-text"]}`}>{renderButtonText()}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className={styles["container"]}>
      <Header />
      <div className={styles["main-container"]}>
        <div className={styles['main-section-container']}>
        <div 
          className={`${styles["main-section"]} ${styles["hanwool-list"]}`} 
          id="nursing" 
          style={{ backgroundColor: selectedId === 'nursing' ? '#80BAFF' : '', border: selectedId === 'nursing' ? '3px solid #80BAFF' : ''  }}
          onClick={() => handleClick('nursing')}
        >
          <p 
            className={`${styles["main-text"]} ${styles["nursing-list-text"]}`} 
            style={{ color: selectedId === 'nursing' ? 'white' : '#686868' }}
            id='nursing'
          >
            가정 간병
          </p>
        </div>
        <div 
          className={`${styles["main-section"]} ${styles["hanwool-list"]}`} 
          id="housework" 
          style={{ backgroundColor: selectedId === 'housework' ? '#80BAFF' : '', border: selectedId === 'housework' ? '3px solid #80BAFF' : ''   }}
          onClick={() => handleClick('housework')}
        >
          <p 
            className={`${styles["main-text"]} ${styles["housework-list-text"]}`} 
            style={{ color: selectedId === 'housework' ? 'white' : '#686868' }}
            id='housework'
          >
            일상 가사
          </p>
        </div>
        <div 
          className={`${styles["main-section"]} ${styles["hanwool-list"]}`} 
          id="hanwool" 
          style={{ backgroundColor: selectedId === 'hanwool' ? '#80BAFF' : '', border: selectedId === 'hanwool' ? '3px solid #80BAFF' : ''   }}
          onClick={() => handleClick('hanwool')}
        >
          <p 
            className={`${styles["main-text"]} ${styles["hanwool-list-text"]}`} 
            style={{ color: selectedId === 'hanwool' ? 'white' : '#686868' }}
            id='hanwool'
          >
            한울 돌봄
          </p>
        </div>
        </div>
        <div className={styles["content-display"]}>
          {renderContent()}
        </div>
      </div>
      
      <Modal isOpen={isOpen} onRequestClose={closeModal} style={ReserveStyles}>
        {renderModalContent()}
      </Modal>
    </div>
  );
}
export default DolbomMain;