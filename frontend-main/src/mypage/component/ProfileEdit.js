import React, { useState, useEffect } from 'react';
import { call } from 'login/service/ApiService';

function ProfileEdit({ userInfo, onUpdate, onCancel }) {
    const [editUserInfo, setEditUserInfo] = useState({
        userName: '',
        userPhone: '',
        userBirth: '',
        userGender: '',
        userDisease: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        console.log('ProfileEdit - 받은 userInfo:', userInfo);
        if (userInfo) {
            setEditUserInfo({
                userName: userInfo.userName || '',
                userPhone: userInfo.userPhone || '',
                userBirth: userInfo.userBirth || '',
                userGender: userInfo.userGender || '',
                userDisease: userInfo.userDisease || ''
            });
        }
    }, [userInfo]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`ProfileEdit - ${name} 값 변경:`, value);
        setEditUserInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatPhoneNumber = (value) => {
        return value
            .replace(/[^0-9]/g, '')
            .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
    };

    const handlePhoneChange = (e) => {
        const { value } = e.target;
        const formattedValue = formatPhoneNumber(value);
        const cleanedValue = formattedValue.replace(/[^0-9]/g, '');
        
        setEditUserInfo(prev => ({
            ...prev,
            userPhone: cleanedValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        console.log('ProfileEdit - 수정할 정보:', editUserInfo);

        try {
            const response = await call('/api/v1/users', 'PUT', editUserInfo);
            console.log('ProfileEdit - 수정 성공:', response);
            onUpdate(response);
        } catch (error) {
            console.error('ProfileEdit - 수정 실패:', error);
            setErrorMessage('프로필 수정에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-edit-container">
            <div className="profile-edit-header">
                <h3>프로필 수정</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="profile-edit-form">
                <div className="edit-input-group">
                    <label>이름</label>
                    <input
                        type="text"
                        name="userName"
                        value={editUserInfo.userName}
                        onChange={handleInputChange}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </div>

                <div className="edit-input-group">
                    <label>전화번호</label>
                    <input
                        type="tel"
                        name="userPhone"
                        value={formatPhoneNumber(editUserInfo.userPhone)}
                        onChange={handlePhoneChange}
                        placeholder="전화번호를 입력하세요"
                        maxLength={13}
                        required
                    />
                </div>

                <div className="edit-input-group">
                    <label>생년월일</label>
                    <input
                        type="date"
                        name="userBirth"
                        value={editUserInfo.userBirth}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="edit-input-group">
                    <label>성별</label>
                    <select
                        name="userGender"
                        value={editUserInfo.userGender}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">성별 선택</option>
                        <option value="남성">남성</option>
                        <option value="여성">여성</option>
                    </select>
                </div>

                <div className="edit-input-group">
                    <label>지병</label>
                    <textarea
                        name="userDisease"
                        value={editUserInfo.userDisease}
                        onChange={handleInputChange}
                        placeholder="지병이 있다면 입력하세요 (없으면 '없음')"
                        rows={3}
                    />
                </div>

                {errorMessage && (
                    <div className="error-message">
                        {errorMessage}
                    </div>
                )}

                <div className="edit-buttons">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="cancel-btn"
                        disabled={isLoading}
                    >
                        취소
                    </button>
                    <button 
                        type="submit" 
                        className="save-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfileEdit;