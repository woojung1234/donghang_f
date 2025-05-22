import Button from "home/component/Button";
import Header from "home/component/Header";
import WelfareSlide from "home/component/WelfareSlide";
import "home/MainPage.css";
import { useEffect, useState } from "react";

function MainPage() {
  const [isProtege, setIsProtege] = useState(true);

  useEffect(() => {
    const userType = localStorage.getItem("loginUser");
    
    if (userType === "PROTEGE") {
      setIsProtege(true);
    } else {
      setIsProtege(false);
    }
  }, []);

  return (
    <div className="main-container">
      <Header isProtege={isProtege} />
      <WelfareSlide isProtege={isProtege}/>
      <Button isProtege={isProtege} />
    </div>
  );
}

export default MainPage;
