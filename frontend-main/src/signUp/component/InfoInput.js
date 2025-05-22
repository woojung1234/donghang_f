import React, { useEffect, useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '../SignUpMain';
import { call } from 'login/service/ApiService';

function InfoInput(props) {
    const navi = useNavigate();
    const {userInfo,handlechange} =useMember();
    const [errorMessage, setErrorMessage] = useState('');
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const [isUserPhoneError, setIsUserPhoneError] = useState(false);

    useEffect(() => {
        const { userName, userPhone} = userInfo;
        const isValid = userName && userPhone;
        setIsNextEnabled(isValid);
    }, [userInfo]);

    const formatPhoneNumber = (value) => {
        return value
            .replace(/[^0-9]/g, '')  // 숫자만 남기기
            .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); // 하이픈 추가
    };

    const handlePhoneChange = (event) => {
        const { name, value } = event.target;

        if (name === 'userPhone') {
            const formattedValue = formatPhoneNumber(value);
            event.target.value = formattedValue;

            // 하이픈 제거한 값으로 상태 업데이트
            const cleanedValue = formattedValue.replace(/[^0-9]/g, '');
            handlechange({
                target: {
                    name: name,
                    value: cleanedValue
                }
            });
        } else {
            handlechange(event);
        }
    };
    const handleNextClick = () => {
        if (isNextEnabled) {

           
                call('/api/v1/users/validation/phone',"POST",
                    {phone:userInfo.userPhone}
                ).then((response)=>{
                    console.log(response);
                    navi("/signup/verifycode");
                }).catch((error)=>{
                    console.error("전화번호 인증에 실패했습니다.", error);
                    setErrorMessage("전화번호 인증에 실패했습니다.");
                    setIsUserPhoneError(true);
                });
          
            
                
        }
    };

    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container">
                <input onChange={handlechange} className="signup-input" type="text" name='userName' value={userInfo.userName||""} placeholder="이름"/>
                <div className='check-input check-username'></div>
                <input onChange={handlePhoneChange} className={`signup-input ${isUserPhoneError?'signup-input-error':''}`} type="tel" name='userPhone' value={formatPhoneNumber(userInfo.userPhone || "")} placeholder="전화번호" maxLength={13}/>
                <div className='check-input check-userphone'>{errorMessage}</div> 
            </div>
            <div className="signUpBtn">
                <Link to="../register" className="signup-backBtn">이전</Link>
                <button
                    onClick={handleNextClick}
                    className={`signup-nextBtn ${isNextEnabled ? '' : 'disabled'}`}
                    disabled={!isNextEnabled}
                >
                다음
                </button>
            </div>
        </div>
    );
}

export default InfoInput;