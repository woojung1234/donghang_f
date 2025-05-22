import React, { useEffect, useRef, useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from 'signUp/SignUpMain';

function PinSetup(props) {
    const [pin,setPin] =useState("");
    const inputRef = useRef(null);
    const {handlechange} =useMember();
    const navi = useNavigate();

    useEffect(() => {
        inputRef.current.focus();
    }, []);

    const handleInputPin = (e) => {
        const value = e.target.value.slice(0, 6);
        setPin(value);
        handlechange(e);
    };
    const handleNextClick=()=>{
        navi("/signup/pincheck");
    }
    const handleCircleWrapClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    const buttonClass = pin.length === 6 ? "signup-nextBtn" : "signup-nextBtn disabled";
    const circles = Array(6).fill(null); 
    return (
        <div>
           <SignUpHeader/>
           <div className="signup-container">
                <div className="circle-wrap" onClick={handleCircleWrapClick}>
                    {circles.map((_, index) => (
                        <div key={index}  className={`small-circle ${pin.length > index ? 'filled' : ''}`}></div>
                    ))}
                </div>
                <input
                ref={inputRef}
                type="tel"
                value={pin}
                name='userSimplePassword'
                onChange={handleInputPin}
                className="hidden-input"
                style={{ 
                    opacity: 0, 
                    position: 'absolute', 
                    zIndex: -1 
                }}
                autoComplete="off" 
            />
            </div>
            <div className="signUpBtn">
                <Link to="../quickloginsetup" className="signup-backBtn">이전</Link>
                <button className={buttonClass} onClick={handleNextClick}> 다음</button>
            </div>
        </div>
    );
}

export default PinSetup; 