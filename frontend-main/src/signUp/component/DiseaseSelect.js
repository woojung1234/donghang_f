import React, { useEffect, useState } from 'react';
import SignUpHeader from './header/SignUpHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '../SignUpMain';

function DiseaseSelect(props) {
    const navi = useNavigate();
    const { userInfo, handlechange } = useMember();
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const [selectedDiseases, setSelectedDiseases] = useState([]);
    const [customDisease, setCustomDisease] = useState('');

    // 질병 목록 정의
    const diseaseOptions = [
        { id: 'none', name: '없음', category: 'none' },
        { id: 'diabetes', name: '당뇨병', category: 'chronic' },
        { id: 'hypertension', name: '고혈압', category: 'chronic' },
        { id: 'heart_disease', name: '심장병', category: 'chronic' },
        { id: 'arthritis', name: '관절염', category: 'chronic' },
        { id: 'stroke', name: '뇌졸중', category: 'chronic' },
        { id: 'cancer', name: '암', category: 'serious' },
        { id: 'kidney_disease', name: '신장질환', category: 'chronic' },
        { id: 'liver_disease', name: '간질환', category: 'chronic' },
        { id: 'lung_disease', name: '폐질환', category: 'chronic' },
        { id: 'osteoporosis', name: '골다공증', category: 'chronic' },
        { id: 'depression', name: '우울증', category: 'mental' },
        { id: 'dementia', name: '치매', category: 'mental' },
    ];

    useEffect(() => {
        // 적어도 하나의 질병이 선택되거나 직접 입력이 있으면 다음 버튼 활성화
        setIsNextEnabled(selectedDiseases.length > 0 || customDisease.trim().length > 0);
    }, [selectedDiseases, customDisease]);

    // 질병 선택/해제 처리
    const handleDiseaseToggle = (diseaseId) => {
        let newSelectedDiseases;
        
        if (diseaseId === 'none') {
            // '없음' 선택 시 다른 모든 선택 해제하고 직접 입력도 초기화
            newSelectedDiseases = selectedDiseases.includes('none') ? [] : ['none'];
            if (!selectedDiseases.includes('none')) {
                setCustomDisease('');
            }
        } else {
            // 다른 질병 선택 시 '없음' 해제
            newSelectedDiseases = selectedDiseases.filter(id => id !== 'none');
            
            if (selectedDiseases.includes(diseaseId)) {
                // 이미 선택된 질병 해제
                newSelectedDiseases = newSelectedDiseases.filter(id => id !== diseaseId);
            } else {
                // 새로운 질병 추가
                newSelectedDiseases = [...newSelectedDiseases, diseaseId];
            }
        }
        
        setSelectedDiseases(newSelectedDiseases);
        updateUserDisease(newSelectedDiseases, customDisease);
    };

    // 직접 입력 처리
    const handleCustomDiseaseChange = (e) => {
        const value = e.target.value;
        setCustomDisease(value);
        
        // 직접 입력 시 '없음' 해제
        if (value.trim().length > 0) {
            const newSelectedDiseases = selectedDiseases.filter(id => id !== 'none');
            setSelectedDiseases(newSelectedDiseases);
            updateUserDisease(newSelectedDiseases, value);
        } else {
            updateUserDisease(selectedDiseases, value);
        }
    };

    // userInfo 업데이트 함수
    const updateUserDisease = (diseases, customInput) => {
        const selectedDiseaseNames = diseases.map(id => 
            diseaseOptions.find(disease => disease.id === id)?.name
        ).filter(Boolean);
        
        // 직접 입력 내용도 포함
        if (customInput.trim().length > 0) {
            selectedDiseaseNames.push(customInput.trim());
        }
        
        handlechange({
            target: {
                name: 'userDisease',
                value: selectedDiseaseNames.join(', ')
            }
        });
    };

    const handleNextClick = () => {
        if (isNextEnabled) {
            navi("/signup/verifycode");
        }
    };

    const getCategoryTitle = (category) => {
        switch (category) {
            case 'none': return '해당사항 없음';
            case 'chronic': return '만성질환';
            case 'serious': return '중증질환';
            case 'mental': return '정신건강';
            default: return '';
        }
    };

    const groupedDiseases = diseaseOptions.reduce((groups, disease) => {
        const category = disease.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(disease);
        return groups;
    }, {});

    // 선택된 항목들과 직접 입력 내용 합치기
    const getAllSelectedItems = () => {
        const selectedNames = selectedDiseases.map(id => 
            diseaseOptions.find(disease => disease.id === id)?.name
        ).filter(Boolean);
        
        if (customDisease.trim().length > 0) {
            selectedNames.push(customDisease.trim());
        }
        
        return selectedNames;
    };

    return (
        <div className="disease-select-container">
            <SignUpHeader/>
            <div className="signup-container">
                <div className="disease-select-title">
                    <h2>지병이 있으시다면 선택해주세요</h2>
                    <p className="disease-select-subtitle">
                        복지 서비스 이용 시 맞춤형 서비스 제공을 위해 사용됩니다<br/>
                        (복수 선택 가능)
                    </p>
                </div>
                
                <div className="disease-categories">
                    {Object.entries(groupedDiseases).map(([category, diseases]) => (
                        <div key={category} className="disease-category">
                            <h3 className="category-title">{getCategoryTitle(category)}</h3>
                            <div className="disease-options">
                                {diseases.map(disease => (
                                    <div 
                                        key={disease.id} 
                                        className={`disease-option ${
                                            selectedDiseases.includes(disease.id) ? 'selected' : ''
                                        } ${disease.category === 'none' ? 'none-option' : ''}`}
                                        onClick={() => handleDiseaseToggle(disease.id)}
                                    >
                                        <span className="disease-name">{disease.name}</span>
                                        <span className="disease-checkbox">
                                            {selectedDiseases.includes(disease.id) ? '✓' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 직접 입력 필드 */}
                <div className="custom-disease-input">
                    <h3 className="category-title">직접 입력</h3>
                    <input
                        type="text"
                        className="signup-input custom-disease-field"
                        placeholder="다른 지병이 있다면 직접 입력해주세요"
                        value={customDisease}
                        onChange={handleCustomDiseaseChange}
                        disabled={selectedDiseases.includes('none')}
                    />
                    <p className="custom-disease-help">
                        예: 갑상선질환, 알레르기, 천식 등
                    </p>
                </div>
                
                {getAllSelectedItems().length > 0 && (
                    <div className="selected-diseases-summary">
                        <p><strong>선택된 항목:</strong></p>
                        <p>{getAllSelectedItems().join(', ')}</p>
                    </div>
                )}
            </div>
            
            {/* 버튼을 맨 아래로 이동 */}
            <div className="signUpBtn disease-select-buttons">
                <Link to="../infoinput" className="signup-backBtn">이전</Link>
                <button
                    onClick={handleNextClick}
                    className={`signup-nextBtn ${isNextEnabled ? '' : 'disabled'}`}
                    disabled={!isNextEnabled}
                >
                다음
                </button>
            </div>
        </div>
    );
}

export default DiseaseSelect;