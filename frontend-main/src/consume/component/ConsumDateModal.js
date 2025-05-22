// 파일: src/consume/component/ConsumDateModal.js
// 카드 ID 기반을 사용자 기반으로 변경 (API 엔드포인트는 유지)

import React, { useState, useEffect } from 'react';
import './ConsumDateModal.css';
import { call } from 'login/service/ApiService';

const ConsumDateModal = ({
    setConsumList,
    isOpen,
    closeModal,
    updateDates,
    startDate,
    endDate,
    setSummaryData
}) => {
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
        }
    }, [isOpen, startDate, endDate]);

    const handleApplyDateFilter = () => {
        if (!tempStartDate || !tempEndDate) {
            alert('시작 날짜와 종료 날짜를 모두 선택해주세요.');
            return;
        }

        if (new Date(tempStartDate) > new Date(tempEndDate)) {
            alert('시작 날짜는 종료 날짜보다 빨라야 합니다.');
            return;
        }

        setIsLoading(true);

        // 소비 내역 조회 (카드ID 제거, 기존 API 엔드포인트 유지)
        call('/api/card-history', 'GET', {
            startDate: tempStartDate,
            endDate: tempEndDate
        })
        .then((response) => {
            console.log("Date filtered consumption response:", response);
            if (response.cardHistory) {
                setConsumList(response.cardHistory);
            } else {
                setConsumList(response);
            }

            // 날짜 업데이트
            updateDates(tempStartDate, tempEndDate);
            setIsLoading(false);
        })
        .catch((error) => {
            console.error("날짜별 내역 조회 실패:", error);
            setIsLoading(false);
        });

        // 요약 정보도 함께 조회 (카드ID 제거)
        call('/api/card-history/summary', 'GET', {
            startDate: tempStartDate,
            endDate: tempEndDate
        })
        .then((response) => {
            console.log("Date filtered summary response:", response);
            setSummaryData(response);
        })
        .catch((error) => {
            console.error("날짜별 요약 조회 실패:", error);
        });

        closeModal();
    };

    const handleStartDateChange = (e) => {
        setTempStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setTempEndDate(e.target.value);
    };

    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getThreeMonthsAgo = () => {
        const today = new Date();
        today.setMonth(today.getMonth() - 3);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="consumDateModal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>기간 설정</h2>
                    <button className="close-button" onClick={closeModal}>
                        ×
                    </button>
                </div>

                <div className="modal-content">
                    <div className="date-input-container">
                        <div className="date-input-group">
                            <label htmlFor="startDate">시작 날짜</label>
                            <input
                                type="date"
                                id="startDate"
                                value={tempStartDate}
                                onChange={handleStartDateChange}
                                max={getToday()}
                                className="date-input"
                            />
                        </div>

                        <div className="date-separator">~</div>

                        <div className="date-input-group">
                            <label htmlFor="endDate">종료 날짜</label>
                            <input
                                type="date"
                                id="endDate"
                                value={tempEndDate}
                                onChange={handleEndDateChange}
                                max={getToday()}
                                min={tempStartDate}
                                className="date-input"
                            />
                        </div>
                    </div>

                    <div className="quick-date-buttons">
                        <button
                            className="quick-date-btn"
                            onClick={() => {
                                const today = getToday();
                                setTempStartDate(today);
                                setTempEndDate(today);
                            }}
                        >
                            오늘
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => {
                                const today = new Date();
                                const weekAgo = new Date(today);
                                weekAgo.setDate(today.getDate() - 7);

                                const weekAgoStr = weekAgo.getFullYear() + '-' +
                                    String(weekAgo.getMonth() + 1).padStart(2, '0') + '-' +
                                    String(weekAgo.getDate()).padStart(2, '0');

                                setTempStartDate(weekAgoStr);
                                setTempEndDate(getToday());
                            }}
                        >
                            최근 1주일
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => {
                                const today = new Date();
                                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

                                const monthStartStr = monthStart.getFullYear() + '-' +
                                    String(monthStart.getMonth() + 1).padStart(2, '0') + '-' +
                                    String(monthStart.getDate()).padStart(2, '0');

                                setTempStartDate(monthStartStr);
                                setTempEndDate(getToday());
                            }}
                        >
                            이번 달
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => {
                                setTempStartDate(getThreeMonthsAgo());
                                setTempEndDate(getToday());
                            }}
                        >
                            최근 3개월
                        </button>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={closeModal}>
                        취소
                    </button>
                    <button
                        className="apply-btn"
                        onClick={handleApplyDateFilter}
                        disabled={isLoading}
                    >
                        {isLoading ? '조회 중...' : '적용'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsumDateModal;