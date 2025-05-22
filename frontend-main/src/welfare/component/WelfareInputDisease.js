import React, { useEffect, useState } from 'react';
import styles from 'welfare/css/WelfareInputDisease.module.css';
import check from "image/check.png";
import checked from "image/checked.png";
import { useNavigate } from 'react-router-dom';
import Header from 'header/Header.js';
import { useSpecHook } from 'welfare/component/WelfareInputTotal';

function WelfareInputDisease() {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDiseases, setSelectedDiseases] = useState([]); // 배열로 유지
  const [otherDisease, setOtherDisease] = useState('');
  const navigate = useNavigate();

  const {userSpec, setUserSpec} = useSpecHook();

  // '다음' 버튼이 활성화되는 조건을 체크
  const isNextButtonEnabled = () => {
    if (selectedId === 'no-disease') {
      return true;
    }
    if (selectedId === 'yes-disease') {
      return selectedDiseases.length > 0 || otherDisease.trim() !== '';
    }
    return false;
  };

  // 기저질환 버튼 클릭 시
  const handleClick = (id) => {
    setSelectedId(id);
    if (id === 'no-disease') {
      setSelectedDiseases([]);
      setOtherDisease('');
      setUserSpec({...userSpec, userDisease: '기저질환이 없습니다.'});
    }
  };

  // 기저질환 중 하나를 선택했을 때
  const handleDiseaseClick = (disease) => {
    let updatedDiseases;
    if (selectedDiseases.includes(disease)) {
      // 이미 선택된 질환이면 배열에서 제거
      updatedDiseases = selectedDiseases.filter(d => d !== disease);
    } else {
      // 선택되지 않은 질환이면 배열에 추가
      updatedDiseases = [...selectedDiseases, disease];
    }

    setSelectedDiseases(updatedDiseases);
    setOtherDisease(''); // 기타 질환을 초기화 (선택된 질환이 있는 경우)

    // 기저질환과 기타질환을 문자열로 합쳐 userDisease로 설정
    const combinedDiseases = [...updatedDiseases, otherDisease].filter(Boolean).join(', ');
    setUserSpec({...userSpec, userDisease: combinedDiseases});
  };

  useEffect(()=> {
    const combinedDiseases = [...selectedDiseases, otherDisease].filter(Boolean).join(', ');
    setUserSpec({...userSpec, userDisease: combinedDiseases});
    console.log("Updated userSpec:", userSpec);
  }, [selectedDiseases, otherDisease]);

  // 기타 질환 입력 핸들러
  const handleOtherDiseaseChange = (event) => {
    setOtherDisease(event.target.value);
    const combinedDiseases = [...selectedDiseases, event.target.value].filter(Boolean).join(', ');
    setUserSpec({...userSpec, userDisease: combinedDiseases});
  };

  // '다음' 버튼 클릭 핸들러
  const goCheckSpec = () => {
    if (isNextButtonEnabled()) {
      navigate('/welfare-input/check-spec');
    }
  };

  const getStyle = (id) => {
    return {
      borderColor: selectedId === id ? '#80BAFF' : '',
    };
  };

  const renderContent = () => {
    if (selectedId === 'yes-disease') {
      return (
        <div className={styles["disease-list-container"]}>
          <div className={styles["disease-list-section1"]}>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('뇌졸중') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('뇌졸중')}
            >
              뇌졸중
            </p>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('심근경색') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('심근경색')}
            >
              심근경색
            </p>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('고혈압') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('고혈압')}
            >
              고혈압
            </p>
          </div>
          <div className={styles["disease-list-section2"]}>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('당뇨병') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('당뇨병')}
            >
              당뇨병
            </p>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('이상지질 혈증') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('이상지질 혈증')}
            >
              이상지질 혈증
            </p>
            <p
              className={`${styles["disease-list-button"]} ${selectedDiseases.includes('폐 결핵') ? styles["selected-disease"] : ''}`}
              onClick={() => handleDiseaseClick('폐 결핵')}
            >
              폐 결핵
            </p>
          </div>
          <p className={styles["info-guitar"]}>기타</p>
          <input
            className={styles["input-guitar"]}
            placeholder="기타질환을 입력 해주세요"
            value={otherDisease}
            onChange={handleOtherDiseaseChange}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles["main-container"]}>
        <div className={styles["infomation-container"]}>
          <p className={styles.infomation}>가지고 계신</p>
          <p className={styles.infomation}>질환이 있나요?</p>
        </div>

        <div className={styles["disease-container"]}>
          <div
            className={styles["input-no-disease"]}
            style={getStyle('no-disease')}
            onClick={() => handleClick('no-disease')}
          >
            <button className={styles["disease-section"]}>기저질환이 없어요</button>
            <img
              src={selectedId === 'no-disease' ? checked : check}
              alt="체크"
              className={styles["img-check"]}
            />
          </div>

          <div
            className={styles["input-yes-disease"]}
            style={getStyle('yes-disease')}
            onClick={() => handleClick('yes-disease')}
          >
            <button className={styles["disease-section"]}>기저질환이 있어요</button>
            <img
              src={selectedId === 'yes-disease' ? checked : check}
              alt="체크"
              className={styles["img-check"]}
            />
          </div>
        </div>

        <div className={styles["content-display"]}>{renderContent()}</div>

        <div
          className= {styles["go-check-spec"]}
          onClick={goCheckSpec}
         
        >
          <p className={styles["go-check-spec-text"]}
           style={{
            backgroundColor: isNextButtonEnabled() ? '#80BAFF' : 'rgba(128, 186, 255, 0.5)',
            cursor: isNextButtonEnabled() ? 'pointer' : 'not-allowed',
          }}>다음</p>
        </div>
      </div>
    </div>
  );
}

export default WelfareInputDisease;
