// 파일: src/consume/Consumption.js
// 노인분들을 위한 가계부 기능 - AI챗봇 연동 및 큰 그래프

import "consume/Consumption.css";
import Header from 'header/Header';
import { call } from "login/service/ApiService";
import { useEffect, useState } from 'react';
import ConsumCard from "./component/ConsumCard";
import ConsumDateModal from './component/ConsumDateModal';
import ConsumDetailModal from './component/ConsumDetailModal';
import ConsumList from './component/ConsumList';
import ExpenseChart from './component/ExpenseChart';
import { useLocation } from "react-router-dom";
import info from "image/icon/info.png";

function Consumption() {
    const location = useLocation();
    const userInfo = location.state?.value || {};

    const [isOpenDetail, setIsOpenDetail] = useState(false);
    const [isOpenDate, setIsOpenDate] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [consumList, setConsumList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [summaryData, setSummaryData] = useState(null);
    const [cardDetail, setCardDetail] = useState({});
    
    // 새로운 상태 추가
    const [chartData, setChartData] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('daily');
    const [voiceRecognitionSupported, setVoiceRecognitionSupported] = useState(false);

    // 한국 시간으로 날짜를 반환하는 함수
    const getKSTDate = (date) => {
        const offset = 9 * 60;
        const utcDate = new Date(date.getTime() + offset * 60 * 1000);
        return utcDate.toISOString().split('T')[0];
    };

    const getStartOfMonth = () => {
        const today = new Date();
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return getKSTDate(firstDayOfNextMonth);
    };

    const getEndOfMonth = () => {
        const today = new Date();
        return getKSTDate(today);
    };

    const updateDates = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        fetchConsumptionHistory(start, end);
        fetchChartData(chartPeriod);
    };

    const handleOpenDateModal = () => {
        setIsOpenDate(true);
    };

    const closeDetailModal = () => setIsOpenDetail(false);
    const closeDateModal = () => setIsOpenDate(false);

    useEffect(() => {
        document.body.classList.toggle("unscrollable", isOpenDetail || isOpenDate);
    }, [isOpenDetail, isOpenDate]);

    // 음성 인식 지원 확인
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setVoiceRecognitionSupported(true);
        }
    }, []);

    // 소비 내역 조회
    const fetchConsumptionHistory = (start, end) => {
        setIsLoading(true);
        console.log("Fetching consumption history with dates:", start, end);

        call('/api/consumption', "GET", {
            startDate: start,
            endDate: end,
            limit: 50
        })
        .then((response) => {
            console.log("Consumption history response:", response);
            setConsumList(response.consumptions || []);
            setSummaryData(response.summary);
            setIsLoading(false);
        })
        .catch((error) => {
            console.error("내역 조회 실패:", error);
            setIsLoading(false);
        });
    };

    // 차트 데이터 조회
    const fetchChartData = (period) => {
        call(`/api/consumption/stats/${period}`, "GET")
        .then((response) => {
            console.log("Chart data response:", response);
            setChartData(response.stats);
        })
        .catch((error) => {
            console.error("차트 데이터 조회 실패:", error);
        });
    };

    useEffect(() => {
        const start = getStartOfMonth();
        const end = getEndOfMonth();
        setStartDate(start);
        setEndDate(end);

        fetchConsumptionHistory(start, end);
        fetchChartData(chartPeriod);
    }, []);

    // 차트 기간 변경
    const handleChartPeriodChange = (period) => {
        setChartPeriod(period);
        fetchChartData(period);
    };

    // 카테고리별 필터링
    const handleCategoryFilter = (category) => {
        setCategoryFilter(category);
    };

    // 필터링된 소비 내역
    const filteredConsumList = categoryFilter === 'all'
        ? consumList
        : consumList.filter(item => item.category === categoryFilter);

    // 총 이용금액 계산
    const calculateTotalAmount = () => {
        return filteredConsumList.reduce((total, item) => total + item.amount, 0);
    };

    // 카테고리 목록 생성
    const getCategories = () => {
        const categories = [...new Set(consumList.map(item => item.category))];
        return categories.filter(cat => cat && cat !== '');
    };

    return (
        <div>
            <Header />
            <div className="consumption-container">
                {/* 음성 안내 메시지 */}
                {voiceRecognitionSupported && (
                    <div className="voice-guide-container">
                        <div className="voice-guide-message">
                            💬 <strong>똑똑 챗봇에게 말해보세요!</strong><br/>
                            "5000원 점심 먹었어", "3만원 마트에서 장봤어" 등
                        </div>
                    </div>
                )}

                <ConsumCard
                    cardlist={userInfo}
                    handleOpenModal={handleOpenDateModal}
                    startDate={startDate}
                    endDate={endDate}
                    totalAmount={calculateTotalAmount()}
                    summaryData={summaryData}
                />

                {/* 차트 섹션 - 노인분들을 위한 큰 그래프 */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2 className="chart-title">📊 소비 현황</h2>
                        <div className="chart-period-buttons">
                            <button 
                                className={`period-btn ${chartPeriod === 'daily' ? 'active' : ''}`}
                                onClick={() => handleChartPeriodChange('daily')}
                            >
                                일별
                            </button>
                            <button 
                                className={`period-btn ${chartPeriod === 'weekly' ? 'active' : ''}`}
                                onClick={() => handleChartPeriodChange('weekly')}
                            >
                                주별
                            </button>
                            <button 
                                className={`period-btn ${chartPeriod === 'monthly' ? 'active' : ''}`}
                                onClick={() => handleChartPeriodChange('monthly')}
                            >
                                월별
                            </button>
                        </div>
                    </div>
                    
                    {chartData && (
                        <ExpenseChart 
                            data={chartData} 
                            period={chartPeriod}
                        />
                    )}
                </div>

                {isLoading ? (
                    <div className='loading-container'>
                        <p>소비 내역을 불러오는 중...</p>
                    </div>
                ) : filteredConsumList.length !== 0 ? (
                    <>
                        <div className="category-filter-container">
                            <button
                                className={`category-filter-button ${categoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => handleCategoryFilter('all')}>
                                전체
                            </button>
                            {getCategories().map((category, index) => (
                                <button
                                    key={index}
                                    className={`category-filter-button ${categoryFilter === category ? 'active' : ''}`}
                                    onClick={() => handleCategoryFilter(category)}>
                                    {category}
                                </button>
                            ))}
                        </div>
                        <ConsumList
                            setIsOpenDetail={setIsOpenDetail}
                            setCardDetail={setCardDetail}
                            consumList={filteredConsumList}
                        />
                    </>
                ) : (
                    <div className='no-data-container'>
                        <img
                            src={info}
                            alt="내역없음"
                            className="no-data-image"
                        />
                        <p className='no-data-text'>소비 내역이 없습니다.</p>
                        <p className='no-data-text'>
                            {voiceRecognitionSupported 
                                ? '똑똑 챗봇에게 "5000원 점심 먹었어"라고 말해보세요!' 
                                : '소비 내역을 직접 등록해주세요.'}
                        </p>
                    </div>
                )}

                <ConsumDetailModal
                    isOpen={isOpenDetail}
                    closeModal={closeDetailModal}
                    cardDetail={cardDetail}
                />
                <ConsumDateModal
                    setConsumList={setConsumList}
                    isOpen={isOpenDate}
                    closeModal={closeDateModal}
                    updateDates={updateDates}
                    startDate={startDate}
                    endDate={endDate}
                    setSummaryData={setSummaryData}
                />
            </div>
        </div>
    );
}

export default Consumption;