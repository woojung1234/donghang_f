// 파일: src/consume/Consumption.js
// 오류 수정: category, setCardDetail, cardDetail 변수 정의

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
    // cardList 대신 사용자 정보로 변경하되 기존 구조 유지
    const userInfo = location.state?.value || {};

    const [isOpenDetail, setIsOpenDetail] = useState(false);
    const [isOpenDate, setIsOpenDate] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [consumList, setConsumList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [summaryData, setSummaryData] = useState(null);

    // 음성 입력 관련 상태 추가
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // 누락된 상태 변수들 추가
    const [cardDetail, setCardDetail] = useState({});

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
    };

    const handleOpenDateModal = () => {
        setIsOpenDate(true);
    };

    const closeDetailModal = () => setIsOpenDetail(false);
    const closeDateModal = () => setIsOpenDate(false);

    useEffect(() => {
        document.body.classList.toggle("unscrollable", isOpenDetail || isOpenDate);
    }, [isOpenDetail, isOpenDate]);

    // 기존 카드 내역 조회를 사용자 소비 내역 조회로 변경 (API 엔드포인트는 유지)
    const fetchConsumptionHistory = (start, end) => {
        setIsLoading(true);
        console.log("Fetching consumption history with dates:", start, end);

        // 기존 API 엔드포인트 유지하되 파라미터에서 cardId 제거
        call('/api/card-history', "GET", {
            startDate: start,
            endDate: end
        })
        .then((response) => {
            console.log("Consumption history response:", response);
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

        // 요약 정보도 동일하게 수정
        call('/api/card-history/summary', "GET", {
            startDate: start,
            endDate: end
        })
        .then((response) => {
            console.log("Consumption summary response:", response);
            setSummaryData(response);
        })
        .catch((error) => {
            console.error("내역 요약 조회 실패:", error);
        });
    };

    // 음성 인식 초기화
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.lang = 'ko-KR';
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleVoiceResult(transcript);
            };

            recognitionInstance.onend = () => {
                setIsRecording(false);
            };

            recognitionInstance.onerror = (event) => {
                console.error('음성 인식 오류:', event.error);
                setIsRecording(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    useEffect(() => {
        const start = getStartOfMonth();
        const end = getEndOfMonth();
        setStartDate(start);
        setEndDate(end);

        // 초기 로딩 시 사용자의 소비 내역 조회
        fetchConsumptionHistory(start, end);
    }, []);

    // 음성 입력 시작
    const handleVoiceInput = () => {
        if (recognition && !isRecording) {
            setIsRecording(true);
            recognition.start();
        }
    };

    // 음성 인식 결과 처리
    const handleVoiceResult = (transcript) => {
        console.log('음성 인식 결과:', transcript);

        // 음성 텍스트를 파싱하여 소비 데이터로 변환
        const parsedData = parseVoiceToConsumption(transcript);

        if (parsedData) {
            // 파싱된 데이터를 서버에 저장 (기존 API 사용)
            saveVoiceConsumption(parsedData);
        }
    };

    // 음성 텍스트를 소비 데이터로 파싱
    const parseVoiceToConsumption = (text) => {
        // 간단한 파싱 로직 (나중에 AI로 고도화 가능)
        const amountMatch = text.match(/(\d+(?:천|만)?원?|\d+)/);
        const amount = amountMatch ? parseKoreanNumber(amountMatch[1]) : 0;

        if (amount > 0) {
            return {
                description: text.replace(/\d+(?:천|만)?원?|\d+/g, '').trim() || '음성 입력 소비',
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                merchantCategory: inferCategory(text), // category 대신 merchantCategory 사용
                merchant: inferMerchant(text)
            };
        }
        return null;
    };

    // 한국어 숫자 파싱
    const parseKoreanNumber = (str) => {
        let num = str.replace(/원/g, '');
        if (num.includes('천')) {
            return parseInt(num.replace('천', '')) * 1000;
        } else if (num.includes('만')) {
            return parseInt(num.replace('만', '')) * 10000;
        }
        return parseInt(num) || 0;
    };

    // 카테고리 추론
    const inferCategory = (text) => {
        if (text.includes('커피') || text.includes('음식') || text.includes('식사')) return '식비';
        if (text.includes('택시') || text.includes('버스') || text.includes('지하철')) return '교통비';
        if (text.includes('병원') || text.includes('약국')) return '의료비';
        if (text.includes('마트') || text.includes('쇼핑')) return '생활용품';
        return '기타';
    };

    // 가맹점 추론
    const inferMerchant = (text) => {
        if (text.includes('스타벅스')) return '스타벅스';
        if (text.includes('이마트')) return '이마트';
        if (text.includes('CGV')) return 'CGV';
        return '일반가맹점';
    };

    // 음성으로 입력된 소비 내역 저장
    const saveVoiceConsumption = (data) => {
        // 기존 API 엔드포인트 활용
        call('/api/card-history', 'POST', data)
        .then((response) => {
            console.log('음성 소비 내역 저장 성공:', response);
            // 저장 후 목록 새로고침
            fetchConsumptionHistory(startDate, endDate);
        })
        .catch((error) => {
            console.error('음성 소비 내역 저장 실패:', error);
        });
    };

    // 카테고리별 필터링
    const handleCategoryFilter = (category) => {
        setCategoryFilter(category);
    };

    // 필터링된 소비 내역 (수정: category를 categoryFilter와 비교)
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
                    cardlist={userInfo}
                    handleOpenModal={handleOpenDateModal}
                    startDate={startDate}
                    endDate={endDate}
                    totalAmount={calculateTotalAmount()}
                    summaryData={summaryData}
                    isRecording={isRecording}
                    onVoiceInput={handleVoiceInput}
                />

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
                        <p className='no-data-text'>소비 내역이 없습니다.</p>
                        <p className='no-data-text'>음성으로 소비 내역을 입력해보세요!</p>
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