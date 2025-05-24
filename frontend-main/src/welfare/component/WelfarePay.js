// 파일: src/welfare/component/WelfarePay.js
// 카드 선택 결제를 간단 결제 확인으로 변경 (API 엔드포인트는 유지)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'welfare/css/WelfarePay.css';
// 카드 이미지 import 제거
// import cardP from "image/personalCard3.png";
// import cardF from "image/familyCard3.png";
// import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/css';
// import 'swiper/css/navigation';

function WelfarePay(props) {
    const [isPaymentReady, setIsPaymentReady] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [errorMsg, setErrorMsg] = useState('');
    const [errorMsg02, setErrorMsg02] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navi = useNavigate();

    useEffect(() => {
        // 사용자 정보 및 결제 가능 여부 확인 (기존 API 활용)
        call('/api/v1/users/info', "GET", null)
            .then(response => {
                if (response && response.userId) {
                    setUserInfo(response);
                    setIsPaymentReady(true);
                    setIsLoading(false);
                } else {
                    setIsPaymentReady(false);
                    setErrorMsg("결제 정보를 확인할 수 없습니다.");
                    setErrorMsg02("다시 시도해 주세요.");
                    setIsLoading(false);
                }
            })
            .catch(error => {
                setErrorMsg("사용자 정보 조회에 실패했습니다.");
                setErrorMsg02("네트워크 연결을 확인해 주세요.");
                setIsLoading(false);
            });
    }, []);

    const handleGoCheckPW = () => {
        if (isPaymentReady) {
            // 기존 결제 API 활용하되 카드 정보 대신 사용자 정보 전달
            call('/api/v1/users/payment', "GET", null)
                .then((response) => {
                    if (response.result) {
                        // 비밀번호 확인 화면으로 이동 (사용자 ID 전달)
                        navi('/welfare-input/welfare-check-pw', {
                            state: { value: userInfo.userId }
                        });
                    } else {
                        // 비밀번호 설정 화면으로 이동
                        navi('/welfare-input/welfare-set-pw', {
                            state: { value: userInfo.userId }
                        });
                    }
                })
                .catch((error) => {
                    setErrorMsg("결제 처리에 실패했습니다.");
                    setErrorMsg02("잠시 후 다시 시도해 주세요.");
                });
        } else {
            setErrorMsg("결제가 불가능합니다.");
            setErrorMsg02("사용자 정보를 확인해 주세요.");
        }
    };

    return (
        <div className='welfarePay-container'>
            <Header style={{ position: 'relative', zIndex: 5 }}/>

            {isLoading ? (
                <div className="loading-section">
                    <p>결제 정보를 확인하는 중...</p>
                </div>
            ) : isPaymentReady ? (
                <>
                    <div className="information-container-pay">
                        <p className="information-pay">결제를 진행하시겠습니까?</p>
                    </div>

                    {/* 카드 선택 대신 결제 정보 표시 */}
                    <div className="payment-info-section">
                        <div className="payment-method-card">
                            <div className="payment-icon">💳</div>
                            <h3>간편 결제</h3>
                            <p>등록된 결제 수단으로 안전하게 결제됩니다</p>
                        </div>

                        <div className="user-info-display">
                            <p className="user-name">
                                {userInfo.userName || userInfo.name || '사용자'}님
                            </p>
                            <p className="payment-description">
                                복지 서비스 이용료가 결제됩니다
                            </p>
                        </div>
                    </div>

                    {/* 기존 카드 스와이퍼 제거 */}
                    {/* Swiper 관련 코드 모두 제거 */}

                    <div className="payment-notice">
                        <div className="notice-item">
                            <span className="notice-icon">🔒</span>
                            <span>안전한 결제 시스템</span>
                        </div>
                        <div className="notice-item">
                            <span className="notice-icon">⚡</span>
                            <span>빠른 결제 처리</span>
                        </div>
                        <div className="notice-item">
                            <span className="notice-icon">📱</span>
                            <span>모바일 최적화</span>
                        </div>
                    </div>
                </>
            ) : null}

            {/* 에러 메시지 표시 */}
            <div className='pay-error-message-wrap'>
                <p className='pay-error-message'>{errorMsg}</p>
                <p className='pay-error-message'>{errorMsg02}</p>
            </div>

            {/* 결제 진행 버튼 */}
            <div className='goCheckBtn-wrap' onClick={isPaymentReady ? handleGoCheckPW : undefined}>
                <p className={`goCheckBtn ${!isPaymentReady ? "disabled-btn" : ""}`}>
                    {isLoading ? "확인 중..." : "결제하기"}
                </p>
            </div>
        </div>
    );
}

export default WelfarePay;