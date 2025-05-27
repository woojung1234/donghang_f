// 파일: src/consume/component/ConsumDateModal.js
// 기간 설정 모달 - 사용자 기반 소비 내역 조회

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
        console.log("Applying date filter:", tempStartDate, "to", tempEndDate);

        // 소비 내역 조회
        call('/api/v1/consumption', 'GET', {
            startDate: tempStartDate,
            endDate: tempEndDate,
            limit: 100
        })
        .then((response) => {
            console.log("Date filtered consumption response:", response);
            if (response && response.consumptions) {
                setConsumList(response.consumptions);
            } else if (Array.isArray(response)) {
                setConsumList(response);
            } else {
                setConsumList([]);
            }

            // 날짜 업데이트
            updateDates(tempStartDate, tempEndDate);
            setIsLoading(false);
        })
        .catch((error) => {
            console.error("날짜별 내역 조회 실패:", error);
            alert("소비 내역 조회에 실패했습니다. 다시 시도해주세요.");
            setIsLoading(false);
        });

        // 요약 정보도 함께 조회
        call('/api/v1/consumption/summary', 'GET', {
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

    const setQuickDate = (type) => {
        const today = new Date();
        let startDate, endDate;

        switch (type) {
            case 'today':
                startDate = endDate = getToday();
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                startDate = weekAgo.getFullYear() + '-' +
                    String(weekAgo.getMonth() + 1).padStart(2, '0') + '-' +
                    String(weekAgo.getDate()).padStart(2, '0');
                endDate = getToday();
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = monthStart.getFullYear() + '-' +
                    String(monthStart.getMonth() + 1).padStart(2, '0') + '-' +
                    String(monthStart.getDate()).padStart(2, '0');
                endDate = getToday();
                break;
            case 'threeMonths':
                startDate = getThreeMonthsAgo();
                endDate = getToday();
                break;
            default:
                return;
        }

        setTempStartDate(startDate);
        setTempEndDate(endDate);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeModal} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="consumDateModal-container" onClick={(e) => e.stopPropagation()} style={{
                background: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '350px',
                maxHeight: '70vh',
                position: 'relative',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="modal-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px 12px 0 0',
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333' }}>📅 기간 설정</h2>
                    <button className="close-button" onClick={closeModal} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '4px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                    }}>
                        ×
                    </button>
                </div>

                <div className="modal-content" style={{
                    padding: '16px',
                    flex: 1,
                    overflowY: 'auto'
                }}>
                    <div className="date-input-container" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        <div className="date-input-group" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <label htmlFor="startDate" style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#555'
                            }}>시작 날짜</label>
                            <input
                                type="date"
                                id="startDate"
                                value={tempStartDate}
                                onChange={handleStartDateChange}
                                max={getToday()}
                                className="date-input"
                                style={{
                                    padding: '8px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div className="date-separator" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#666',
                            margin: '4px 0'
                        }}>~</div>

                        <div className="date-input-group" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <label htmlFor="endDate" style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#555'
                            }}>종료 날짜</label>
                            <input
                                type="date"
                                id="endDate"
                                value={tempEndDate}
                                onChange={handleEndDateChange}
                                max={getToday()}
                                min={tempStartDate}
                                className="date-input"
                                style={{
                                    padding: '8px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div className="quick-date-buttons" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        marginBottom: '8px'
                    }}>
                        <button
                            className="quick-date-btn"
                            onClick={() => setQuickDate('today')}
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                color: '#555',
                                textAlign: 'center'
                            }}
                        >
                            오늘
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => setQuickDate('week')}
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                color: '#555',
                                textAlign: 'center'
                            }}
                        >
                            최근 1주일
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => setQuickDate('month')}
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                color: '#555',
                                textAlign: 'center'
                            }}
                        >
                            이번 달
                        </button>

                        <button
                            className="quick-date-btn"
                            onClick={() => setQuickDate('threeMonths')}
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                color: '#555',
                                textAlign: 'center'
                            }}
                        >
                            최근 3개월
                        </button>
                    </div>
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '12px 16px',
                    borderTop: '1px solid #e0e0e0',
                    flexShrink: 0
                }}>
                    <button className="cancel-btn" onClick={closeModal} style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        background: 'white',
                        color: '#666'
                    }}>
                        취소
                    </button>
                    <button
                        className="apply-btn"
                        onClick={handleApplyDateFilter}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: '1px solid #4CAF50',
                            background: '#4CAF50',
                            color: 'white',
                            opacity: isLoading ? 0.6 : 1
                        }}
                    >
                        {isLoading ? '조회 중...' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsumDateModal;