import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginBtn from './component/button/LoginBtn';
import LoginHeader from './component/header/LoginHeader';
import "./Login.css";
import { call } from './service/ApiService';
import { CommonContext } from '../App';

function LoginId(props) {
    const ACCESS_TOKEN = "ACCESS_TOKEN";
    const [userId, setUserId] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const[idErrorMessage, setIdErrorMessage] = useState('');
    const[pwErrorMessage, setPwErrorMessage] = useState('');
    const [isUserIdError, setIsUserIdError] = useState(false);
    const [isUserPwError, setIsUserPwError] = useState(false);
    const { setLoginUser } = useContext(CommonContext);

    const navi = useNavigate();

    const handleGoSignUp = () =>{
        navi("/signup/register")
    }
    
    const handleSubmit = (event) => {
        event.preventDefault(); //default이벤트 취소
        const data = new FormData(event.target);
        const userId = data.get("userId");
        const userPassword = data.get("userPassword");
        console.log({ userId: userId, userPassword: userPassword });
        setIdErrorMessage('');
        setPwErrorMessage('');
        setIsUserIdError(false);
        setIsUserPwError(false);

        localStorage.setItem(ACCESS_TOKEN, '');
        

        call("/api/v1/auth/login/normal", "POST", { userId: userId, userPassword: userPassword }).then((response)=>{
            if (response.accessToken) {
              console.log("로그인 성공:", response);
            
              // 로컬 스토리지에 토큰 저장
              localStorage.setItem("loginUser", "USER"); // Always set to USER
              localStorage.setItem("userNo", response.userNo);
              localStorage.setItem(ACCESS_TOKEN, response.accessToken);
              
              // Context 상태 업데이트
              setLoginUser({
                userType: "USER",
                userNo: response.userNo
              });

              // 모든 사용자는 홈으로 리다이렉트
              // window.location.href = '/home'; // 페이지 새로고침 방식
              navi('/home');
          } 
          }).catch(
            (error)=>{
                console.error("로그인 오류:", error);
                
                if(error.message==='아이디가 존재하지 않습니다.'){
                    setIdErrorMessage(error.message);
                    setIsUserIdError(true);
                    
                }else if('비밀번호가 일치하지 않습니다.'){
                    setPwErrorMessage(error.message);
                    setIsUserPwError(true);
                }else{
                    alert("로그인 실패");
                }
              
         });

      };

    const isButtonDisabled = !userId || !userPassword;

    return (
        <div className='login-container-wrap'>
            <LoginHeader/>
            <form noValidate onSubmit={handleSubmit}>
                <div className="login-container">
                    <input className={`login-input ${isUserIdError?'login-input-error':''}`} type="text"  value={userId} name='userId' placeholder="아이디" onChange={(e) => setUserId(e.target.value)}/>
                    <div className='check-input'>{idErrorMessage}</div>
                    <input className={`login-input ${isUserPwError?'login-input-error':''}`} type="password" value={userPassword} name='userPassword' placeholder="비밀번호" onChange={(e) => setUserPassword(e.target.value)}/>
                    <div className='check-input'>{pwErrorMessage}</div>
               
                    <div className="login-options">
                        <p className='border-separator'>아이디 찾기</p>
                        <p className='border-separator'>비밀번호 찾기</p>
                        <p onClick={handleGoSignUp}>회원가입</p>
                    </div>
                    
                </div>
                <div className='agreement-text'>
                    <p>'금복이'는 JBNU SW 경진대회를 위해 </p>
                    <p>제작된 애플리케이션입니다. 프로젝트 외의 용도로 </p>
                    <p>사용자의 개인정보를 수집하거나 이용하지 않습니다.</p>
                </div>
                
                
                <LoginBtn isButtonDisabled={isButtonDisabled}/>
            </form>
        </div>
    );
}
export default LoginId;