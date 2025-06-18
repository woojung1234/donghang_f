import React, { useState, useEffect } from 'react';
import { call } from 'login/service/ApiService';
import styles from 'welfare/css/WelfareBookingModal.module.css';

function WelfareBookingModal({ service, onClose, onSuccess, voiceBookingData }) {
  const [formData, setFormData] = useState({
    // 예약 정보
    address: '',
    detailAddress: '',
    startDate: '',
    endDate: '',
    useTime: 1,
    specialRequest: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // 사용자 정보 가져오기 및 음성 예약 데이터 처리
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await call('/api/v1/users', 'GET');
        setUserInfo(response);
        console.log('사용자 정보 조회:', response);
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        setError('사용자 정보를 불러올 수 없습니다.');
      }
    };
    
    fetchUserInfo();
    
    // 음성 예약 데이터가 있으면 폼에 자동 입력
    if (voiceBookingData) {
      console.log('🎙️ 음성 예약 데이터를 폼에 적용:', voiceBookingData);
      console.log('🎙️ 원본 timeOption 값:', voiceBookingData.timeOption, '타입:', typeof voiceBookingData.timeOption);
      
      // timeOption 값 검증 및 변환
      let timeOptionValue = voiceBookingData.timeOption;
      if (typeof timeOptionValue === 'string') {
        timeOptionValue = parseInt(timeOptionValue);
      }
      
      console.log('🎙️ 변환된 timeOption 값:', timeOptionValue, '타입:', typeof timeOptionValue);
      
      setFormData(prev => {
        const newFormData = {
          ...prev,
          address: voiceBookingData.address || '',
          startDate: voiceBookingData.startDate || '',
          endDate: voiceBookingData.endDate || '',
          useTime: timeOptionValue || 1
        };
        
        console.log('🎙️ 설정될 폼 데이터:', newFormData);
        console.log('🎙️ useTime 최종 값:', newFormData.useTime, '타입:', typeof newFormData.useTime);
        
        return newFormData;
      });
    }
    
  }, [voiceBookingData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalPrice = () => {
    const timeValue = parseInt(formData.useTime);
    let actualHours = 0;
    
    // 시간 옵션에 따른 실제 시간 계산
    switch(timeValue) {
      case 1: actualHours = 3; break;  // 3시간
      case 2: actualHours = 6; break;  // 6시간  
      case 3: actualHours = 9; break;  // 9시간
      default: actualHours = timeValue;
    }
    
    return service.welfarePrice * actualHours;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInfo) {
      setError('사용자 정보를 불러올 수 없습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }
    
    if (!formData.address) {
      setError('주소를 입력해주세요.');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('종료일은 시작일보다 늦어야 합니다.');
      return;
    }

    const today = new Date();
    const startDate = new Date(formData.startDate);
    if (startDate < today.setHours(0, 0, 0, 0)) {
      setError('시작일은 오늘 이후여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        welfareNo: service.welfareNo,
        // 사용자 정보에서 가져오기
        userName: userInfo.userName,
        userBirth: userInfo.userBirth,
        userGender: userInfo.userGender,
        userPhone: userInfo.userPhone,
        userHeight: userInfo.userHeight || '',
        userWeight: userInfo.userWeight || '',
        userMedicalInfo: userInfo.userDisease || '', // 지병 정보 사용
        // 입력받은 주소 정보
        userAddress: formData.address,
        userDetailAddress: formData.detailAddress,
        // 예약 정보
        welfareBookStartDate: formData.startDate,
        welfareBookEndDate: formData.endDate,
        welfareBookUseTime: parseInt(formData.useTime),
        welfareBookReservationDate: new Date().toISOString(),
        specialRequest: formData.specialRequest
      };

      console.log('📋 예약 저장 시작');
      console.log('📋 formData.useTime 원본:', formData.useTime, '타입:', typeof formData.useTime);
      console.log('📋 parseInt(formData.useTime):', parseInt(formData.useTime), '타입:', typeof parseInt(formData.useTime));
      console.log('📋 최종 bookingData:', bookingData);

      // 정식 복지서비스 예약 API 사용 (알림 생성 포함)
      await call('/api/v1/welfare-book/reserve', 'POST', bookingData);
      
      alert('복지서비스 예약이 완료되었습니다!');
      onSuccess();
    } catch (err) {
      console.error('예약 실패:', err);
      setError('예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeDisplayText = (timeValue) => {
    const time = parseInt(timeValue);
    switch(time) {
      case 1: return '3시간 (09:00 ~ 12:00)';
      case 2: return '6시간 (09:00 ~ 15:00)';
      case 3: return '9시간 (09:00 ~ 18:00)';
      default: return `${time}시간`;
    }
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>복지서비스 예약</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.serviceInfo}>
        <h3 className={styles.serviceName}>{service.welfareName}</h3>
        <div className={styles.serviceDetails}>
          <span className={styles.category}>{service.welfareCategory}</span>
          <span className={styles.price}>
            {new Intl.NumberFormat('ko-KR').format(service.welfarePrice)}원/시간
          </span>
        </div>
        {voiceBookingData && (
          <div className={styles.voiceBookingNotice}>
            🎙️ 음성으로 요청하신 예약 정보가 자동으로 입력되었습니다. 
            확인 후 필요에 따라 수정해주세요.
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        <h3 className={styles.stepTitle}>예약 정보 입력</h3>
        
        {/* 주소 입력 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>서비스 이용 주소 *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="서비스를 이용할 주소를 입력하세요"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>상세주소</label>
          <input
            type="text"
            name="detailAddress"
            value={formData.detailAddress}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="상세주소를 입력하세요"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>서비스 시작일</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>서비스 종료일</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>이용 시간</label>
          <select
            name="useTime"
            value={formData.useTime}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value={1}>3시간 (09:00 ~ 12:00)</option>
            <option value={2}>6시간 (09:00 ~ 15:00)</option>
            <option value={3}>9시간 (09:00 ~ 18:00)</option>
          </select>
          <p className={styles.timeDisplay}>선택된 시간: {getTimeDisplayText(formData.useTime)}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>특별 요청사항 (선택)</label>
          <textarea
            name="specialRequest"
            value={formData.specialRequest}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="추가 요청사항이 있으시면 입력해주세요."
            rows="3"
          />
        </div>

        <div className={styles.priceInfo}>
          <div className={styles.priceRow}>
            <span>시간당 요금:</span>
            <span>{new Intl.NumberFormat('ko-KR').format(service.welfarePrice)}원</span>
          </div>
          <div className={styles.priceRow}>
            <span>선택된 시간:</span>
            <span>{getTimeDisplayText(formData.useTime)}</span>
          </div>
          <div className={styles.priceRow}>
            <span>총 시간:</span>
            <span>{(() => {
              const timeValue = parseInt(formData.useTime);
              let actualHours = 0;
              switch(timeValue) {
                case 1: actualHours = 3; break;
                case 2: actualHours = 6; break;
                case 3: actualHours = 9; break;
                default: actualHours = timeValue;
              }
              return `${actualHours}시간`;
            })()}</span>
          </div>
          <div className={styles.totalPriceRow}>
            <span>총 결제 금액:</span>
            <span className={styles.totalPrice}>
              {new Intl.NumberFormat('ko-KR').format(calculateTotalPrice())}원
            </span>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '예약 중...' : '예약하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WelfareBookingModal;
