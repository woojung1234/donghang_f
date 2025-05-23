import Button from "home/component/Button";
import Header from "home/component/Header";
import WelfareSlide from "home/component/WelfareSlide";
import "home/MainPage.css";
import { useEffect, useState } from "react";
import VoiceButton from "home/component/VoiceButton"; // 음성입력 버튼 컴포넌트 추가

function MainPage() {
  const [isProtege, setIsProtege] = useState(true);

  useEffect(() => {
    const userType = localStorage.getItem("loginUser");
    
    // 모든 사용자가 USER 타입이므로 항상 true로 설정
    setIsProtege(true);
  }, []);

  return (
    <div className="main-container">
      <Header isProtege={isProtege} />
      <WelfareSlide isProtege={isProtege}/>
      <Button isProtege={isProtege} />
      {/* 음성입력 버튼 추가 */}
      <VoiceButton />
    </div>
  );
}

export default MainPage;