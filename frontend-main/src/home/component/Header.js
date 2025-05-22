import logo from "image/logo.png";
import arrow from "image/icon/icon-arrow.png";
import "home/component/Header.css";
import { useEffect, useState } from "react";
import { call } from "login/service/ApiService";
import { useNavigate } from "react-router-dom";

function Header({isProtege}) {
    const [userName, setUserName] = useState('');
    const navi = useNavigate();

    const handleGoMypage = ()=>{
        navi('/mypage');
    };

    useEffect(()=>{
        call('/api/v1/users',"GET",null).then((response)=>setUserName(response.userName)).catch((error)=>console.log(error));
    },[]);

    return (
        <div className={`home-header ${!isProtege ? 'home-blue' : ''}`}>
            <img src={logo} alt="logo" className="home-logo" />
            <div onClick={handleGoMypage}>
                <p className="home-name">{userName}님 </p>
                <img src={arrow} alt= "화살표" className="home-arrow"/>
            </div>
        </div>
    );
}

export default Header;