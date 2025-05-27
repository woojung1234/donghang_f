import "alarm/AlarmList.css";
import Header from 'header/Header';
import AlarmHistory from './component/AlarmHistory';
import AlarmMark from './component/AlarmMark';
import { useEffect, useState } from "react";
import { call } from "login/service/ApiService";


function AlarmList(props) {
    const [alarmList, setAlarmList] = useState([]);
    const [alarmNum, setAlarmNum] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'card', 'welfare', 'payment', 'system'

    // 알람 목록 조회
    useEffect(() => {
        getAlarmList();
        fetchAlarmCount();
    }, []);

    const getAlarmList = () => {
        setIsLoading(true);
        console.log("Fetching alarm list");
        call('/api/v1/notifications', "GET", null)
        .then(response => {
            console.log("Alarm response:", response);
            if (response.notifications) {
                setAlarmList(response.notifications);
            } else {
                setAlarmList(response);
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error("알람 조회 실패:", error);
            setIsLoading(false);
        });
    };

     // 알림 수를 가져오는 함수
     const fetchAlarmCount = () => {
        console.log("Fetching alarm count");
        call('/api/v1/notifications', 'GET', { isRead: false })
            .then(response => {
                console.log("Alarm count response:", response);
                if (response.total) {
                    setAlarmNum(response.total);
                } else if (response.unreadCount) {
                    setAlarmNum(response.unreadCount);
                } else {
                    // 배열인 경우 읽지 않은 알림 갯수 계산
                    const unreadCount = Array.isArray(response) 
                        ? response.filter(alarm => !alarm.isRead).length
                        : 0;
                    setAlarmNum(unreadCount);
                }
            })
            .catch((error) => {
                console.error("알람 건수 조회 실패:", error);
            });
    };

    // 알림 필터링 함수
    const filterAlarms = (type) => {
        setFilter(type);
    };

    // 필터링된 알림 목록
    const filteredAlarms = alarmList.filter(alarm => {
        if (filter === 'all') return true;
        return alarm.notificationType?.toLowerCase() === filter.toLowerCase();
    });

    return (
        <div className='alarmList-container'>
            <Header/>
            <AlarmMark alarmNum={alarmNum} fetchAlarmCount={fetchAlarmCount} getAlarmList={getAlarmList}/>
            
            <div className="filter-container">
                <button 
                    className={`filter-button ${filter === 'all' ? 'active' : ''}`} 
                    onClick={() => filterAlarms('all')}>
                    전체
                </button>
                <button 
                    className={`filter-button ${filter === 'card' ? 'active' : ''}`} 
                    onClick={() => filterAlarms('card')}>
                    카드
                </button>
                <button 
                    className={`filter-button ${filter === 'payment' ? 'active' : ''}`} 
                    onClick={() => filterAlarms('payment')}>
                    결제
                </button>
                <button 
                    className={`filter-button ${filter === 'welfare' ? 'active' : ''}`} 
                    onClick={() => filterAlarms('welfare')}>
                    복지
                </button>
                <button 
                    className={`filter-button ${filter === 'system' ? 'active' : ''}`} 
                    onClick={() => filterAlarms('system')}>
                    시스템
                </button>
            </div>
            
            {isLoading ? (
                <div className="loading-container">
                    <p>알림을 불러오는 중...</p>
                </div>
            ) : (
                <AlarmHistory 
                    fetchAlarmCount={fetchAlarmCount} 
                    alarmList={filteredAlarms} 
                    getAlarmList={getAlarmList}
                />
            )}
        </div>
    );
}

export default AlarmList;