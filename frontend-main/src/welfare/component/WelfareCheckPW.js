// 파일: src/welfare/component/WelfareCheckPW.js
// 카드 ID 기반을 사용자 ID 기반으로 변경 (API 엔드포인트는 유지)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'welfare/css/WelfareCheckPW.module.css';

function WelfareCheckPW(props) {
    const location = useLocation();
    const navi = useNavigate();
    
    // 카드 ID 대신 사용자 ID 사용
    const userId = location.state?.value;
    
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 5;

    useEffect(() => {
        // 사용자 ID가 없으면 이전 페이지로 리다이렉트
        if (!userId) {
            setErrorMsg('결제 정보가 없습니다.');
            setTimeout(() => {
                navi('/welfare-pay');
            }, 2000);
        }
    }, [userId, navi]);

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        // 숫자만 입력 가능하도록 제한
        if (/^\d*$/.test(value) && value.length <= 6) {
            setPassword(value);
            setErrorMsg(''); // 입력 시 에러 메시지 클리어
        }
    };

    const handleSubmit = () => {
        if (!password) {
            setErrorMsg('결제 비밀번호를 입력해주세요.');
            return;
        }

        if (password.length < 4) {
            setErrorMsg('비밀번호는 최소 4자리 이상 입력해주세요.');
            return;
        }

        if (attempts >= maxAttempts) {
            setErrorMsg('비밀번호 입력 횟수를 초과했습니다.');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        // 기존 결제 비밀번호 확인 API 사용 (사용자 ID 기반으로 변경)
        call('/api/v1/users/payment/verify', 'POST', {
            userId: userId,  // 카드 ID 대신 사용자 ID 사용
            password: password
        })
        .then((response) => {
            if (response.success || response.result) {
                // 비밀번호 확인 성공 - 결제 완료 페이지로 이동
                navi('/welfare-pay-compl', { 
                    state: { 
                        value: userId,
                        paymentInfo: {
                            method: '간편결제',
                            time: new Date().toLocaleString()
                        }
                    } 
                });
            } else {
                setAttempts(prev => prev + 1);
                const remainingAttempts = maxAttempts - attempts - 1;
                
                if (remainingAttempts > 0) {
                    setErrorMsg(`비밀번호가 일치하지 않습니다. (${remainingAttempts}회 남음)`);
                } else {
                    setErrorMsg('비밀번호 입력 횟수를 초과했습니다.');
                }
                setPassword('');
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('비밀번호 확인 오류:', error);
            setErrorMsg('결제 처리 중 오류가 발생했습니다.');
            setIsLoading(false);
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleForgotPassword = () => {
        // 비밀번호 재설정 페이지로 이동
        navi('/welfare-input/welfare-set-pw', { 
            state: { 
                value: userId,
                isReset: true 
            } 
        });
    };

    return (
        <div className='welfare-check-pw-container'>
            <Header style={{ position: 'relative', zIndex: 5 }}/>

            <div className="check-pw-content">
                <div className="pw-header">
                    <h2>결제 비밀번호 입력</h2>
                    <p>안전한 결제를 위해 비밀번호를 입력해주세요</p>
                </div>

                <div className="pw-input-section">
                    <div className="pw-display">
                        {[...Array(6)].map((_, index) => (
                            <div 
                                key={index} 
                                className={`pw-dot ${index < password.length ? 'filled' : ''}`}
                            >
                                {index < password.length ? '●' : '○'}
                            </div>
                        ))}
                    </div>
                    
                    <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        onKeyPress={handleKeyPress}
                        placeholder="결제 비밀번호 입력"
                        className="pw-input"
                        maxLength="6"
                        autoFocus
                        disabled={isLoading || attempts >= maxAttempts}
                    />
                </div>

                {errorMsg && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <div className="pw-info">
                    <p>• 결제 비밀번호는 4-6자리 숫자입니다</p>
                    <p>• 보안을 위해 {maxAttempts}회까지만 입력 가능합니다</p>
                </div>

                <div className="pw-actions">
                    <button 
                        className="forgot-pw-btn"
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                </div>
            </div>

            <div className="pw-submit-section">
                <button 
                    className="cancel-btn"
                    onClick={() => navi('/welfare-pay')}
                    disabled={isLoading}
                >
                    취소
                </button>
                
                <button 
                    className={`submit-btn ${(!password || isLoading || attempts >= maxAttempts) ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                    disabled={!password || isLoading || attempts >= maxAttempts}
                >
                    {isLoading ? '확인 중...' : '결제하기'}
                </button>
            </div>
        </div>
    );
}

export default WelfareCheckPW;