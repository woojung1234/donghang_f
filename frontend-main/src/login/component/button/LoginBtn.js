import React from 'react';
import "./LoginBtn.css";
import LoginOptionModal from '../modal/LoginOptionModal';

function LoginBtn({isButtonDisabled}) {
    return (
        <div className="loginBtn-wrap">
            <LoginOptionModal/>
            <button type="submit" className={`loginBtn ${isButtonDisabled?'disabled':''}`}>로그인</button>
        </div>
    );
}

export default LoginBtn;