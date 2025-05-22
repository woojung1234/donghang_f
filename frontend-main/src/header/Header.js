import styles from 'header/Header.module.css'; // CSS 모듈 import
import back from "image/Back.png";
import home from "image/gohome.png";
import { useLocation, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginUserType = localStorage.getItem("loginUser");

  const getTitle = (pathname) => {
    switch (pathname) {
      case "/dolbom-main":
        return "복지 서비스 예약하기";
      case "/welfare-check-pw":
        return "결제하기";
      case "/welfare-check-spec":
        return "복지 서비스 예약하기";
      case "/welfare-list":
        return "복지 서비스 예약하기";
      case "/welfare-main":
        return "복지 서비스";
      case "/welfare-reserved-list":
        return "복지 서비스 예약내역";
      case "/welfare-set-pw":
        return "간편 결제 등록";
      case "/consume-report":
        return "소비리포트";
      case "/cardcreate":
      case "/cardapp/defaultinfo":
      case "/cardapp/extrainfo":
      case "/cardapp/agreement":
      case "/cardapp/creditinfo":
      case "/cardapp/fundsourceinfo":
      case "/cardapp/address":
      case "/cardapp/simplepw":
        return "카드신청";

      case "/mypage":
        return "마이페이지";
      case "/modifyinfo":
        return "마이페이지";
      case "/subinput":
        return "마이페이지";
      case "/consumption":
          return "카드내역";
      case "/alarm":
          return "이상 징후 알림 내역";

        case "/cardapp/familycardyn":
        return "가족카드 신청";
        case "/cardapp/fdefaultinfo":
        return "가족카드 신청";
        case "/cardapp/fextrainfo":
        return "가족카드 신청";
        case "/cardapp/faddress":
        return "가족카드 신청";
        case "/cardapp/fsimplepw":
        return "가족카드 신청";

      default:
        // 와일드카드 경로 처리
        if (pathname.startsWith('/welfare-input/')) {
          return '복지 서비스 예약하기';
        }
        return null;
    }
  };

  return (
    <header className={styles['white-header']}>
      <div className={styles["header-container"]}>
        <div className={styles["header-info"]}>
          <img
            src={back}
            alt="뒤로가기"
            className={styles["back-icon"]}
            onClick={() => navigate(-1)} // 뒤로가기 기능 추가
          />
          <p className={styles["header-name"]}>{getTitle(location.pathname)}</p>
          <img
            src={home}
            alt="홈 가기"
            className={styles["home-icon"]}
            onClick={() => navigate("/home")} // 홈으로 가기 기능 추가
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
