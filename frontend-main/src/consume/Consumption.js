import "consume/Consumption.css";
import Header from 'header/Header';
import { call } from "login/service/ApiService";
import { useEffect, useState } from 'react';
import ConsumCard from "./component/ConsumCard";
import ConsumDateModal from './component/ConsumDateModal';
import ConsumDetailModal from './component/ConsumDetailModal';
import ConsumList from './component/ConsumList';
import { useLocation } from "react-router-dom";
import info from "image/icon/info.png";

function Consumption() {
    const location = useLocation();
    const cardList = location.state?.value || {};

    const [isOpenDetail, setIsOpenDetail] = useState(false);
    const [isOpenDate, setIsOpenDate] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [consumList, setConsumList] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [cardDetail, setCardDetail] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [summaryData, setSummaryData] = useState(null);
    
    // 한국 시간으로 날짜를 반환하는 함수
    const getKSTDate = (date) => {
        const offset = 9 * 60; // 한국 시간대는 UTC+9
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
        fetchCardHistory(start, end);
    };

    const handleOpenDateModal = (cardId) => {
        setSelectedCardId(cardId);
        setIsOpenDate(true);
    };

    const closeDetailModal = () => setIsOpenDetail(false);
    const closeDateModal = () => setIsOpenDate(false);

    useEffect(() => {
        document.body.classList.toggle("unscrollable", isOpenDetail || isOpenDate);
    }, [isOpenDetail, isOpenDate]);

    const fetchCardHistory = (start, end) => {
        setIsLoading(true);
        console.log("Fetching card history with dates:", start, end);
        
        // 카드 내역 가져오기
        call('/api/card-history', "GET", {
            cardId: cardList.cardId, 
            startDate: start, 
            endDate: end
        })
        .then((response) => {
            console.log("Card history response:", response);
            if (response.cardHistory) {
                setConsumList(response.cardHistory);
            } else {
                setConsumList(response);
            }
            setIsLoading(false);
        })
        .catch((error) => {
            console.error("내역 조회 실패:", error);
            setIsLoading(false);
        });
        
        // 카드 내역 요약 정보 가져오기
        call('/api/card-history/summary', "GET", {
            cardId: cardList.cardId, 
            startDate: start, 
            endDate: end
        })
        .then((response) => {
            console.log("Card summary response:", response);
            setSummaryData(response);
        })
        .catch((error) => {
            console.error("내역 요약 조회 실패:", error);
        });
    };

    useEffect(() => {
        const start = getStartOfMonth();
        const end = getEndOfMonth();
        setStartDate(start);
        setEndDate(end);
        
        if (cardList.cardId) {
            fetchCardHistory(start, end);
        }
    }, [cardList.cardId]);

    // 카테고리별 필터링
    const handleCategoryFilter = (category) => {
        setCategoryFilter(category);
    };

    // 필터링된 소비 내역
    const filteredConsumList = categoryFilter === 'all' 
        ? consumList 
        : consumList.filter(item => item.merchantCategory === categoryFilter);

    // 총 이용금액 계산
    const calculateTotalAmount = () => {
        return filteredConsumList.reduce((total, item) => total + item.amount, 0);
    };

    return (
        <div>
            <Header />
            <div className="consumption-container">
                <ConsumCard 
                    cardlist={cardList}
                    handleOpenModal={handleOpenDateModal}
                    startDate={startDate}
                    endDate={endDate}
                    totalAmount={calculateTotalAmount()}
                    summaryData={summaryData}
                />

                {isLoading ? (
                    <div className='loading-container'>
                        <p>카드 내역을 불러오는 중...</p>
                    </div>
                ) : filteredConsumList.length !== 0 ? (
                    <>
                        <div className="category-filter-container">
                            <button 
                                className={`category-filter-button ${categoryFilter === 'all' ? 'active' : ''}`} 
                                onClick={() => handleCategoryFilter('all')}>
                                전체
                            </button>
                            {summaryData?.categorySummary?.map((category, index) => (
                                <button 
                                    key={index}
                                    className={`category-filter-button ${categoryFilter === category._id ? 'active' : ''}`} 
                                    onClick={() => handleCategoryFilter(category._id)}>
                                    {category._id}
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
                        <p className='no-data-text'>카드 내역이 없습니다.</p>
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
                    cardId={selectedCardId} 
                    startDate={startDate}
                    endDate={endDate}
                    setSummaryData={setSummaryData}
                />
            </div>
        </div>
    );
}

export default Consumption;