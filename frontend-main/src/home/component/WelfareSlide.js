import "home/component/WelfareSlide.css";
import slide01 from "image/home_img01.png";
import slide02 from "image/home-img02.png";
import { useNavigate } from "react-router-dom";

function WelfareSlide({isProtege}) {
  const navi = useNavigate();
  
  const handleGoWelfare = ()=>{
    navi('/welfare-list');
  };

  const handleGoWelfareReservation = ()=>{
    navi('/welfare-reserved-list');
  };
    return (
    <div className="welfare-main-container"  >
      <div className="welfare-main-text">
        <p>문화, 일자리, 교육 및 맞춤 돌봄</p>
        <p>복지를 찾아줘, 금복이!</p>
        <div className="welfare-button-container">
          <button className="welfare-main-button" onClick={handleGoWelfare}>복지서비스 찾기</button>
          <button className="welfare-reservation-button" onClick={handleGoWelfareReservation}>복지 서비스 예약 현황</button>
        </div>
      </div>

      {isProtege?
      <img src={slide01} alt="복지서비스" className="slide" />:
      <img src={slide02} alt="복지서비스" className="slide" />}
    </div>
    );
}

export default WelfareSlide;