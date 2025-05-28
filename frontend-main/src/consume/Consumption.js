// 파일: src/consume/Consumption.js
// 노인분들을 위한 가계부 기능 - AI챗봇 연동 및 큰 그래프

import "consume/Consumption.css";
import Header from 'header/Header';
import { call } from "login/service/ApiService";
import { useEffect, useState } from 'react';
import ConsumCard from "./component/ConsumCard";
import InlineDatePicker from './component/InlineDatePicker';
import ConsumDetailModal from './component/ConsumDetailModal';
import ConsumList from './component/ConsumList';
import ExpenseChart from './component/ExpenseChart';
import { useLocation, useNavigate } from "react-router-dom";
import info from "image/icon/info.png";

function Consumption() {
    const location = useLocation();
    const navigate = useNavigate();
    const userInfo = location.state?.value || {};

    const [isOpenDetail, setIsOpenDetail] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false); // 인라인 날짜 선택기 상태 추가
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
    const [error, setError] = useState(null);

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
        setShowDatePicker(!showDatePicker); // 모달 대신 인라인 달력 토글
    };

    const closeDetailModal = () => setIsOpenDetail(false);

    // 음성 채팅으로 이동하는 함수
    const goToVoiceChat = () => {
        navigate('/voicechat');
    };

    useEffect(() => {
        document.body.classList.toggle("unscrollable", isOpenDetail);
    }, [isOpenDetail]);

    // 음성 인식 지원 확인
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setVoiceRecognitionSupported(true);
        }
    }, []);

    // 소비 내역 조회 - API 경로 수정
    const fetchConsumptionHistory = (start, end) => {
        setIsLoading(true);
        setError(null);
        console.log("Fetching consumption history with dates:", start, end);

        // 올바른 API 경로로 수정 (/api/v1/consumption)
        call('/api/v1/consumption', "GET", {
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
            setError("소비 내역을 불러오는데 실패했습니다. 나중에 다시 시도해주세요.");
            setIsLoading(false);
        });
    };

    // 차트 데이터 조회 - API 경로 수정
    const fetchChartData = (period) => {
        // 올바른 API 경로로 수정 (/api/v1/consumption/stats)
        call(`/api/v1/consumption/stats/${period}`, "GET")
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
        return filteredConsumList.reduce((total, item) => {
            // amount를 안전하게 숫자로 변환
            const amount = parseFloat(item.amount) || 0;
            console.log('💰 아이템:', item.merchantName, '원본 금액:', item.amount, '변환된 금액:', amount);
            return total + amount;
        }, 0);
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
                            💬 <strong>금복이 챗봇에게 말해보세요!</strong><br/>
                            "5000원 점심 먹었어", "3만원 마트에서 장봤어" 등
                            <button className="go-to-chat-btn" onClick={goToVoiceChat}>
                                🎤 음성 채팅으로 가기
                            </button>
                        </div>
                    </div>
                )}

                {/* 요약 정보 */}
                <ConsumCard
                    cardlist={userInfo}
                    handleOpenModal={handleOpenDateModal}
                    startDate={startDate}
                    endDate={endDate}
                    totalAmount={calculateTotalAmount()}
                    summaryData={summaryData}
                />

                {/* 인라인 날짜 선택기 */}
                {showDatePicker && (
                    <InlineDatePicker
                        setConsumList={setConsumList}
                        updateDates={updateDates}
                        startDate={startDate}
                        endDate={endDate}
                        setSummaryData={setSummaryData}
                        onClose={() => setShowDatePicker(false)}
                    />
                )}

                {/* 차트 섹션 - 소비 추이, 카테고리별 소비 비율, 요약 정보 */}
                <div className="chart-section">
                    <div className="chart-header">
                        <h2 className="chart-title">📊 소비 분석</h2>
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
                    
                    {isLoading ? (
                        <div className='loading-container'>
                            <p>소비 데이터를 불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <div className='error-container'>
                            <p className='error-text'>{error}</p>
                            <button 
                                className="retry-button" 
                                onClick={() => fetchConsumptionHistory(startDate, endDate)}
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : chartData ? (
                        <ExpenseChart 
                            data={chartData} 
                            period={chartPeriod}
                        />
                    ) : (
                        <div className='no-data-container'>
                            <p className='no-data-text'>
                                {voiceRecognitionSupported 
                                    ? '금복이 챗봇에게 "5000원 점심 먹었어"라고 말해보세요!' 
                                    : '소비 내역을 직접 등록해주세요.'}
                            </p>
                            <button className="go-to-chat-btn-large" onClick={goToVoiceChat}>
                                🎤 음성 채팅으로 가기
                            </button>
                        </div>
                    )}
                </div>

                {/* 카테고리 필터와 소비 내역 리스트 */}
                {isLoading ? (
                    <div className='loading-container'>
                        <p>소비 내역을 불러오는 중...</p>
                    </div>
                ) : error ? (
                    <div className='error-container'>
                        <p className='error-text'>{error}</p>
                        <button 
                            className="retry-button" 
                            onClick={() => fetchConsumptionHistory(startDate, endDate)}
                        >
                            다시 시도
                        </button>
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
                        <p className='no-data-text'>
                            {voiceRecognitionSupported 
                                ? '금복이 챗봇에게 "5000원 점심 먹었어"라고 말해보세요!' 
                                : '소비 내역을 직접 등록해주세요.'}
                        </p>
                        <button className="go-to-chat-btn-large" onClick={goToVoiceChat}>
                            🎤 음성 채팅으로 가기
                        </button>
                    </div>
                )}

                <ConsumDetailModal
                    isOpen={isOpenDetail}
                    closeModal={closeDetailModal}
                    cardDetail={cardDetail}
                />
            </div>
        </div>
    );
}

export default Consumption;
