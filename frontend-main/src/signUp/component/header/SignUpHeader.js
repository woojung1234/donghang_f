import React from 'react';
import { useLocation } from 'react-router-dom';
import "./SignUpHeader.css";

function SignUpHeader(props) {
    const location = useLocation();

      // 경로에 따라 제목을 설정하는 함수
      const getTitle = (pathname) => {
        switch (pathname) {
            case '/signup/register':
                return (
                    <>
                        <p>아이디와 비밀번호를</p>
                        <p>입력해 주세요</p> 
                    </>
                );
            case '/signup/infoinput':
                return (
                    <>
                        <p>이름과 전화번호를</p>
                        <p>입력해 주세요</p>
                    </>
                );
            case '/signup/verifycode':
                return (
                    <>
                        <p>문자로 전송된</p>
                        <p>인증번호 6자리를 입력해주세요</p> 
                    </>
                );
            case '/signup/rolecheck':
                return (
                    <>
                        <p>보호자인가요?</p>
                    </>
                );
            case '/signup/quickloginsetup':
                return (
                    <>
                         <p>빠른 로그인을 위해</p>
                         <p>간편한 방법을 설정하시겠어요?</p>
                    </>
                );
            case '/signup/pinsetup':
                return (
                    <>
                            <p>로그인에 사용할</p>
                            <p>간편비밀번호 6자리를 입력하세요</p>
                    </>
                );
            case '/signup/pincheck':
                return (
                    <>
                            <p>동일한 비밀번호를</p>
                            <p>한번 더 입력하세요</p>
                    </>
                );
            // => 추가 경로에 따라 제목 설정
            default:
                return '';
        }
    };

    return (
        <div className='header-container'>
            {getTitle(location.pathname)}
        </div>
    );
}

export default SignUpHeader;