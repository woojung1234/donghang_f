import 'main/component/header/HeaderA.css';
import LogoNav from "main/component/header/LogoNav";
import ProfileA from "main/component/header/ProfileA";

function Header(props) {
  return (
    <div className="white-back">
      <div className="top-nav">
        <LogoNav />
        <ProfileA />
      </div>
    </div>
  );
}

export default Header;
