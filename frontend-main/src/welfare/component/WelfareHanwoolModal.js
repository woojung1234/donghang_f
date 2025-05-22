import React, { useState, useEffect } from 'react';
import styles from 'welfare/css/WelfareReserveModal.module.css';
import { useNavigate } from 'react-router-dom';
import { useSpecHook } from 'welfare/component/WelfareInputTotal';
import { call } from 'login/service/ApiService';

function WelfareHanwoolModal({ closeModal, loginUser, isExtraInfo }) { 
  const [today, setToday] = useState('');
  const [welfareBookStartDate, setWelfareBookStartDate] = useState('');
  const [welfareBookEndDate, setWelfareBookEndDate] = useState('');
  const [welfareBookUseTime, setWelfareBookUseTime] = useState(0); // 기간 초기 설정 제거
  const [welfareBookTotalPrice, setWelfareBookTotalPrice] = useState(0); // 가격 초기 설정 제거
  const navigate = useNavigate();
  const { userSpec, setUserSpec } = useSpecHook();

  const goInputBirth = () => {
    navigate('/welfare-input/birth');
  }

  const goCheckSpec = () => {
    navigate('/welfare-input/check-spec',{ state: {isExtraInfo} }); // state라는 큰 속성(변수)에 isExtraInfo 값을 담아서 저 페이지로 보냄
  }

  const handleNextClick = () => {
    if (isExtraInfo === false && (loginUser === 'PROTECTOR' || loginUser === 'PROTEGE')) {
      goInputBirth();
    } else {
      goCheckSpec();
    }
  };


  useEffect(() => {
    call("/api/v1/match", "GET", null)
      .then((response) => {
        setUserSpec(prevSpec => ({
          ...prevSpec,
          protegeUserName: response.protegeUserName,
          welfareNo: 3 // welfareNo 설정
        }));
      })
      .catch((error) => {
        console.log(error.message);
        setUserSpec(prevSpec => ({
          ...prevSpec,
          welfareNo: 3 // welfareNo 설정
        }));
      });
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10);
    setToday(formattedDate);
  }, []);

  const handleDateChange = (event) => {
    const newStartDate = event.target.value;
    setWelfareBookStartDate(newStartDate);

    if (!newStartDate) {
        // 날짜가 공백일 때
        setWelfareBookEndDate('');
        setUserSpec(prevSpec => ({
            ...prevSpec,
            welfareBookStartDate: '',
            welfareBookEndDate: ''
        }));
    } else {
        // 유효한 날짜가 입력된 경우
        setWelfareBookEndDate(newStartDate);
        setUserSpec(prevSpec => ({
            ...prevSpec,
            welfareBookStartDate: newStartDate,
            welfareBookEndDate: newStartDate
        }));
    }
};



  const handleTimeChange = (event) => {
    const newDuration = parseInt(event.target.value, 10);
    setWelfareBookUseTime(newDuration);
  
    // 조정된 기간을 기반으로 요금 계산, 기간에서 3을 뺀 후 계산
    const adjustedDuration = Math.max(0, newDuration - 3); // 음수가 되지 않도록 보장
    const newPrice = 2000000 * adjustedDuration;
    setWelfareBookTotalPrice(newPrice); // 계산된 가격을 상태에 저장
  
    // 새로운 종료 날짜 계산, 기간에서 3개월 빼기
    const startDate = new Date(welfareBookStartDate);
    startDate.setMonth(startDate.getMonth() + adjustedDuration); // 기간에서 3 빼기
    const newEndDate = startDate.toISOString().slice(0, 10);
  
    setWelfareBookEndDate(newEndDate); // 종료 날짜를 업데이트
  
    const updatedSpec = {
      ...userSpec,
      welfareBookStartDate: welfareBookStartDate,
      welfareBookEndDate: newEndDate,
      welfareBookUseTime: newDuration,
      welfareBookTotalPrice: newPrice,
      welfarebookDurationText: `${newDuration}개월`  // For display in CheckSpec
    };
    setUserSpec(updatedSpec);
  };
  

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const isNextButtonDisabled = !welfareBookStartDate || welfareBookUseTime === 0;

  return (
    <div className={styles.container}>
      <div className={`${styles["modal-section"]} ${styles["modal-container"]}`}>
        <p className={`${styles["modal-text"]} ${styles["reserve-modal-title"]}`}>한울 돌봄</p>
        
        <hr />
        <div className={styles["reserve-info-container11"]}>
          <div className={styles["start-date-container"]}>
          <span className={styles["reserve-info-text"]}>시작 날짜</span>
          <input
            className={styles["insert-start-date"]}
            type="date"
            value={welfareBookStartDate}
            min={today}
            onChange={handleDateChange}
          />
          </div>
          <br />
          <div className={styles["end-date-container"]}>
            <span className={styles["reserve-info-text"]}>종료 날짜</span>
            <input
              className={styles["end-date"]}
              type="date"
              value={welfareBookEndDate}
              disabled
            />
          </div>
        </div>
        <div className={`${styles["reserve-info-container2"]} ${styles["reserve-info-container2-option"]}`}>
          <span className={styles["reserve-info-text1"]}>기간</span>
          <select className={styles["insert-period"]} disabled={!welfareBookStartDate} value={welfareBookUseTime} onChange={handleTimeChange}>
            <option value="0">기간 선택</option>
            <option value="4">1개월</option>
            <option value="5">2개월</option>
            <option value="6">3개월</option>
            <option value="7">4개월</option>
            <option value="8">5개월</option>
            <option value="9">6개월</option>
          </select>
        </div>
        <hr />
        <div className={styles["reserve-info-container3"]}>
          <span className={styles["reserve-price-text"]}>요금</span>
          <span className={styles.price}>{formatPrice(welfareBookTotalPrice)} 원</span>
        </div>

        <span className={`${styles["main-text"]} ${styles["reserve-cancel"]}`} onClick={closeModal}>닫기</span>
        <span className={`${styles["main-text"]} ${styles["reserve-yeah"]}`} style={{ opacity: isNextButtonDisabled ? 0.5 : 1, pointerEvents: isNextButtonDisabled ? 'none' : 'auto' }} onClick={isNextButtonDisabled ? undefined : handleNextClick}>다음</span>
      </div>
    </div>
  );
}

export default WelfareHanwoolModal;
