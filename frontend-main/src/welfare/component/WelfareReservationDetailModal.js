import React from 'react';
import styles from 'welfare/css/WelfareReservationDetailModal.module.css';

function WelfareReservationDetailModal({ reservation, onClose }) {
  if (!reservation) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0';
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0
    }).format(price);
  };

  const displayTime = (duration) => {
    switch(duration) {
      case 1: return '3시간 (09:00 ~ 12:00)';
      case 2: return '6시간 (09:00 ~ 15:00)';
      case 3: return '9시간 (09:00 ~ 18:00)';
      case 4: return '1개월';
      case 5: return '2개월';
      case 6: return '3개월';
      case 7: return '4개월';
      case 8: return '5개월';
      case 9: return '6개월';
      default: return duration || '시간 정보 없음';
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}세`;
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>예약 상세 정보</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.modalContent}>
        {/* 서비스 정보 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>서비스 정보</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>서비스명</span>
            <span className={styles.value}>{reservation.welfare?.welfareName || '정보 없음'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>예약번호</span>
            <span className={styles.value}>#{reservation.welfareBookNo}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>예약일</span>
            <span className={styles.value}>{formatDate(reservation.welfareBookReservationDate)}</span>
          </div>
        </div>

        {/* 이용 정보 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>이용 정보</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>이용 시작일</span>
            <span className={styles.value}>{formatDate(reservation.welfareBookStartDate)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>이용 종료일</span>
            <span className={styles.value}>{formatDate(reservation.welfareBookEndDate)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>이용 시간</span>
            <span className={styles.value}>{displayTime(reservation.welfareBookUseTime)}</span>
          </div>
        </div>

        {/* 예약자 정보 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>예약자 정보</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>이름</span>
            <span className={styles.value}>{reservation.userName || '정보 없음'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>생년월일</span>
            <span className={styles.value}>
              {reservation.userBirth ? `${formatDate(reservation.userBirth)} (${calculateAge(reservation.userBirth)})` : '정보 없음'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>성별</span>
            <span className={styles.value}>{reservation.userGender || '정보 없음'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>연락처</span>
            <span className={styles.value}>{reservation.userPhone || '정보 없음'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>주소</span>
            <span className={styles.value}>
              {reservation.userAddress ? 
                `${reservation.userAddress}${reservation.userDetailAddress ? ' ' + reservation.userDetailAddress : ''}` : 
                '정보 없음'}
            </span>
          </div>
          {(reservation.userHeight || reservation.userWeight) && (
            <div className={styles.infoRow}>
              <span className={styles.label}>신체정보</span>
              <span className={styles.value}>
                {reservation.userHeight && `신장: ${reservation.userHeight}cm`}
                {reservation.userHeight && reservation.userWeight && ' / '}
                {reservation.userWeight && `체중: ${reservation.userWeight}kg`}
              </span>
            </div>
          )}
          {reservation.userMedicalInfo && (
            <div className={styles.infoRow}>
              <span className={styles.label}>특이사항</span>
              <span className={styles.value}>{reservation.userMedicalInfo}</span>
            </div>
          )}
        </div>

        {/* 결제 정보 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>결제 정보</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>서비스 금액</span>
            <span className={styles.value}>{formatPrice(reservation.welfare?.welfarePrice || 0)}원</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>이용 시간</span>
            <span className={styles.value}>{displayTime(reservation.welfareBookUseTime)}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.label}>총 결제 금액</span>
            <span className={styles.totalPrice}>{formatPrice(reservation.welfareBookTotalPrice || 0)}원</span>
          </div>
        </div>

        {/* 특별 요청사항 */}
        {reservation.specialRequest && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>특별 요청사항</h3>
            <p className={styles.specialRequest}>{reservation.specialRequest}</p>
          </div>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button className={styles.confirmButton} onClick={onClose}>확인</button>
      </div>
    </div>
  );
}

export default WelfareReservationDetailModal;
