import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from 'signUp/SignUpMain';

function RoleCheck(props) {
    const {handlechange} = useMember();
    const navi = useNavigate();

    useEffect(() => {
        // 모든 사용자를 일반 사용자로 자동 설정
        handlechange({ target: { value: 'USER', name: 'userType' } });
        
        // 자동으로 다음 단계로 이동
        setTimeout(() => {
            navi("/signup/quickloginsetup");
        }, 100);
    }, [handlechange, navi]);

    return (
        <div>
            <div className="signup-container">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px' 
                }}>
                    <p>회원가입을 진행하고 있습니다...</p>
                </div>
            </div>
        </div>
    );
}

export default RoleCheck;