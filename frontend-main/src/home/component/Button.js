import 'home/component/Button.css';
import chatbot from "image/icon/icon-chat.png";
import alarm from "image/payAlarm.png";
import { call } from 'login/service/ApiService';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

function Button({isProtege}) {
    const navi = useNavigate();
    const [alarmNum, setAlarmNum] = useState('');
    const [talkTime, setTalkTime] = useState('');
    const [protegeName, setProteName] = useState('');

    // 페이지 이동
    const handleButtonClick = ()=>{
        if(isProtege){
            navi('/voicechat');
        }else {
            navi('/alarm')
        };
    }; 

    const detailDate = (dateStr) => {
      
      const now = new Date();;
      const date = new Date(dateStr);
      const milliSeconds = now - date;
      const seconds = milliSeconds / 1000;
      if (seconds < 60) return `방금 전`;
      const minutes = seconds / 60;
      if (minutes < 60) return `${Math.floor(minutes)}분 전`;
      const hours = minutes / 60;
      if (hours < 24) return `${Math.floor(hours)}시간 전`;
      const days = hours / 24;
      if (days < 7) return `${Math.floor(days)}일 전`;
      const weeks = days / 7;
      if (weeks < 5) return `${Math.floor(weeks)}주 전`;
      const months = days / 30;
      if (months < 12) return `${Math.floor(months)}개월 전`;
      const years = days / 365;
      return `${Math.floor(years)}년 전`;
  };

    useEffect(()=>{
      if(isProtege===false){
        //알람 건수
      call('/api/v1/notification/read/count',"GET",null).then((response)=>{
        setAlarmNum(response.toString());
      }).catch((error)=>{
        console.log("알람 건수 조회 실패");
      });
      }else{
         //마지막 대화 시간 조회
      call('/api/v1/conversation-room/last-conversation-time',"GET",null).then((response)=>{
        setTalkTime(response.conversationEndAt ? detailDate(response.conversationEndAt) : '없음');
      }).catch((error)=>{
        console.log("마지막 대화 시간 조회 실패");
      });
      }
      
    },[isProtege]);
    useEffect(()=>{
      call('/api/v1/match',"GET",null).then((response)=>{
        setProteName(response.protegeUserName);
      }).catch((error)=>{
        console.log(error);
      });
    });

    return (
      <div className={`chat-section-container ${!isProtege ? 'blue-main' : ''}`} onClick={handleButtonClick}>
        <div className="chat-section-button">
          {isProtege ? <img src={chatbot} alt="챗봇" className="icon-chat" />:<img src={alarm} alt="이상징후" className="icon-alarm" />}
          <div className="chat-section-text">
            <p className="head-text">{isProtege?"똑똑이와 대화해보세요": `${protegeName}님의 소비이상징후`}</p>
            <p className="info-text">{isProtege?"마지막 대화시간 : ":"읽지 않은 알람 : "}<span>{isProtege? talkTime : `${alarmNum}건`}</span></p>
          </div>
        </div>
      </div>
    );
}

export default Button;