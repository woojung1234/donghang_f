import React, { useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import yes from 'image/yes.png';
import no from 'image/no.png';
import { useMember } from 'signUp/SignUpMain';

function RoleCheck(props) {
    const [role, setRole] = useState('');
    const {userInfo, handlechange} =useMember();
    const navi = useNavigate();

    const handleAgreeClick = () => {
        setRole('PROTECTOR')
        handlechange({ target: { value: 'PROTECTOR', name: 'userType' } });
    };
    const handleDisagreeClick = () => {
        setRole('PROTEGE');
        handlechange({ target: { value: 'PROTEGE', name: 'userType' } });

    };
    const handleNextClick = () => {
        if (role) {
            navi("/signup/quickloginsetup");
        }
    };
    const buttonClass = role ? "signup-nextBtn" : "signup-nextBtn disabled";
    return (
        <div>
            <SignUpHeader/>
            <div className="signup-container">
                <div className='signup-rolecheck'>
                    <div className={`signup-role ${role === 'PROTECTOR' ? 'selected-role-blue' : ''}`} onClick={handleAgreeClick}>
                        <img src={yes} alt="보호자동의버튼" className="icon-yes" />
                        <p>맞습니다</p>
                    </div>
                    <div className={`signup-role ${role === 'PROTEGE' ? 'selected-role-red' : ''}`} onClick={handleDisagreeClick}>
                        <img src={no} alt="보호자비동의버튼" className="icon-no" />
                        <p>아닙니다</p>
                    </div>
                </div>
            </div>

            <input type="hidden" value={userInfo.userType} onChange={handlechange} name='userType' />
            <div className="signUpBtn">
                <Link to="../verifycode" className="signup-backBtn">이전</Link>
                <button onClick={handleNextClick}
                    className={buttonClass} disabled={!role}>다음</button>
            </div>
        </div>
    );
}

export default RoleCheck;