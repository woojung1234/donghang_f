import React from 'react';
import styles from 'welfare/css/WelfareReservedList.module.css';

function WelfareReservedItem({ 
  title, 
  welfareBookReservationDate, 
  welfareBookStartDate, 
  welfareBookUseTime, 
  welfareTotalPrice, 
  status = 'PENDING',
  paymentStatus = 'UNPAID',
  onCancel,
  onDetail,
  onPermanentDelete // 새로운 prop 추가
}) {

  function formatDate(dateString) {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  }

  function displayTime(duration) {
    // 🚨 디버깅: 실제 저장된 duration 값 확인
    console.log('🕐 displayTime 호출됨:', {
      duration: duration,
      type: typeof duration,
      title: title // 어떤 예약인지 확인
    });
    
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration; // 이미 시간 형식으로 제공된 경우
    }
    
    switch(duration) {
      case 1:
        return '3시간 (09:00 ~ 12:00)';
      case 2:
        return '6시간 (09:00 ~ 15:00)';
      case 3:
        return '9시간 (09:00 ~ 18:00)';
      case 4:
        return '1개월';
      case 5:
        return '2개월';
      case 6:
        return '6시간 (09:00 ~ 15:00)';
      case 7:
        return '4개월';
      case 8:
        return '5개월';
      case 9:
        return '6개월';
      default:
        console.log('⚠️ 예상치 못한 duration 값:', duration);
        return duration || '시간 정보 없음';
    }
  }

  function formatPrice(price) {
    if (!price && price !== 0) {
      return '0';
    }
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0 // 소수점 아래 자리수를 0으로 설정하여 정수로 표시
    }).format(price); // currency: 'KRW' 옵션을 제거하여 원화 기호 제거
  }

  // 상태 텍스트와 스타일 결정
  const getStatusInfo = () => {
    switch(status) {
      case 'CONFIRMED':
        return { text: '확정', className: styles.statusConfirmed };
      case 'CANCELLED':
        return { text: '취소됨', className: styles.statusCancelled };
      case 'COMPLETED':
        return { text: '이용완료', className: styles.statusCompleted };
      case 'PENDING':
      default:
        return { text: '대기중', className: styles.statusPending };
    }
  };

  // 결제 상태 텍스트와 스타일 결정
  const getPaymentStatusInfo = () => {
    switch(paymentStatus) {
      case 'PAID':
        return { text: '결제완료', className: styles.paymentPaid };
      case 'REFUNDED':
        return { text: '환불완료', className: styles.paymentRefunded };
      case 'UNPAID':
      default:
        return { text: '미결제', className: styles.paymentUnpaid };
    }
  };

  const statusInfo = getStatusInfo();
  const paymentStatusInfo = getPaymentStatusInfo();
  
  const formattedReservationDate = formatDate(welfareBookReservationDate);
  const formattedStartDate = formatDate(welfareBookStartDate);

  return (
    <div 
      className={`${styles["main-section"]} ${styles["detailed-reserve"]}`}
      onClick={onDetail}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles["reserved-header"]}>
        <p className={`${styles["main-text"]} ${styles["detailed-reserved-title"]}`}>{title}</p>
        <div className={styles.statusContainer}>
          <span className={`${styles.statusBadge} ${statusInfo.className}`}>{statusInfo.text}</span>
          <span className={`${styles.paymentBadge} ${paymentStatusInfo.className}`}>{paymentStatusInfo.text}</span>
        </div>
      </div>
      
      <div className={styles["detailed-reserved-cancel-container"]}>
        <span className={`${styles["main-text"]} ${styles["detailed-reserved-date"]}`}>예약일: {formattedReservationDate}</span>
        
        {/* 상태별 버튼 표시 */}
        {status === 'PENDING' && (
          <span 
            className={`${styles["main-text"]} ${styles["detailed-reserved-cancel"]}`} 
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            예약취소
          </span>
        )}
        
        {(status === 'CANCELLED' || status === 'COMPLETED') && (
          <span 
            className={`${styles["main-text"]} ${styles["detailed-reserved-delete"]}`} 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('이 예약 내역을 완전히 삭제하시겠습니까? 삭제된 내역은 복구할 수 없습니다.')) {
                onPermanentDelete();
              }
            }}
          >
            삭제
          </span>
        )}
      </div>
      
      <hr />
      
      <div className={styles["detailed-reserved-info-container1"]}>
        <span className={`${styles["main-text"]} ${styles["main-info"]}`}>이용 날짜</span>
        <span className={styles["detailed-reserved-text"]}>{formattedStartDate}</span>
      </div>
      
      <br />
      
      <div className={styles["detailed-reserved-info-container2"]}>
        <span className={`${styles["main-text"]} ${styles["main-info"]}`}>이용 시간</span>
        <span className={styles["detailed-reserved-text"]}>{displayTime(welfareBookUseTime)}</span>
      </div>
      
      <hr />
      
      <div className={styles["detailed-reserved-info-container3"]}>
        <span className={styles["total-price-text"]}>결제금액</span>
        <span className={styles["total-price-number"]}>
          {formatPrice(welfareTotalPrice || 0)} 원
        </span>
      </div>
    </div>
  );
}

export default WelfareReservedItem;
