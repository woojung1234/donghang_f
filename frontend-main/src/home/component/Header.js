import logo from "image/logo.png";
import arrow from "image/icon/icon-arrow.png";
import alarmIcon from "image/icon-alarm.svg";
import "home/component/Header.css";
import { useEffect, useState } from "react";
import { call } from "login/service/ApiService";
import { useNavigate } from "react-router-dom";

function Header({isProtege}) {
    const [userName, setUserName] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const navi = useNavigate();

    const handleGoMypage = ()=>{
        navi('/mypage');
    };

    const handleGoAlarm = ()=>{
        navi('/alarm');
    };

    // 읽지 않은 알림 수 조회
    const fetchUnreadCount = () => {
        call('/api/v1/notifications', 'GET', { isRead: false })
            .then(response => {
                if (response.unreadCount !== undefined) {
                    setUnreadCount(response.unreadCount);
                } else if (Array.isArray(response.notifications)) {
                    const unread = response.notifications.filter(notification => !notification.isRead).length;
                    setUnreadCount(unread);
                } else {
                    setUnreadCount(0);
                }
            })
            .catch((error) => {
                console.error("읽지 않은 알림 수 조회 실패:", error);
                setUnreadCount(0);
            });
    };

    useEffect(()=>{
        // 사용자 이름 조회
        call('/api/v1/users',"GET",null)
            .then((response)=>setUserName(response.userName))
            .catch((error)=>console.log(error));
        
        // 읽지 않은 알림 수 조회
        fetchUnreadCount();
        
        // 주기적으로 알림 수 업데이트 (30초마다)
        const interval = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(interval);
    },[]);

    return (
        <div className={`home-header ${!isProtege ? 'home-blue' : ''}`}>
            <img src={logo} alt="logo" className="home-logo" />
            <div className="header-right">
                {/* 알림 버튼 */}
                <div className="alarm-container" onClick={handleGoAlarm}>
                    <img src={alarmIcon} alt="알림" className="alarm-icon" />
                    {unreadCount > 0 && (
                        <span className="alarm-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                </div>
                {/* 사용자 정보 */}
                <div className="user-info" onClick={handleGoMypage}>
                    <p className="home-name">{userName}님 </p>
                    <img src={arrow} alt= "화살표" className="home-arrow"/>
                </div>
            </div>
        </div>
    );
}

export default Header;