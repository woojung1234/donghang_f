import { call } from 'login/service/ApiService';
import 'main/component/header/HeaderA.css';
import { useEffect, useState } from 'react';

function Profile(props) {
  const [protectorName, setProtectorName] = useState('');
  const [protegeName, setProtegeName] = useState('');
  
  useEffect(()=>{
    // 사용자 정보 조회로 변경
    const userNo = localStorage.getItem("userNo");
    if (userNo) {
      call('/api/v1/users','GET', userNo).then((response)=>{
        setProtegeName(response.userName || '사용자');
        setProtectorName(''); // 보호자 기능 제거
      }).catch((error)=>{
        console.log("사용자 정보 조회 실패:", error);
        setProtegeName('사용자');
      });
    }
  }, []);
  return (
    <div className="main-header">
      <div className="profile-info">
        <h2 className="profile-name"><a href="/mypage">{protegeName}님(나중에 이름으로 변경) ▶</a></h2>
        <p className="profile-subtext">{protectorName}</p> 
      </div>
    </div>
  );
}

export default Profile;
