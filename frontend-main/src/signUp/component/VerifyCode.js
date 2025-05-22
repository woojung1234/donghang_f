import { useEffect, useRef, useState } from 'react';

import { call } from 'login/service/ApiService';
import { Link, useNavigate } from 'react-router-dom';
import SignUpHeader from './header/SignUpHeader';
import { useMember } from 'signUp/SignUpMain';

function VerifyCode(props) {
    const navi = useNavigate();
    const [validation, setValidation] = useState("");
    const {userInfo,handlechange} = useMember();
    const [errorMessage, setErrorMessage]=useState("");
    const inputRef = useRef(null);


    useEffect(() => {
        inputRef.current.focus();
    }, []);


    const handleInputCode = (e) => {
        const value = e.target.value.slice(0, 6);
        setValidation(value);
        handlechange(e);
    };

    const handleNextClick = ()=>{
        call(`/api/v1/users/validation/number`,"POST",{validationNum:userInfo.validation,phone:userInfo.userPhone})
        .then((response)=>{
            if(response.result === true){
                navi("/signup/rolecheck")
            }else{
                setErrorMessage(response.message);
            }
            
        }).catch((error)=>{
            console.error("인증 실패.", error);
            setErrorMessage(error.message);
            setTimeout(()=>{
                navi("/signup/infoinput")
            },2000);
            
        });
        
    }
    const buttonClass = validation.length === 6 ? "signup-nextBtn" : "signup-nextBtn disabled";
    const squares = Array(6).fill(null);
    const handleSquareClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container" >
                <div className="square-container" onClick={handleSquareClick}>
                        {squares.map((_, index) => (
                            <div key={index} className='square'>{validation[index] || ''}</div>
                        ))}
                </div>
                <div className='error-message'>{errorMessage}</div>
                <input
                    ref={inputRef}
                    type="tel"
                    value={userInfo.validation}
                    onChange={handleInputCode}
                    className="hidden-input"
                    maxLength={6}
                    name='validation'
                    autoComplete="off" 
                    
                />
            </div>
            <div className="signUpBtn">
                <Link to="../infoinput" className="signup-backBtn">이전</Link>
                <button onClick={handleNextClick}
                    className={buttonClass} disabled={validation.length !== 6}>다음</button>
            </div>
        </div>
    );
}

export default VerifyCode;