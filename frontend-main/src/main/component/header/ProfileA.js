import { call } from 'login/service/ApiService';
import 'main/component/header/HeaderA.css';
import { useEffect, useState } from 'react';

function Profile(props) {
  const [protectorName, setProtectorName] = useState('');
  const [protegeName, setProtegeName] = useState('');
  
  useEffect(()=>{
    call('/api/v1/match','GET',null).then((response)=>{
      if(response.matchStatus !== null)
      setProtectorName(response.matchProtectorName);
      setProtegeName(response.matchProtegeName);
    }).catch((error)=>{

    });
  });
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
