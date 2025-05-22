import { CommonContext } from "App3";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MyExtraInfoContent from "./MyExtraInfoContent";
import info from "image/icon/info.png";

function MyExtraInfo({userInfo}) {
    const [isExtraInfo, setIsExtraInfo] = useState(true);

    const navi = useNavigate();
    const handleModifyClick=()=>{
        navi("/modifyinfo");
    }
    const {loginUser} = useContext(CommonContext);
    const getSubstituteBtn = (userType)=>{
        if(isExtraInfo===false){
            switch(userType){
                case 'PROTECTOR':
                    return <button className='substituteBtn' onClick={handleModifyClick}>어르신 정보 대신 입력하기</button>;
                default:
                    return <button className='substituteBtn orangeBtn' onClick={handleModifyClick}>정보 입력하러 가기</button>;
            }
        }
    };
    
    useEffect(()=>{
        if(userInfo.protegeAddress === null 
            && userInfo.protegeBirth === null 
            && userInfo.protegeDisease === null
            && userInfo.protegeGender === 0
            && userInfo.protegeHeight === 0
            && userInfo.protegeWeight === 0){
            setIsExtraInfo(false);
        };
    },[userInfo]);

    return (
        <div className='info-container'>
            <div className='info-title'>
                <p><span className="info-protegeName">{userInfo.protegeName === userInfo.userName||userInfo.protegeName===null?"":`${userInfo.protegeName}님의`}</span> 부가정보</p>
                {isExtraInfo===true?<p className='info-changeBtn' onClick={handleModifyClick}>변경</p>:""}
            </div>
            {isExtraInfo?<MyExtraInfoContent userInfo={userInfo} />:<p className="info-none"><img src={info} alt="" className="card-info-icon" />등록된 정보가 없습니다.</p>}
            {getSubstituteBtn(loginUser)}
        </div>
    );
}
 
export default MyExtraInfo; 