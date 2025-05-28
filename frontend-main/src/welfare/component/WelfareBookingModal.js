import React, { useState } from 'react';
import { call } from 'login/service/ApiService';
import styles from 'welfare/css/WelfareBookingModal.module.css';

function WelfareBookingModal({ service, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    // 예약자 정보
    name: '',
    birthDate: '',
    gender: '',
    address: '',
    detailAddress: '',
    phone: '',
    height: '',
    weight: '',
    medicalInfo: '',
    // 예약 정보
    startDate: '',
    endDate: '',
    useTime: 1,
    specialRequest: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: 예약자 정보, 2: 예약 상세

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalPrice = () => {
    return service.welfarePrice * formData.useTime;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        // 예약자 정보
        userName: formData.name,
        userBirth: formData.birthDate,
        userGender: formData.gender,
        userAddress: formData.address,
        userDetailAddress: formData.detailAddress,
        userPhone: formData.phone,
        userHeight: formData.height,
        userWeight: formData.weight,
        userMedicalInfo: formData.medicalInfo,
        // 예약 정보
        welfareBookStartDate: formData.startDate,
        welfareBookEndDate: formData.endDate,
        welfareBookUseTime: parseInt(formData.useTime),
        welfareBookReservationDate: new Date().toISOString(),
        specialRequest: formData.specialRequest
      };

      console.log('예약 데이터:', bookingData);

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
      case 4: return '1개월';
      case 5: return '2개월';
      case 6: return '3개월';
      case 7: return '4개월';
      case 8: return '5개월';
      case 9: return '6개월';
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
            {service.welfarePrice === 0 ? '무료' : `${new Intl.NumberFormat('ko-KR').format(service.welfarePrice)}원`}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        {step === 1 ? (
          // Step 1: 예약자 정보
          <>
            <h3 className={styles.stepTitle}>예약자 정보 입력</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>이름 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>생년월일 *</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>성별 *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">선택하세요</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>주소 *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="주소를 입력하세요"
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
              <label className={styles.label}>연락처 *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="010-0000-0000"
                required
              />
            </div>

            <div className={styles.formGroupRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>신장(cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="170"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>체중(kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="70"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>특이사항</label>
              <textarea
                name="medicalInfo"
                value={formData.medicalInfo}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="예: 지병, 알레르기, 복용 약물 등"
                rows="3"
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  // 필수 항목 검증
                  if (!formData.name || !formData.birthDate || !formData.gender || !formData.address || !formData.phone) {
                    setError('필수 항목을 모두 입력해주세요.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className={styles.submitButton}
              >
                다음
              </button>
            </div>
          </>
        ) : (
          // Step 2: 예약 상세
          <>
            <h3 className={styles.stepTitle}>예약 정보 입력</h3>
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
            <option value={4}>1개월</option>
            <option value={5}>2개월</option>
            <option value={6}>3개월</option>
            <option value={7}>4개월</option>
            <option value={8}>5개월</option>
            <option value={9}>6개월</option>
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
            <span>기본 요금:</span>
            <span>{new Intl.NumberFormat('ko-KR').format(service.welfarePrice)}원</span>
          </div>
          <div className={styles.priceRow}>
            <span>이용 시간:</span>
            <span>{getTimeDisplayText(formData.useTime)}</span>
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
            onClick={() => setStep(1)}
            className={styles.cancelButton}
            disabled={loading}
          >
            이전
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '예약 중...' : '예약하기'}
          </button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}

export default WelfareBookingModal;
