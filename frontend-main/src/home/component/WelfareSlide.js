import "home/component/WelfareSlide.css";
import slide01 from "image/home_img01.png";
import slide02 from "image/home-img02.png";
import { useNavigate } from "react-router-dom";

function WelfareSlide({isProtege}) {
  const navi = useNavigate();
  const handleGoWelfare = ()=>{
    navi('/welfare-list');
  };
    return (
    <div className="welfare-main-container"  >
      <div className="welfare-main-text">
        <p>문화, 일자리, 교육 및 맞춤 돌봄</p>
        <p>복지를 찾아줘, 똑똑!</p>
        <button className="welfare-main-button" onClick ={handleGoWelfare}>복지서비스 이용하기</button>
      </div>

      {isProtege?
      <img src={slide01} alt="복지서비스" className="slide" />:
      <img src={slide02} alt="복지서비스" className="slide" />}
    </div>
    );
}

export default WelfareSlide;