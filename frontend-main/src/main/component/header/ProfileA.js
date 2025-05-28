import { call } from 'login/service/ApiService';
import 'main/component/header/HeaderA.css';
import { useEffect, useState } from 'react';

function Profile(props) {
  const [userName, setUserName] = useState('');
  
  useEffect(()=>{
    const userNo = localStorage.getItem("userNo");
    if (userNo) {
      call('/api/v1/users','GET', userNo).then((response)=>{
        setUserName(response.userName || '사용자');
      }).catch((error)=>{
        console.log("사용자 정보 조회 실패:", error);
        setUserName('사용자');
      });
    }
  }, []);
  
  return (
    <div className="main-header">
      <div className="profile-info">
        <h2 className="profile-name"><a href="/mypage">{userName}님 ▶</a></h2>
      </div>
    </div>
  );
}

export default Profile;
