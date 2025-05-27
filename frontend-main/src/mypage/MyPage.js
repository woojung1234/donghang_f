// import { CommonContext } from 'App3'; // 제거된 컨텍스트
import Header from 'header/Header';
import React, { useContext, useEffect, useState } from 'react';
import MyBasicInfo from './component/MyBasicInfo';
import ProfileEdit from './component/ProfileEdit';

import "mypage/MyPage.css"
import DisconnectionModal from './component/modal/DisconnectionModal';
import { call } from 'login/service/ApiService';
import { useNavigate } from 'react-router-dom';
import { CommonContext } from '../App';
// import MyMatchingInfo from './component/MyMatchingInfo'; // 제거된 매칭 기능



function MyPage(props) {

    const { setLoginUser } = useContext(CommonContext); // 컨텍스트 사용
    const loginUserType = localStorage.getItem("loginUser");
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const navi = useNavigate();

    useEffect(() => {
        call('/api/v1/users', 'GET', null)
            .then(response => {
                console.log('MyPage - 조회된 사용자 정보:', response);
                setUserInfo(response);
            })
            .catch(error => {
                console.error("MyPage - 회원 정보 조회 오류", error);
                setError("회원 정보를 불러오는 데 문제가 발생했습니다.");
            });
    }, []);

    const handleLogoutClick = () => {
        call('/api/v1/auth/logout', "POST", null)
        .then(() => {
            // 로컬 스토리지에서 모든 인증 정보 삭제
            localStorage.removeItem('ACCESS_TOKEN');  
            localStorage.removeItem('loginUser');
            localStorage.removeItem('userNo');
            
            // Context 상태 초기화
            setLoginUser({});
            
            console.log("로그아웃 성공");
            
            // 로그인 페이지로 리다이렉트
            navi("/loginid");
        })
        .catch((error) => {
            console.log("로그아웃 실패", error);
            
            // 오류가 발생해도 로컬 정보는 삭제하고 로그인 페이지로 이동
            localStorage.removeItem('ACCESS_TOKEN');  
            localStorage.removeItem('loginUser');
            localStorage.removeItem('userNo');
            setLoginUser({});
            navi("/loginid");
        });
    }

    const handleEditProfile = () => {
        console.log('MyPage - 프로필 수정 모드 진입');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        console.log('MyPage - 프로필 수정 취소');
        setIsEditing(false);
    };

    const handleUpdateProfile = (updatedUserInfo) => {
        console.log('MyPage - 프로필 업데이트 완료:', updatedUserInfo);
        setUserInfo(updatedUserInfo);
        setIsEditing(false);
    };

    return (
        <div className='mypage-container'>
            <Header/>
            {error && <p className='error-message'>{error}</p>}
            <p className='mypage-name'>{userInfo.userName}</p>
            {isEditing ? (
                <ProfileEdit 
                    userInfo={userInfo} 
                    onUpdate={handleUpdateProfile}
                    onCancel={handleCancelEdit}
                />
            ) : (
                <>
                    <MyBasicInfo userInfo={userInfo}/>
                    <div className='profile-edit-btn'>
                        <button onClick={handleEditProfile} className='edit-profile-btn'>
                            프로필 수정
                        </button>
                    </div>
                </>
            )}

            {/* <MyMatchingInfo loginUser={loginUser}/> 매칭 기능 제거됨 */}
            <div className='mypage-bottom'>
                <p className='logoutBtn' onClick={handleLogoutClick}>로그아웃</p>
                <p className='withdrawalBtn'>회원탈퇴</p>
            </div>
            
        </div>
    );
}

export default MyPage;