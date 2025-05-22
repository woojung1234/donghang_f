import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignUpHeader from './header/SignUpHeader';
import { useMember } from '../SignUpMain';
import { call } from 'login/service/ApiService';

function Register(props) {
    const {userInfo, handlechange} = useMember();
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const [userIdError, setUserIdError] = useState('');
    const [userPasswordError, setUserPasswordError] = useState('');
    const [isPasswordMismatch, setIsPasswordMismatch] = useState(false); // 비밀번호 불일치 상태 추가
    const navi = useNavigate();

    useEffect(() => {
        const { userId, userPassword, userPwCheck } = userInfo;

        const userIdValid = userId && userId.length >= 4 && userId.length <= 16;
        const passwordValid = userPassword && userPassword.length >= 8 && userPassword.length <= 16;
        const pwCheckValid = userPwCheck && userPwCheck.length >= 8 && userPwCheck.length <= 16;

        const userIdErrorMsg = userId? (userIdValid ? '' : '아이디는 4자 이상 16자 이하로 입력해주세요.'): '';
        setUserIdError(userIdErrorMsg);

        const userPasswordErrorMsg = userPassword ? (passwordValid ? '' : '비밀번호는 8자 이상 16자 이하로 입력해주세요.') : '';
        setUserPasswordError(userPasswordErrorMsg);

        const isMismatch = userPwCheck && userPassword && userPassword !== userPwCheck;
        setIsPasswordMismatch(isMismatch);

        const isValid = userIdValid && passwordValid && pwCheckValid && !isMismatch;
        setIsNextEnabled(isValid);

    }, [userInfo]);

    
      
    const handleSubmit = (e) => {
        if (!isNextEnabled) {
            e.preventDefault();
            return;
        }

        call(`/api/v1/users/validation/${userInfo.userId}`, "GET", null).then(
            (response) => {
                if (response.result === true) {
                    navi("/signup/infoinput");
                } else {
                    if(response.message === "이미 사용중인 아이디입니다."){
                        setUserIdError(response.message);
                    }else{
                        setUserIdError("중복체크 실패");
                    }
                    
                }
            }
        ).catch(()=>{
            setUserIdError("중복체크 실패");
        });
    };

    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container">
                <input 
                onChange={handlechange}
                 className={`signup-input ${userIdError ? 'signup-input-error' : ''}`} 
                 type="text" name="userId" 
                 value={userInfo.userId} 
                 placeholder="아이디(4 ~ 16자리 이내)" />
                <div className={'check-input'}>{userIdError}</div>
                <input onChange={handlechange}  className={`signup-input ${userPasswordError ? 'signup-input-error' : ''}`}  type="password" name="userPassword" value={userInfo.userPassword} placeholder="비밀번호(8 ~ 16자리 이내)" />
                <div className='check-input check-userpw'>{userPasswordError}</div>
                <input 
                    onChange={handlechange} 
                    className={`signup-input ${isPasswordMismatch ? 'signup-input-error' : ''}`} 
                    type="password" 
                    name="userPwCheck" 
                    value={userInfo.userPwCheck} 
                    placeholder="비밀번호 확인" 
                />

                <div className='check-input check-userpwCheck'></div>
            </div>
            {/* 비밀번호가 일치하지 않으면 오류 메시지 표시 */}
            <p className='pw-check-error-message' style={{ display: isPasswordMismatch ? 'block' : 'none' }}>
                비밀번호가 다릅니다.
            </p>
            <div className="signUpBtn">
                <Link to="/loginid" className="signup-backBtn">이전</Link>
                <button className={`signup-nextBtn ${isNextEnabled ? '' : 'disabled'}`} onClick={handleSubmit} disabled={!isNextEnabled}>
                    다음
                </button>
            </div>
        </div>
    );
}

export default Register;
