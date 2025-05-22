import React, { useEffect, useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import loginCheck from 'image/icon/small-check.svg';
import { useMember } from 'signUp/SignUpMain';
import { call } from 'login/service/ApiService';

function QuickLoginSetup(props) {
    const [isPinChecked, setIsPinChecked] = useState(false);
    const [isBioChecked, setIsBioChecked] = useState(false);
    const [isSecurityKeyChecked, setIsSecurityKeyChecked] = useState(false);
    const [isPasskeyChecked, setIsPasskeyChecked] = useState(false);
    const { userInfo, setUserInfo } = useMember();
    const navi = useNavigate();
    useEffect(() => {
        if (userInfo.userSimplePassword) {
            setIsPinChecked(true);
        } else {
            setIsPinChecked(false);
        }
    }, [userInfo.userSimplePassword]);

    useEffect(() => {
         if(userInfo.isBioLogin){
            setIsBioChecked(true);
         }else{
            setIsBioChecked(false);
         }
       
     }, [userInfo.isBioLogin]);


    const handlePinCircleClick = () => {
        if (isPinChecked) {
            setUserInfo(prevState => ({
                ...prevState,
                userSimplePassword: ''
            }));
        }else{
            console.log(userInfo);
            setIsPinChecked(!isPinChecked);    
            navi("/signup/pinsetup");
        }
        
    };

    // 생체 인증을 처리하는 함수
    const handleBiometricAuth = async () => {
    if(!isBioChecked){
        if (!navigator.credentials) {
            console.error('This browser does not support the Web Authentication API');
            return;
        }
    
        try {
            const publicKey = {
                challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                rp: {
                    name: "Example Corp"
                },
                user: {
                    id: new Uint8Array(16), // 사용자 ID를 바이트 배열로 변환
                    name: "user@example.com",
                    displayName: "User Name"
                },
                pubKeyCredParams: [
                    {
                        type: "public-key",
                        alg: -7 // ECDSA with SHA-256
                    }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // 'platform'은 내장된 인증기(디바이스)를 의미
                    userVerification: "required" // 사용자 검증을 필수로 요구
                },
                timeout: 60000,
                attestation: "direct"
            };
            const credential = await navigator.credentials.create({ publicKey });
            console.log('Biometric authentication successful:', credential);
            setIsBioChecked(true);
            setUserInfo({ ...userInfo, isBioLogin: true });
            
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            setIsBioChecked(false);
            setUserInfo({ ...userInfo, isBioLogin: false });
        }
    }else{
        setIsBioChecked(false);
        setUserInfo({ ...userInfo, isBioLogin: false });
    }

    };
    

    // 패스키 인증을 처리하는 함수
    const handlePasskeyAuth = async () => {
        try {
            const publicKey = {
                challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                // other parameters for passkey...
            };
            const credential = await navigator.credentials.create({ publicKey });
            console.log('Passkey authentication successful:', credential);
            setIsPasskeyChecked(true);
            setUserInfo({ ...userInfo, isBioLogin: isBioChecked });
        } catch (error) {
            console.error('Passkey authentication failed:', error);
            setIsPasskeyChecked(false);
            setUserInfo({ ...userInfo, isBioLogin: isBioChecked });
        }
    };
    

    const handleSubmit = () => {
        setUserInfo({ ...userInfo, isBioLogin: isBioChecked });
        call('/api/v1/users/signup', "POST", userInfo).then((response) => {
            localStorage.setItem("userBioPassword", response.userBioPassword);
            navi("/signup/signupsuccess");
        }).catch((error) => {
            console.error("Registration error:", error);
            alert("Registration failed. Please try again.");
            navi("/signup/register");
        });
    };

    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container">
                <div className='signup-quickLogin'>
                    <p className='quickLogin-title'>간편 비밀번호</p>
                    <div className='quickLogin-content' onClick={handlePinCircleClick}>
                        <p>비밀번호 6자리로 로그인 합니다</p>
                        <div className='icon-check'>
                            <img src={loginCheck} alt="간편로그인설정" className="checkLogin" />
                            <div 
                                className={`icon-circle ${isPinChecked ? 'checkedLogin' : ''}`} 
                            />
                        </div>
                    </div>
                </div>
                <div className='signup-quickLogin'>
                    <p className='quickLogin-title'>생체 인증</p>
                    <div className='quickLogin-content' onClick={handleBiometricAuth}> {/* 생체 인증 함수 호출 */}
                        <p>등록된 생체 정보로 로그인 합니다</p>
                        <div className='icon-check'>
                            <img src={loginCheck} alt="간편로그인설정" className="checkLogin" />
                            <div 
                                className={`icon-circle ${isBioChecked ? 'checkedLogin' : ''}`} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="signUpBtn">
                <Link to="../rolecheck" className="signup-backBtn">이전</Link>
                <button className="signup-nextBtn" onClick={handleSubmit}>저장</button>
            </div>
        </div>
    );
}

export default QuickLoginSetup;
