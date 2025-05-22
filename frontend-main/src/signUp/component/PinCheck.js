import React, { useEffect, useRef, useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from 'signUp/SignUpMain';

function PinCheck(props) {
    const [pin,setPin] =useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const inputRef = useRef(null);
    const {userInfo} = useMember();
    const navi = useNavigate();
    
    useEffect(() => {
        inputRef.current.focus();
    }, []);

    const handleChangePinCheck = (e) => {
        const value = e.target.value.slice(0, 6);
        setPin(value);
    };
    const handleSumitClick =()=>{
        console.log(userInfo.pin);
        console.log(pin);
        if(userInfo.userSimplePassword===pin){
            navi("/signup/quickloginsetup");
        }else{
            setErrorMessage("비밀번호가 다릅니다");
            setPin('');
            inputRef.current.focus();
        }
    }
    const buttonClass = pin.length === 6 ? "signup-nextBtn" : "signup-nextBtn disabled";
    const circles = Array(6).fill(null); 
    const handleCircleWrapClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container">
                
                <div className="circle-wrap" onClick={handleCircleWrapClick}>
                    {circles.map((_, index) => (
                        <div key={index}  className={`small-circle ${pin.length > index ? 'filled' : ''}`}></div>
                    ))}
                </div>
                <div className='error-message'>{errorMessage}</div>
                <input
                ref={inputRef}
                type="tel"
                value={pin}
                name='userpinchk'
                onChange={handleChangePinCheck}
                className="hidden-input"
                style={{ 
                    opacity: 0, 
                    position: 'absolute', 
                    zIndex: -1, 
                }}
                autoComplete="off" 
            />
            </div>
            <div className="signUpBtn">
                <Link to="../pinsetup" className="signup-backBtn">이전</Link>
                <button className={buttonClass} onClick={handleSumitClick}>다음</button>
            </div>
        </div>
    );
}

export default PinCheck;