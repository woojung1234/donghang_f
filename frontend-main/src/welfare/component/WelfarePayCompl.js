// 파일: src/welfare/component/WelfarePayCompl.js
// 복지 서비스 예약 완료 페이지 (결제 없는 예약 시스템)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'welfare/css/WelfarePayCompl.module.css';

function WelfarePayCompl(props) {
    const location = useLocation();
    const navi = useNavigate();
    
    // 예약 정보 받기
    const reservationData = location.state || {};
    const reservationId = location.state?.reservationId;
    
    const [reservationDetails, setReservationDetails] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        console.log("예약 완료 페이지 로드됨:", reservationData);
        
        if (!reservationData.welfareNo) {
            setErrorMsg('예약 정보를 찾을 수 없습니다.');
            setTimeout(() => {
                navi('/welfare-main');
            }, 3000);
            return;
        }

        // 예약 완료 정보 설정 및 사용자 정보 가져오기
        setReservationInfo();
        fetchUserInfo();
    }, [reservationData, navi]);

    const setReservationInfo = () => {
        // 전달받은 예약 데이터를 설정
        const details = {
            reservationId: reservationId || `RES${Date.now()}`,
            welfareNo: reservationData.welfareNo,
            welfareBookStartDate: reservationData.welfareBookStartDate,
            welfareBookUseTime: reservationData.welfareBookUseTime,
            serviceName: getServiceName(reservationData.welfareNo),
            serviceTime: getServiceTime(reservationData.welfareBookUseTime),
            reservationDate: new Date().toLocaleString(),
            status: 'CONFIRMED',
            userName: reservationData.userName
        };
        
        setReservationDetails(details);
        setIsLoading(false);
        
        console.log("예약 세부 정보 설정:", details);
    };

    const getServiceName = (welfareNo) => {
        switch (welfareNo) {
            case 1:
                return "일상 가사 돌봄";
            case 2:
                return "가정 간병 돌봄";  
            case 3:
                return "한울 돌봄";
            default:
                return "복지 서비스";
        }
    };

    const getServiceTime = (welfareBookUseTime) => {
        switch (welfareBookUseTime) {
            case 1:
                return "3시간 (09:00 ~ 12:00)";
            case 2:
                return "6시간 (09:00 ~ 15:00)";  
            case 3:
                return "9시간 (09:00 ~ 18:00)";
            case 4:
                return "1개월";
            case 5:
                return "2개월";
            case 6:
                return "6시간 (09:00 ~ 15:00)";
            case 7:
                return "4개월";
            case 8:
                return "5개월";
            case 9:
                return "6개월";
            default:
                return "서비스 시간 미정";
        }
    };

    const fetchUserInfo = () => {
        // 사용자 정보 조회
        call('/api/v1/users', 'GET', null)
        .then((response) => {
            if (response) {
                setUserInfo(response);
                console.log("사용자 정보 로드:", response);
            }
        })
        .catch((error) => {
            console.error('사용자 정보 조회 오류:', error);
        });
    };

    const handleGoHome = () => {
        navi('/welfare-main');
    };

    const handleGoMyPage = () => {
        navi('/mypage');
    };

    const handleViewReservations = () => {
        navi('/welfare-reserved-list');
    };

    const getServiceIcon = () => {
        switch (reservationDetails?.welfareNo) {
            case 1:
                return '🏠'; // 일상 가사 돌봄
            case 2:
                return '🏥'; // 가정 간병 돌봄
            case 3:
                return '💝'; // 한울 돌봄
            default:
                return '📅';
        }
    };

    if (isLoading) {
        return (
            <div className='welfare-pay-compl-container'>
                <Header style={{ position: 'relative', zIndex: 5 }}/>
                <div className="loading-section">
                    <div className="loading-spinner"></div>
                    <p>예약 정보를 확인하는 중...</p>
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className='welfare-pay-compl-container'>
                <Header style={{ position: 'relative', zIndex: 5 }}/>
                <div className="error-section">
                    <span className="error-icon">⚠️</span>
                    <p>{errorMsg}</p>
                </div>
            </div>
        );
    }

    return (
        <div className='welfare-pay-compl-container'>
            <Header style={{ position: 'relative', zIndex: 5 }}/>

            <div className="pay-compl-content">
                {/* 예약 성공 헤더 */}
                <div className="success-header">
                    <div className="success-icon">✅</div>
                    <h2>예약이 완료되었습니다</h2>
                    <p>복지 서비스 예약이 성공적으로 접수되었습니다</p>
                </div>

                {/* 예약 상세 정보 */}
                <div className="payment-details-card">
                    <div className="payment-header">
                        <span className="payment-icon">{getServiceIcon()}</span>
                        <div className="payment-title">
                            <h3>{reservationDetails?.serviceName}</h3>
                            <p>{reservationDetails?.reservationDate}</p>
                        </div>
                    </div>

                    <div className="payment-info-list">
                        <div className="info-row">
                            <span className="info-label">서비스 종류</span>
                            <span className="info-value">
                                {reservationDetails?.serviceName}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">예약 일시</span>
                            <span className="info-value">
                                {reservationDetails?.welfareBookStartDate}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">서비스 시간</span>
                            <span className="info-value">
                                {reservationDetails?.serviceTime}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">예약자</span>
                            <span className="info-value">
                                {reservationDetails?.userName || userInfo.userName || '사용자'}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">예약 번호</span>
                            <span className="info-value payment-id">
                                {reservationDetails?.reservationId}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">예약 상태</span>
                            <span className="info-value status-completed">
                                예약 확정
                            </span>
                        </div>
                    </div>
                </div>

                {/* 추가 안내 */}
                <div className="additional-info">
                    <div className="info-box">
                        <h4>📋 서비스 이용 안내</h4>
                        <ul>
                            <li>예약이 확정되어 서비스 이용이 가능합니다</li>
                            <li>서비스 관련 문의는 고객센터로 연락해주세요</li>
                            <li>예약 내역은 마이페이지에서 확인하실 수 있습니다</li>
                            <li>예약 변경이나 취소는 예약 내역에서 가능합니다</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="action-buttons">
                <button className="secondary-btn" onClick={handleViewReservations}>
                    예약 내역 보기
                </button>
                
                <button className="secondary-btn" onClick={handleGoMyPage}>
                    마이페이지
                </button>
                
                <button className="primary-btn" onClick={handleGoHome}>
                    홈으로 가기
                </button>
            </div>

            {/* 푸터 정보 */}
            <div className="payment-footer">
                <p>서비스 문의: 고객센터 1588-0000</p>
                <p>평일 09:00~18:00 (토/일/공휴일 휴무)</p>
            </div>
        </div>
    );
}

export default WelfarePayCompl;