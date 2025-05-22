import React, { useState, useEffect } from 'react';
import styles from 'welfare/css/WelfareInputHeight.module.css'; // CSS 모듈 import
import { useNavigate } from 'react-router-dom';
import Header from 'header/Header.js';
import { useSpecHook } from 'welfare/component/WelfareInputTotal';

function WelfareInputHeight() {
    const [userHeight, setHeight] = useState('');
    const [userWeight, setWeight] = useState('');
    const navigate = useNavigate();

    const {userSpec, setUserSpec} = useSpecHook();

    useEffect(() => {
        const newUserSpec = { ...userSpec, userHeight, userWeight };
        setUserSpec(newUserSpec);
        console.log("Updated userSpec:", newUserSpec); // 최신 상태의 userSpec 로그 출력
    }, [userHeight, userWeight]);

    const goInputGender = () => {
        if (userHeight && userWeight) {
            navigate('/welfare-input/gender');
        }
    };

    // userHeight와 userWeight의 상태를 업데이트하고 3자리로 제한하는 함수
    const handleHeightChange = (e) => {
        const value = e.target.value;
        const numericValue = parseInt(value, 10); // 문자열을 정수로 변환
        if (!isNaN(numericValue) && numericValue.toString().length <= 3) {
            setHeight(numericValue);
        }
    };
    
    const handleWeightChange = (e) => {
        const value = e.target.value;
        const numericValue = parseInt(value, 10); // 문자열을 정수로 변환
        if (!isNaN(numericValue) && numericValue.toString().length <= 3) {
            setWeight(numericValue);
        }
    };

    const handleFocus = (e) => {
        e.target.placeholder = '';
    };

    const handleBlur = (e, originalPlaceholder) => {
        e.target.placeholder = originalPlaceholder;
    };

    return (
        <div className={styles.container}>
            <Header />

            <div className={styles["main-container"]}>
                <div className={styles["infomation-container"]}>
                    <p className={styles.infomation}>키와 몸무게를</p>
                    <p className={styles.infomation}>입력해 주세요</p>
                </div>

                <div className={styles["input-container"]}>
                    <input
                        className={styles["input-height"]}
                        type="number"
                        placeholder="키"
                        value={userHeight}
                        onChange={handleHeightChange}
                        onFocus={handleFocus}
                        onBlur={(e) => handleBlur(e, '키')}
                    />
                    <span className={styles.cm}>cm</span>
                    <input
                        className={styles["input-weight"]}
                        type="number"
                        placeholder="몸무게"
                        value={userWeight}
                        onChange={handleWeightChange}
                        onFocus={handleFocus}
                        onBlur={(e) => handleBlur(e, '몸무게')}
                    />
                    <span className={styles.kg}>kg</span>
                </div>

                <div
                    className={styles["go-input-gender"]}
                    onClick={goInputGender}>
                    <p className={styles["go-input-gender-text"]}
                    style={{
                        backgroundColor: userHeight && userWeight ? '#80BAFF' : 'rgba(128,186,255,0.5)',
                    }}>다음</p>
                </div>
            </div>
        </div>
    );
}

export default WelfareInputHeight;
