// 파일: src/welfare/component/WelfareInputAddress.js
// 잘못된 import 경로들을 수정

import React, { useState } from 'react';
import Header from 'header/Header';
import { useNavigate } from 'react-router-dom';
// 잘못된 import 경로 수정
// import 'cardCreate/application/CardApplication.css';
import 'welfare/css/WelfareInputAddress.module.css'; // 올바른 CSS 경로

// AddressSearchComponent import 경로 수정 또는 컴포넌트 직접 구현
// import AddressSearchComponent from 'cardCreate/application/AddressSearchComponent';

function WelfareInputAddress() {
    const navigate = useNavigate();
    const [address, setAddress] = useState({
        mainAddress: '',
        detailAddress: '',
        zipCode: ''
    });
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    // 주소 검색 기능 (AddressSearchComponent 대신 간단히 구현)
    const handleAddressSearch = () => {
        setIsAddressModalOpen(true);
    };

    const handleAddressSelect = (selectedAddress) => {
        setAddress(prev => ({
            ...prev,
            mainAddress: selectedAddress.address,
            zipCode: selectedAddress.zipCode
        }));
        setIsAddressModalOpen(false);
    };

    const handleDetailAddressChange = (e) => {
        setAddress(prev => ({
            ...prev,
            detailAddress: e.target.value
        }));
    };

    const handleNext = () => {
        if (!address.mainAddress) {
            alert('주소를 입력해주세요.');
            return;
        }
        
        // 다음 단계로 이동
        navigate('/welfare-input/birth', {
            state: { address: address }
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="welfare-input-address-container">
            <Header />
            
            <div className="address-input-content">
                <div className="progress-bar">
                    <div className="progress-step active">주소</div>
                    <div className="progress-step">생년월일</div>
                    <div className="progress-step">성별</div>
                    <div className="progress-step">완료</div>
                </div>

                <div className="input-section">
                    <h2>주소를 입력해주세요</h2>
                    <p>복지 서비스 제공을 위해 주소 정보가 필요합니다.</p>

                    <div className="address-input-group">
                        <div className="zip-code-section">
                            <input
                                type="text"
                                value={address.zipCode}
                                placeholder="우편번호"
                                readOnly
                                className="zip-code-input"
                            />
                            <button 
                                onClick={handleAddressSearch}
                                className="address-search-btn"
                            >
                                주소 검색
                            </button>
                        </div>

                        <input
                            type="text"
                            value={address.mainAddress}
                            placeholder="기본 주소"
                            readOnly
                            className="main-address-input"
                        />

                        <input
                            type="text"
                            value={address.detailAddress}
                            onChange={handleDetailAddressChange}
                            placeholder="상세 주소 (동, 호수 등)"
                            className="detail-address-input"
                        />
                    </div>

                    <div className="address-info">
                        <h4>📋 주소 정보 안내</h4>
                        <ul>
                            <li>정확한 주소 입력은 서비스 품질 향상에 도움됩니다</li>
                            <li>입력하신 주소는 복지 서비스 제공 목적으로만 사용됩니다</li>
                            <li>개인정보는 안전하게 보호됩니다</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="navigation-buttons">
                <button onClick={handleBack} className="back-btn">
                    이전
                </button>
                <button 
                    onClick={handleNext} 
                    className={`next-btn ${!address.mainAddress ? 'disabled' : ''}`}
                    disabled={!address.mainAddress}
                >
                    다음
                </button>
            </div>

            {/* 간단한 주소 검색 모달 */}
            {isAddressModalOpen && (
                <div className="address-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
                    <div className="address-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>주소 검색</h3>
                            <button 
                                onClick={() => setIsAddressModalOpen(false)}
                                className="modal-close-btn"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <p>주소 검색 기능을 구현중입니다.</p>
                            <p>임시로 샘플 주소를 제공합니다.</p>
                            
                            <div className="sample-addresses">
                                <div 
                                    className="address-item"
                                    onClick={() => handleAddressSelect({
                                        address: '서울특별시 강남구 테헤란로 123',
                                        zipCode: '06142'
                                    })}
                                >
                                    <div className="zip-code">06142</div>
                                    <div className="address">서울특별시 강남구 테헤란로 123</div>
                                </div>
                                
                                <div 
                                    className="address-item"
                                    onClick={() => handleAddressSelect({
                                        address: '부산광역시 해운대구 센텀중앙로 456',
                                        zipCode: '48058'
                                    })}
                                >
                                    <div className="zip-code">48058</div>
                                    <div className="address">부산광역시 해운대구 센텀중앙로 456</div>
                                </div>
                                
                                <div 
                                    className="address-item"
                                    onClick={() => handleAddressSelect({
                                        address: '대구광역시 중구 동성로 789',
                                        zipCode: '41911'
                                    })}
                                >
                                    <div className="zip-code">41911</div>
                                    <div className="address">대구광역시 중구 동성로 789</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WelfareInputAddress;