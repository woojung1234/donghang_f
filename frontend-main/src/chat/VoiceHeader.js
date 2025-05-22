import styles from "chat/Header.module.css";
import back from "image/Back.png";
import home from "image/gohome.png";
import { useLocation, useNavigate } from "react-router-dom";

function VoiceHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = (pathname) => {
    switch (pathname) {
      case "/voicechat":
        return "똑똑이";

      default:
        return null;
    }
  };

  return (
    <header>
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

export default VoiceHeader;
