// 파일: src/consume/component/InlineDatePicker.js
// 인라인 날짜 선택 컴포넌트

import React, { useState, useEffect } from 'react';
import './InlineDatePicker.css';
import { call } from 'login/service/ApiService';

const InlineDatePicker = ({
    setConsumList,
    updateDates,
    startDate,
    endDate,
    setSummaryData,
    onClose
}) => {
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

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

        onClose(); // 날짜 선택기 닫기
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

    return (
        <div className="inline-date-picker">
            <div className="date-picker-header">
                <h3>📅 기간 설정</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="date-inputs">
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
                <button className="quick-date-btn" onClick={() => setQuickDate('today')}>
                    오늘
                </button>
                <button className="quick-date-btn" onClick={() => setQuickDate('week')}>
                    최근 1주일
                </button>
                <button className="quick-date-btn" onClick={() => setQuickDate('month')}>
                    이번 달
                </button>
                <button className="quick-date-btn" onClick={() => setQuickDate('threeMonths')}>
                    최근 3개월
                </button>
            </div>

            <div className="date-picker-footer">
                <button className="cancel-btn" onClick={onClose}>
                    취소
                </button>
                <button
                    className="apply-btn"
                    onClick={handleApplyDateFilter}
                    disabled={isLoading}
                >
                    {isLoading ? '조회 중...' : '확인'}
                </button>
            </div>
        </div>
    );
};

export default InlineDatePicker;
