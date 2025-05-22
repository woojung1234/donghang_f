import React, { useEffect, useState } from 'react';
import styles from 'welfare/css/WelfareInputBirth.module.css';
import { useNavigate } from 'react-router-dom';
import Header from 'header/Header.js';
import { useSpecHook } from 'welfare/component/WelfareInputTotal';

function WelfareInputBirth() {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [yearPlaceholder, setYearPlaceholder] = useState('년');
    const [monthPlaceholder, setMonthPlaceholder] = useState('월');
    const [dayPlaceholder, setDayPlaceholder] = useState('일');
    const navigate = useNavigate();

    const {userSpec, setUserSpec} = useSpecHook();
    
    // 현재 연도 가져오기
    const currentYear = new Date().getFullYear();

    useEffect(()=> {
        if (year && month && day) {
            const birthDate = new Date(year, month - 1, day); // Date 객체로 생성

            const newUserSpec = {...userSpec, userBirth: birthDate, protegeBirth: birthDate}; // Date 객체로 userBirth 저장
            setUserSpec(newUserSpec);
            console.log("Updated userSpec:", newUserSpec); // 최신 상태의 userSpec 로그 출력
        }
    }, [year, month, day]); 

    const handleYearChange = (e) => {
        let value = e.target.value;
        if (value.length <= 4 && value <= currentYear) { // 현재 연도보다 큰 값을 막음
            setYear(value);
        } else if (value > currentYear) {
            setYear(''); // 현재 연도보다 크면 값을 비움
        }
    };

    const handleMonthChange = (e) => {
        let value = e.target.value;
        if (value > 12) {
            value = "";
        } else if (value < 1) {
            value = "";
        }
        setMonth(value);
    };

    const handleDayChange = (e) => {
        let value = e.target.value;
        if (value > 31) {
            value = "";
        } else if (value < 1) {
            value = "";
        }
        setDay(value);
    };

    const goInputHeight = () => {
        if (isButtonEnabled) { // 버튼이 활성화된 경우에만 이동
            navigate('/welfare-input/height');
        }
    };

    const handleFocus = (setPlaceholder) => {
        setPlaceholder('');
    };

    const handleBlur = (value, setPlaceholder, defaultPlaceholder) => {
        if (!value) {
            setPlaceholder(defaultPlaceholder);
        }
    };

    const isButtonEnabled = year.length === 4 && month && day;

    return (
        <div className={styles.container}>
            <Header />

            <div className={styles["main-container"]}>
                <div className={styles["infomation-container"]}>
                    <p className={styles.infomation}>생년월일을</p>
                    <p className={styles.infomation}>입력해 주세요</p>
                </div>

                <div className={styles["input-container"]}>
                    <input
                        className={styles["input-date"]}
                        type="number"
                        placeholder={yearPlaceholder}
                        value={year}
                        onChange={handleYearChange}
                        onFocus={() => handleFocus(setYearPlaceholder)}
                        onBlur={(e) => handleBlur(e.target.value, setYearPlaceholder, '년')}
                    />
                    <span className={styles["input-divide"]}>/</span>
                    <input
                        className={styles["input-date"]}
                        type="number"
                        placeholder={monthPlaceholder}
                        value={month}
                        onChange={handleMonthChange}
                        onFocus={() => handleFocus(setMonthPlaceholder)}
                        onBlur={(e) => handleBlur(e.target.value, setMonthPlaceholder, '월')}
                    />
                    <span className={styles["input-divide"]}>/</span>
                    <input
                        className={styles["input-date"]}
                        type="number"
                        placeholder={dayPlaceholder}
                        value={day}
                        onChange={handleDayChange}
                        onFocus={() => handleFocus(setDayPlaceholder)}
                        onBlur={(e) => handleBlur(e.target.value, setDayPlaceholder, '일')}
                    />
                </div>

                <div
                    className={styles["go-input-height"]}
                    onClick={goInputHeight}
                   
                >
                    <p className={styles["go-input-height-text"]}
                     style={{
                        backgroundColor: isButtonEnabled ? '#80BAFF' : 'rgba(128,186,255,0.5)'
                    }}>다음</p>
                </div>
            </div>
        </div>
    );
}

export default WelfareInputBirth;
