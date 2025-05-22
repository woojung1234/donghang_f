import React, { useState } from 'react';
import styles from 'welfare/css/WelfareInputGender.module.css'; // CSS 모듈 import
import male from 'image/male.png';
import female from 'image/female.png';
import { useNavigate } from 'react-router-dom';
import Header from 'header/Header.js';
import { useSpecHook } from 'welfare/component/WelfareInputTotal';

function WelfareInputGender() {
    const [selectedGender, setSelectedGender] = useState(null);
    const navigate = useNavigate();

    const { userSpec, setUserSpec } = useSpecHook();

    const goInputAddress = () => {
        if (selectedGender) {
            const userGender = selectedGender === '남성' ? 1 : 2; // 성별을 int로 변환
            setUserSpec({ ...userSpec, userGender });  // 변환된 성별을 userSpec에 저장
            navigate('/welfare-input/address');
        }
    };

    // 성별 버튼 클릭 시
    const handleGenderClick = (gender) => {
        if (selectedGender === gender) {
            setSelectedGender(null);  // 이미 선택된 성별을 다시 클릭하면 선택 해제
        } else {
            setSelectedGender(gender);  // 성별 선택 시
        }
    };

    return (
        <div className={styles.container}>
            <Header />

            <div className={styles["main-container"]}>
                <div className={styles["infomation-container"]}>
                    <p className={styles.infomation}>성별은</p>
                    <p className={styles.infomation}>어떻게 되시나요?</p>
                </div>

                <div className={styles["gender-container"]}>
                    <div
                        className={`${styles["gender-section"]}`}
                        onClick={() => handleGenderClick('남성')}
                        style={{
                            border: selectedGender === '남성' ? '4px solid #80BAFF' : '4px solid transparent'
                        }}
                    >
                        <img src={male} alt="남성" className={styles["image-gender"]} />
                        <p className={styles["gender-text"]}>남성</p>
                    </div>
                    <div
                        className={`${styles["gender-section"]}`}
                        onClick={() => handleGenderClick('여성')}
                        style={{
                            border: selectedGender === '여성' ? '4px solid #FF5959' : '4px solid transparent'
                        }}
                    >
                        <img src={female} alt="여성" className={styles["image-gender"]} />
                        <p className={styles["gender-text"]}>여성</p>
                    </div>
                </div>

                <div
                    className={styles["go-input-address"]}
                    onClick={goInputAddress}>
                    <p className={styles["go-input-address-text"]}
                    style={{
                        backgroundColor: selectedGender ? '#80BAFF' : 'rgba(128, 186, 255, 0.5)',
                        cursor: selectedGender ? 'pointer' : 'not-allowed',
                    }}>다음</p>
                </div>
            </div>
        </div>
    );
}

export default WelfareInputGender;
