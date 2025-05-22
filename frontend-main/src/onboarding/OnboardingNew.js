import { call } from "login/service/ApiService";
import "onboarding/OnboardingNew.css";
import { useNavigate } from "react-router-dom";

function OnboardingNew(props) {
  const navi = useNavigate();
  const handleMatchCheck = () => {
    call("/api/v1/match", "GET", null)
        .then((response) => {
            if (response.matchStatus === "ACCEPT") {
                navi('/home');
            } else {
                navi('/match');
            }
        })
        .catch((error) => {
            if (error.matchStatus === null) {
                navi('/match');
            } else {
                console.log(error);
                alert("실패");
            }
        });
};

  const handleBtnClick = () => {
    const ACCESS_TOKEN = localStorage.getItem("ACCESS_TOKEN");
    const loginUser = localStorage.getItem("loginUser");
    if (ACCESS_TOKEN) {
      if (loginUser === "PROTECTOR") {
        handleMatchCheck();
      } else {
        navi('/home');
      }
    } else {
      navi("/loginid");
    }
  };
  return (
    <div className="onboarding-container">
      <span className="onboarding-text">고령자를 위한<br/>금융 복지 지원 플랫폼</span>
      <div className="startBtn-wrap">
        <button className="startBtn" onClick={handleBtnClick}>
          시작
        </button>
      </div>
    </div>
  );
}

export default OnboardingNew;
