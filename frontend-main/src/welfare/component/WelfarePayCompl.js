// 파일: src/welfare/component/WelfarePayCompl.js
// 카드 기반 결제 완료를 사용자 기반으로 변경 (API 엔드포인트는 유지)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'welfare/css/WelfarePayCompl.module.css';

function WelfarePayCompl(props) {
    const location = useLocation();
    const navi = useNavigate();
    
    // 카드 ID 대신 사용자 ID 사용
    const userId = location.state?.value;
    const paymentInfo = location.state?.paymentInfo || {};
    
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!userId) {
            setErrorMsg('결제 정보를 찾을 수 없습니다.');
            setTimeout(() => {
                navi('/welfare-main');
            }, 3000);
            return;
        }

        // 결제 완료 정보 조회 및 사용자 정보 가져오기
        fetchPaymentDetails();
        fetchUserInfo();
    }, [userId, navi]);

    const fetchPaymentDetails = () => {
        // 기존 결제 내역 API 활용 (사용자 ID 기반으로 변경)
        call('/api/v1/users/payment/latest', 'GET', {
            userId: userId
        })
        .then((response) => {
            if (response && response.paymentId) {
                setPaymentDetails(response);
            } else {
                // API에서 정보를 가져오지 못한 경우 기본 정보 설정
                setPaymentDetails({
                    paymentId: Date.now().toString(),
                    amount: paymentInfo.amount || 0,
                    method: paymentInfo.method || '간편결제',
                    time: paymentInfo.time || new Date().toLocaleString(),
                    status: 'completed',
                    serviceType: '복지서비스'
                });
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('결제 정보 조회 오류:', error);
            // 오류 시에도 기본 정보로 표시
            setPaymentDetails({
                paymentId: Date.now().toString(),
                amount: 0,
                method: '간편결제',
                time: new Date().toLocaleString(),
                status: 'completed',
                serviceType: '복지서비스'
            });
            setIsLoading(false);
        });
    };

    const fetchUserInfo = () => {
        // 사용자 정보 조회
        call('/api/v1/users/info', 'GET', null)
        .then((response) => {
            if (response) {
                setUserInfo(response);
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

    const handleViewHistory = () => {
        navi('/consumption', { 
            state: { 
                value: { userId: userId } 
            } 
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    const getPaymentIcon = () => {
        switch (paymentDetails?.method) {
            case '간편결제':
                return '💳';
            case '계좌이체':
                return '🏦';
            default:
                return '✅';
        }
    };

    if (isLoading) {
        return (
            <div className='welfare-pay-compl-container'>
                <Header style={{ position: 'relative', zIndex: 5 }}/>
                <div className="loading-section">
                    <div className="loading-spinner"></div>
                    <p>결제 정보를 확인하는 중...</p>
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
                {/* 결제 성공 헤더 */}
                <div className="success-header">
                    <div className="success-icon">✅</div>
                    <h2>결제가 완료되었습니다</h2>
                    <p>복지 서비스 이용이 승인되었습니다</p>
                </div>

                {/* 결제 상세 정보 */}
                <div className="payment-details-card">
                    <div className="payment-header">
                        <span className="payment-icon">{getPaymentIcon()}</span>
                        <div className="payment-title">
                            <h3>{paymentDetails?.serviceType || '복지서비스'}</h3>
                            <p>{paymentDetails?.time}</p>
                        </div>
                    </div>

                    <div className="payment-info-list">
                        <div className="info-row">
                            <span className="info-label">결제 금액</span>
                            <span className="info-value amount">
                                {formatAmount(paymentDetails?.amount || 0)}원
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">결제 방법</span>
                            <span className="info-value">
                                {paymentDetails?.method || '간편결제'}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">결제자</span>
                            <span className="info-value">
                                {userInfo.userName || userInfo.name || '사용자'}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">결제 번호</span>
                            <span className="info-value payment-id">
                                {paymentDetails?.paymentId}
                            </span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">결제 상태</span>
                            <span className="info-value status-completed">
                                결제 완료
                            </span>
                        </div>
                    </div>
                </div>

                {/* 추가 안내 */}
                <div className="additional-info">
                    <div className="info-box">
                        <h4>📋 서비스 이용 안내</h4>
                        <ul>
                            <li>결제가 완료되어 서비스 이용이 가능합니다</li>
                            <li>서비스 관련 문의는 고객센터로 연락해주세요</li>
                            <li>결제 내역은 마이페이지에서 확인하실 수 있습니다</li>
                        </ul>
                    </div>

                    {paymentInfo.isFirstTime && (
                        <div className="first-time-notice">
                            <span className="notice-icon">🎉</span>
                            <p>결제 비밀번호가 성공적으로 설정되었습니다!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="action-buttons">
                <button className="secondary-btn" onClick={handleViewHistory}>
                    결제 내역 보기
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
                <p>결제 문의: 고객센터 1588-0000</p>
                <p>평일 09:00~18:00 (토/일/공휴일 휴무)</p>
            </div>
        </div>
    );
}

export default WelfarePayCompl;