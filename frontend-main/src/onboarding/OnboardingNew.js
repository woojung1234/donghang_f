import { call } from "login/service/ApiService";
import "onboarding/OnboardingNew.css";
import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";

function OnboardingNew(props) {
  const navi = useNavigate();

  // 페이지 로드 시 자동으로 로그인 상태 확인
  useEffect(() => {
    const ACCESS_TOKEN = localStorage.getItem("ACCESS_TOKEN");
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!ACCESS_TOKEN) {
      navi("/loginid");
    } else {
      // 로그인된 경우 사용자 유형에 따라 적절한 페이지로 리다이렉트
      const loginUser = localStorage.getItem("loginUser");
      if (loginUser === "PROTECTOR") {
        handleMatchCheck();
      } else {
        navi('/home');
      }
    }
  }, [navi]); // navi를 의존성 배열에 추가

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