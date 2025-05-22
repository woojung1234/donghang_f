// 파일: src/mypage/component/MyExtraInfo.js
// App3 import 오류 수정 - 올바른 경로로 변경하거나 제거

// 기존 오류나는 import 제거/수정
// import App3 from 'App3';  // 이 부분이 오류 원인

// 올바른 import로 수정 (App3 파일이 실제로 존재하는 경로로)
// import App3 from '../../App3';  // 만약 App3.js가 src 폴더에 있다면
// 또는 App3를 사용하지 않는다면 import 자체를 제거

import React, { useState, useEffect } from 'react';
import { call } from 'login/service/ApiService';
//import './MyExtraInfo.css'; // CSS 파일이 있다면

function MyExtraInfo() {
    const [extraInfo, setExtraInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // 사용자 추가 정보 조회
        fetchExtraInfo();
    }, []);

    const fetchExtraInfo = () => {
        call('/api/v1/users/extra-info', 'GET', null)
        .then((response) => {
            if (response) {
                setExtraInfo(response);
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('추가 정보 조회 실패:', error);
            setErrorMsg('정보를 불러오는데 실패했습니다.');
            setIsLoading(false);
        });
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <p>정보를 불러오는 중...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="error-container">
                <p>{errorMsg}</p>
            </div>
        );
    }

    return (
        <div className="my-extra-info-container">
            <h2>추가 정보</h2>
            <div className="extra-info-content">
                {/* 추가 정보 표시 */}
                <div className="info-item">
                    <label>생년월일:</label>
                    <span>{extraInfo.birthDate || '미설정'}</span>
                </div>
                <div className="info-item">
                    <label>성별:</label>
                    <span>{extraInfo.gender || '미설정'}</span>
                </div>
                <div className="info-item">
                    <label>주소:</label>
                    <span>{extraInfo.address || '미설정'}</span>
                </div>
                {/* 필요에 따라 더 많은 정보 항목 추가 */}
            </div>
            
            {/* App3 컴포넌트를 사용해야 한다면 여기에 추가 */}
            {/* <App3 /> */}
        </div>
    );
}

export default MyExtraInfo;