// 파일: src/welfare/component/WelfareSetPW.js
// 카드 ID 기반을 사용자 ID 기반으로 변경 (API 엔드포인트는 유지)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'welfare/css/WelfareSetPW.module.css';

function WelfareSetPW(props) {
    const location = useLocation();
    const navi = useNavigate();
    
    // 카드 ID 대신 사용자 ID 사용
    const userId = location.state?.value;
    const isReset = location.state?.isReset || false; // 비밀번호 재설정 여부
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: 비밀번호 입력, 2: 비밀번호 확인
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 사용자 ID가 없으면 이전 페이지로 리다이렉트
        if (!userId) {
            setErrorMsg('사용자 정보가 없습니다.');
            setTimeout(() => {
                navi('/welfare-pay');
            }, 2000);
        }
    }, [userId, navi]);

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        // 숫자만 입력 가능하도록 제한
        if (/^\d*$/.test(value) && value.length <= 6) {
            if (currentStep === 1) {
                setPassword(value);
            } else {
                setConfirmPassword(value);
            }
            setErrorMsg(''); // 입력 시 에러 메시지 클리어
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!password) {
                setErrorMsg('결제 비밀번호를 입력해주세요.');
                return;
            }
            
            if (password.length < 4) {
                setErrorMsg('비밀번호는 최소 4자리 이상 입력해주세요.');
                return;
            }

            // 간단한 패턴 체크
            if (isSimplePattern(password)) {
                setErrorMsg('보안을 위해 연속된 숫자나 같은 숫자는 사용할 수 없습니다.');
                return;
            }

            setCurrentStep(2);
            setErrorMsg('');
        } else {
            handleSubmit();
        }
    };

    const isSimplePattern = (pwd) => {
        // 모든 자리가 같은 숫자 (1111, 2222 등)
        if (pwd.split('').every(digit => digit === pwd[0])) {
            return true;
        }
        
        // 연속된 숫자 (1234, 2345 등)
        let isSequential = true;
        for (let i = 1; i < pwd.length; i++) {
            if (parseInt(pwd[i]) !== parseInt(pwd[i-1]) + 1) {
                isSequential = false;
                break;
            }
        }
        
        return isSequential;
    };

    const handleSubmit = () => {
        if (!confirmPassword) {
            setErrorMsg('비밀번호를 다시 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('비밀번호가 일치하지 않습니다.');
            setConfirmPassword('');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        // 기존 비밀번호 설정 API 사용 (사용자 ID 기반으로 변경)
        const apiEndpoint = isReset ? '/api/v1/users/payment/reset' : '/api/v1/users/payment/set';
        
        call(apiEndpoint, 'POST', {
            userId: userId,  // 카드 ID 대신 사용자 ID 사용
            password: password
        })
        .then((response) => {
            if (response.success || response.result) {
                // 비밀번호 설정 성공
                if (isReset) {
                    alert('결제 비밀번호가 성공적으로 재설정되었습니다.');
                    navi('/welfare-input/welfare-check-pw', { 
                        state: { value: userId } 
                    });
                } else {
                    alert('결제 비밀번호가 성공적으로 설정되었습니다.');
                    navi('/welfare-pay-compl', { 
                        state: { 
                            value: userId,
                            paymentInfo: {
                                method: '간편결제',
                                time: new Date().toLocaleString(),
                                isFirstTime: true
                            }
                        } 
                    });
                }
            } else {
                setErrorMsg('비밀번호 설정에 실패했습니다. 다시 시도해주세요.');
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('비밀번호 설정 오류:', error);
            setErrorMsg('비밀번호 설정 중 오류가 발생했습니다.');
            setIsLoading(false);
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleNextStep();
        }
    };

    const handleBackStep = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
            setConfirmPassword('');
            setErrorMsg('');
        } else {
            navi('/welfare-pay');
        }
    };

    const getCurrentPassword = () => {
        return currentStep === 1 ? password : confirmPassword;
    };

    const getPlaceholderText = () => {
        return currentStep === 1 ? '결제 비밀번호 설정' : '비밀번호 재입력';
    };

    const getHeaderText = () => {
        if (isReset) {
            return currentStep === 1 ? '새 결제 비밀번호 설정' : '새 비밀번호 확인';
        }
        return currentStep === 1 ? '결제 비밀번호 설정' : '비밀번호 확인';
    };

    return (
        <div className='welfare-set-pw-container'>
            <Header style={{ position: 'relative', zIndex: 5 }}/>

            <div className="set-pw-content">
                <div className="pw-header">
                    <h2>{getHeaderText()}</h2>
                    <p>
                        {currentStep === 1 
                            ? '안전한 결제를 위해 비밀번호를 설정해주세요' 
                            : '설정한 비밀번호를 다시 입력해주세요'
                        }
                    </p>
                </div>

                <div className="step-indicator">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                        <span>1</span>
                        <label>비밀번호 설정</label>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                        <span>2</span>
                        <label>비밀번호 확인</label>
                    </div>
                </div>

                <div className="pw-input-section">
                    <div className="pw-display">
                        {[...Array(6)].map((_, index) => (
                            <div 
                                key={index} 
                                className={`pw-dot ${index < getCurrentPassword().length ? 'filled' : ''}`}
                            >
                                {index < getCurrentPassword().length ? '●' : '○'}
                            </div>
                        ))}
                    </div>
                    
                    <input
                        type="password"
                        value={getCurrentPassword()}
                        onChange={handlePasswordChange}
                        onKeyPress={handleKeyPress}
                        placeholder={getPlaceholderText()}
                        className="pw-input"
                        maxLength="6"
                        autoFocus
                        disabled={isLoading}
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
                    <p>• 연속된 숫자나 같은 숫자는 사용할 수 없습니다</p>
                    <p>• 생년월일, 전화번호 등 추측 가능한 숫자는 피해주세요</p>
                </div>
            </div>

            <div className="pw-submit-section">
                <button 
                    className="back-btn"
                    onClick={handleBackStep}
                    disabled={isLoading}
                >
                    {currentStep === 1 ? '취소' : '이전'}
                </button>
                
                <button 
                    className={`submit-btn ${(!getCurrentPassword() || isLoading) ? 'disabled' : ''}`}
                    onClick={handleNextStep}
                    disabled={!getCurrentPassword() || isLoading}
                >
                    {isLoading ? '처리 중...' : (currentStep === 1 ? '다음' : '설정 완료')}
                </button>
            </div>
        </div>
    );
}

export default WelfareSetPW;