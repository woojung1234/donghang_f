import "alarm/component/AlarmMark.css";
import { call } from 'login/service/ApiService';

function AlarmMark({getAlarmList, fetchAlarmCount, alarmNum}) {
   

   

    const handleAlarmAllCheck=()=>{
        call('/api/v1/notification/allcheck',"PUT",null).then((response)=>{
            fetchAlarmCount();
            getAlarmList();
        }).catch((error)=>{
            console.log("모두 읽음 처리 실패");
        });
    };
    const isDisabled = alarmNum === 0; 


    return (
        <div className='alarmMark-container'>
            <p>읽지 않은 알람 <span className='alarmMarkNum'>{alarmNum}건</span></p>
            <p 
                className={`alarmMark-button ${isDisabled ? 'checked' : ''}`} 
                onClick={!isDisabled ? handleAlarmAllCheck : undefined} // 버튼이 비활성화일 때 클릭 이벤트 제거
            >
                모두 읽음
            </p>
        </div>
    );
}

export default AlarmMark;