import React from 'react';
import logo from "image/logo.svg";
import "onboarding/OnboardingPage.css"
import { useNavigate } from 'react-router-dom';

function OnboardingPage(props) {
    const navi =useNavigate();
    const handleBtnClick =()=>{
        const ACCESS_TOKEN = localStorage.getItem("ACCESS_TOKEN");
        if(ACCESS_TOKEN){
            navi("/home");
        }else{
            navi("/loginid");
        }
        
    };
    return (
        <div className='onboarding-container'>
            <img src={logo} alt='로고' className='onboarding-logo'/>
            <div className='startBtn-wrap'>
                <button className='startBtn' onClick={handleBtnClick}>시작</button>
            </div>
            
        </div>
    );
}

export default OnboardingPage;