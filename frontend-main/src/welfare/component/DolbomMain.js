// 파일: src/welfare/component/DolbomMain.js
// 카드 관련 부분 제거하고 사용자 기반으로 변경 (API 엔드포인트는 유지)

import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'welfare/css/DolbomMain.module.css';
// 카드 관련 import 제거
// import ExtraInfo from 'cardCreate/application/ExtraInfo';

function DolbomMain() {
    const navi = useNavigate();

    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [userInfo, setUserInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

    useEffect(() => {
        // 사용자 정보 및 이용 가능한 돌봄 서비스 조회
        fetchUserInfo();
        fetchAvailableServices();
    }, []);

    const fetchUserInfo = () => {
        call('/api/v1/users/info', 'GET', null)
        .then((response) => {
            if (response) {
                setUserInfo(response);
            }
        })
        .catch((error) => {
            console.error('사용자 정보 조회 실패:', error);
        });
    };

    const fetchAvailableServices = () => {
        // 기존 돌봄 서비스 조회 API 활용
        call('/api/v1/welfare/dolbom/services', 'GET', null)
        .then((response) => {
            if (response && Array.isArray(response)) {
                setServices(response);
            } else {
                // 기본 서비스 목록 설정
                setServices([
                    {
                        id: 1,
                        name: '가사지원 서비스',
                        description: '청소, 세탁, 정리정돈 등 가사 업무 지원',
                        price: 15000,
                        duration: '2시간',
                        icon: '🏠'
                    },
                    {
                        id: 2,
                        name: '간병돌봄 서비스',
                        description: '일상생활 지원 및 건강관리 도움',
                        price: 20000,
                        duration: '3시간',
                        icon: '👩‍⚕️'
                    },
                    {
                        id: 3,
                        name: '한울 돌봄 서비스',
                        description: '전문 돌보미의 맞춤형 케어 서비스',
                        price: 25000,
                        duration: '4시간',
                        icon: '🤝'
                    }
                ]);
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('돌봄 서비스 조회 실패:', error);
            setErrorMsg('서비스 정보를 불러오는데 실패했습니다.');
            setIsLoading(false);
        });
    };

    const handleServiceSelect = (service) => {
        setSelectedService(service);
        setIsServiceModalOpen(true);
    };

    const handleServiceReservation = () => {
        if (!selectedService) {
            setErrorMsg('서비스를 선택해주세요.');
            return;
        }

        // 사용자 정보 확인 (카드 정보 확인 대신)
        if (!userInfo.userId) {
            setErrorMsg('사용자 정보를 확인할 수 없습니다.');
            return;
        }

        // 돌봄 서비스 예약 진행 (카드 ID 대신 사용자 ID 전달)
        navi('/welfare-input/welfare-input-total', {
            state: {
                serviceInfo: selectedService,
                userInfo: userInfo
            }
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    const closeServiceModal = () => {
        setIsServiceModalOpen(false);
        setSelectedService(null);
    };

    if (isLoading) {
        return (
            <div className="dolbom-main-container">
                <Header />
                <div className="loading-section">
                    <p>돌봄 서비스 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dolbom-main-container">
            <Header />

            <div className="dolbom-content">
                {/* 헤더 섹션 */}
                <div className="dolbom-header">
                    <h1>돌봄 서비스</h1>
                    <p>전문적이고 신뢰할 수 있는 돌봄 서비스를 제공합니다</p>
                    {userInfo.userName && (
                        <div className="user-greeting">
                            <span>👋 {userInfo.userName}님, 안녕하세요!</span>
                        </div>
                    )}
                </div>

                {/* 에러 메시지 */}
                {errorMsg && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* 서비스 목록 */}
                <div className="services-section">
                    <h2>이용 가능한 서비스</h2>
                    <div className="services-grid">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="service-card"
                                onClick={() => handleServiceSelect(service)}
                            >
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.name}</h3>
                                <p className="service-description">{service.description}</p>
                                <div className="service-details">
                                    <div className="service-price">
                                        {formatPrice(service.price)}원
                                    </div>
                                    <div className="service-duration">
                                        {service.duration}
                                    </div>
                                </div>
                                <button className="service-select-btn">
                                    선택하기
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 서비스 안내 */}
                <div className="service-info">
                    <h3>📋 서비스 이용 안내</h3>
                    <ul>
                        <li>전문 교육을 받은 돌보미가 서비스를 제공합니다</li>
                        <li>서비스 예약은 최소 1일 전에 해주세요</li>
                        <li>긴급상황 시 24시간 연락 가능합니다</li>
                        <li>서비스 만족도 조사를 통해 품질을 개선합니다</li>
                    </ul>
                </div>
            </div>

            {/* 서비스 상세 모달 */}
            {isServiceModalOpen && selectedService && (
                <div className="modal-overlay" onClick={closeServiceModal}>
                    <div className="service-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedService.name}</h3>
                            <button className="close-btn" onClick={closeServiceModal}>×</button>
                        </div>

                        <div className="modal-content">
                            <div className="service-detail-icon">{selectedService.icon}</div>
                            <p className="service-detail-description">
                                {selectedService.description}
                            </p>

                            <div className="service-detail-info">
                                <div className="detail-row">
                                    <span>서비스 시간:</span>
                                    <span>{selectedService.duration}</span>
                                </div>
                                <div className="detail-row">
                                    <span>이용 요금:</span>
                                    <span className="price-highlight">
                                        {formatPrice(selectedService.price)}원
                                    </span>
                                </div>
                            </div>

                            <div className="service-features">
                                <h4>포함 서비스</h4>
                                <ul>
                                    {selectedService.id === 1 && (
                                        <>
                                            <li>청소 및 정리정돈</li>
                                            <li>세탁 및 다림질</li>
                                            <li>간단한 요리 준비</li>
                                        </>
                                    )}
                                    {selectedService.id === 2 && (
                                        <>
                                            <li>일상생활 지원</li>
                                            <li>복약 관리</li>
                                            <li>병원 동행</li>
                                        </>
                                    )}
                                    {selectedService.id === 3 && (
                                        <>
                                            <li>개인 맞춤 케어</li>
                                            <li>정서적 지원</li>
                                            <li>응급상황 대응</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={closeServiceModal}>
                                취소
                            </button>
                            <button className="reservation-btn" onClick={handleServiceReservation}>
                                예약하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DolbomMain;