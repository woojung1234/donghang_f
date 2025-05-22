import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpecHook } from 'welfare/component/WelfareInputTotal'; // 가정한 useSpecHook 사용
import styles from 'welfare/css/WelfarePayCompl.module.css';

function WelfarePayCompl() {
  const navigate = useNavigate();
  const [today, setToday] = useState('');
  const { userSpec } = useSpecHook();  // userSpec을 가져옴

  function displayTime(duration) {
    switch(duration) {
      case 1:
        return '3시간 (09:00 ~ 12:00)';
      case 2:
        return '6시간 (09:00 ~ 15:00)';
      case 3:
        return '9시간 (09:00 ~ 18:00)';
      case 4:
        return '1개월';
      case 5:
        return '2개월';
      case 6:
        return '3개월';
      case 7:
        return '4개월';
      case 8:
        return '5개월';
      case 9:
        return '6개월';
      default:
        return '시간 정보 없음';
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0 // 소수점 아래 자리수를 0으로 설정하여 정수로 표시
    }).format(price); // currency: 'KRW' 옵션을 제거하여 원화 기호 제거
  }

  function calculatePrice(welfareBookUseTime) {
    if ([1, 2, 3].includes(welfareBookUseTime)) {
      return 75000 * welfareBookUseTime;
    } else if ([4, 5, 6, 7, 8, 9].includes(welfareBookUseTime)) {
      return 2000000 * (welfareBookUseTime - 3);
    } else {
      return 0;  // welfareBookUseTime이 예상 범위 밖의 값인 경우
    }
  }

  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '.');
    setToday(formattedDate);
    console.log("userSpec: " + JSON.stringify(userSpec));
  }, []);

  const goDetailReserved = () => {
    navigate('/welfare-reserved-list');
  };

  const getProtegeName = (welfareNo)=>{
    switch(welfareNo){
      case 1:
        return "일상 가사";
      case 2:
        return "가정 간병";
      default:
        return "한울 돌봄";
    }

  }
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles["header-info"]}>
          <h2 className={styles["header-name"]}>
            <span className={styles["pay-com"]}>결제가 완료</span>되었습니다.
          </h2>
          <h2 className={styles["header-date"]}>{today}</h2>
        </div>
      </div>

      <div className={styles["main-container"]}>
        <hr />
        <p className={styles["pay-title"]}>
          {userSpec.protegeUserName} <span className={styles.gender}>({userSpec.userGender === 1 ? '남성' : '여성'})</span>
        </p>
        <hr className={styles["dotted-hr"]} />
        <p>
          <span className={styles["pay-info-cate"]}>예약 항목</span>
          <span className={styles["pay-info-title"]}>{getProtegeName(userSpec.welfareNo)}</span>
        </p>
        <p>
          <span className={styles["pay-info-cate"]}>예약 날짜</span>
          <span className={styles["pay-info-title"]}>{userSpec.welfareBookStartDate}</span>
        </p>
        <p>
          <span className={styles["pay-info-cate"]}>예약 시간</span>
          <span className={styles["pay-info-title"]}>
          {displayTime(userSpec.welfareBookUseTime)}</span>
        </p>
        <hr />
        <p>
          <span className={styles["pay-info-tprice"]}>최종결제금액</span>
          <span className={styles["pay-info-price"]}>{formatPrice(calculatePrice(userSpec.welfareBookUseTime))} 원</span>
        </p>
      </div>
      <div className={`${styles["main-section"]} ${styles["go-main"]}`} onClick={goDetailReserved}>
        <p className={`${styles["main-text"]} ${styles["go-main-text"]}`}>예약내역 보러가기</p>
      </div>
    </div>
  );
}

export default WelfarePayCompl;
