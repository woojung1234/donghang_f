import React, { useEffect, useState } from 'react';

function MyExtraInfoContent({userInfo}) {
    const [gender, setGender] = useState('');
    useEffect(()=>{
        if(userInfo.protegeGender===1){
            setGender('남');
        }else if(userInfo.protegeGender===2){
            setGender('여');
        }else{ setGender('없음')}
    },[userInfo.protegeGender]);   
    return (
        <div>
             <div className='info-content'>
                <p>생년월일</p>
                <p>{userInfo.protegeBirth?userInfo.protegeBirth:"없음"}</p>
            </div>
            <div className='info-content'>
                <p>성별</p>
                <p>{gender}</p>
            </div>
            <div className='info-content'>
                <p>키</p>
                <p>{userInfo.protegeHeight} cm</p>
            </div>  
            <div className='info-content'>
                <p>몸무게</p>
                <p>{userInfo.protegeWeight} kg</p>
            </div>
            <div className='info-content'>
                <p>질병</p>
                <p>{userInfo.protegeDisease?userInfo.protegeDisease :"없음"}</p>
            </div>
            <div className='info-content'>
                <p>주소</p>
                <p>{userInfo.protegeAddress!=='null'?userInfo.protegeAddress:"없음"} {userInfo.protegeAddressDetail!=='null'?userInfo.protegeAddressDetail:""}</p>
            </div>
        </div>

    );
}

export default MyExtraInfoContent;