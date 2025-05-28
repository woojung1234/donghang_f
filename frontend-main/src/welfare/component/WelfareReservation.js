import React, { useState, useEffect } from 'react';
import Header from 'header/BlueHeader';
import styles from 'welfare/css/WelfareReservation.module.css';
import { useNavigate } from 'react-router-dom';
import { call } from 'login/service/ApiService';
import {
  createReservation,
  getReservations,
  cancelReservation,
  getAvailableServices,
  getStatusText,
  formatPrice,
  RESERVATION_STATUS
} from 'services/welfareReservationService';

function WelfareReservation() {
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userNo, setUserNo] = useState(null);

  // 사용자 정보 및 데이터 로드
  useEffect(() => {
    const userNoFromStorage = localStorage.getItem("userNo");
    if (userNoFromStorage) {
      setUserNo(userNoFromStorage);
      fetchUserInfo(userNoFromStorage);
      fetchReservations();
      fetchAvailableServices();
    }
  }, []);

  // 사용자 정보 조회
  const fetchUserInfo = (userNo) => {
    call('/api/v1/users', 'GET', userNo)
      .then((response) => {
        setUserInfo({
          name: response.userName || '',
          phone: response.phone || '',
          address: response.address || ''
        });
      })
      .catch(error => {
        console.log("사용자 정보 조회 오류", error);
      });
  };

  // 예약 목록 조회
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await getReservations();
      console.log("예약 목록 조회 성공:", response);
      
      if (response.bookings) {
        setReservations(response.bookings);
      } else if (Array.isArray(response)) {
        setReservations(response);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("예약 목록 조회 실패:", error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  // 이용 가능한 서비스 조회
  const fetchAvailableServices = async () => {
    try {
      const response = await getAvailableServices();
      if (response.services) {
        setServices(response.services);
      } else {
        // 기본 서비스 목록 설정
        setServices([
          {
            id: 'daily-care',
            name: '일상가사 돌봄',
            description: '일상적인 가사일 도움 서비스',
            provider: '지역복지센터',
            duration: '2시간',
            price: 15000,
            availableDates: ['2025-05-29', '2025-05-30', '2025-06-01', '2025-06-02'],
            timeSlots: ['09:00', '11:00', '14:00', '16:00']
          },
          {
            id: 'home-nursing',
            name: '가정간병 돌봄',
            description: '환자 또는 거동불편자 간병 서비스',
            provider: '의료복지센터',
            duration: '4시간',
            price: 35000,
            availableDates: ['2025-05-29', '2025-05-31', '2025-06-01', '2025-06-03'],
            timeSlots: ['08:00', '12:00', '16:00', '20:00']
          },
          {
            id: 'comprehensive-care',
            name: '하나 돌봄',
            description: '종합적인 돌봄 서비스',
            provider: '종합복지관',
            duration: '3시간',
            price: 25000,
            availableDates: ['2025-05-30', '2025-05-31', '2025-06-02', '2025-06-04'],
            timeSlots: ['10:00', '13:00', '15:00', '18:00']
          }
        ]);
      }
    } catch (error) {
      console.error("서비스 목록 조회 실패:", error);
    }
  };

  // 서비스 선택
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowReservationForm(true);
    setSelectedDate('');
    setSelectedTime('');
  };

  // 예약 폼 입력 핸들러
  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 예약 제출
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime || !userInfo.name || !userInfo.phone || !userInfo.address) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    if (!userNo) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);

      // 예약 데이터 준비
      const reservationData = {
        welfareId: selectedService.id,
        serviceName: selectedService.name,
        serviceProvider: selectedService.provider,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        duration: selectedService.duration,
        paymentAmount: selectedService.price,
        userInfo: {
          name: userInfo.name,
          phone: userInfo.phone,
          address: userInfo.address
        },
        status: RESERVATION_STATUS.PENDING
      };

      await createReservation(reservationData);
      alert('예약이 완료되었습니다!');
      
      // 폼 초기화
      setShowReservationForm(false);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      
      // 예약 목록 새로고침
      await fetchReservations();
    } catch (error) {
      console.error("예약 실패:", error);
      alert('예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 예약 취소
  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('정말로 예약을 취소하시겠습니까?')) {
      try {
        setLoading(true);
        await cancelReservation(reservationId);
        alert('예약이 취소되었습니다.');
        await fetchReservations(); // 목록 새로고침
      } catch (error) {
        console.error("예약 취소 실패:", error);
        alert('예약 취소 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>복지 서비스 예약</h1>
        
        {loading && (
          <div className={styles.loadingContainer}>
            <p>처리 중...</p>
          </div>
        )}
        
        {!showReservationForm ? (
          <>
            {/* 서비스 목록 */}
            <div className={styles.servicesSection}>
              <h2 className={styles.sectionTitle}>이용 가능한 서비스</h2>
              <div className={styles.servicesGrid}>
                {services.map(service => (
                  <div key={service.id} className={styles.serviceCard}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceDescription}>{service.description}</p>
                    <div className={styles.serviceDetails}>
                      <p><span className={styles.label}>제공기관:</span> {service.provider}</p>
                      <p><span className={styles.label}>소요시간:</span> {service.duration}</p>
                      <p><span className={styles.label}>이용료:</span> {formatPrice(service.price)}원</p>
                    </div>
                    <button 
                      className={styles.reserveButton}
                      onClick={() => handleServiceSelect(service)}
                      disabled={loading}
                    >
                      예약하기
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 기존 예약 목록 */}
            {reservations.length > 0 && (
              <div className={styles.reservationsSection}>
                <h2 className={styles.sectionTitle}>나의 예약 현황</h2>
                <div className={styles.reservationsList}>
                  {reservations.map(reservation => (
                    <div 
                      key={reservation._id || reservation.id} 
                      className={styles.reservationCard}
                      data-status={reservation.status}
                    >
                      <div className={styles.reservationInfo}>
                        <h3 className={styles.reservationServiceName}>
                          {reservation.serviceName || reservation.welfareId?.serviceName || '알 수 없는 서비스'}
                        </h3>
                        <p><span className={styles.label}>예약일시:</span> {reservation.bookingDate} {reservation.bookingTime}</p>
                        <p><span className={styles.label}>신청자:</span> {reservation.userInfo?.name || userInfo.name}</p>
                        <p><span className={styles.label}>연락처:</span> {reservation.userInfo?.phone || userInfo.phone}</p>
                        <p><span className={styles.label}>상태:</span> 
                          <span className={styles.status}>{getStatusText(reservation.status)}</span>
                        </p>
                        {reservation.paymentAmount && (
                          <p><span className={styles.label}>결제금액:</span> {formatPrice(reservation.paymentAmount)}원</p>
                        )}
                      </div>
                      {(reservation.status === RESERVATION_STATUS.PENDING || reservation.status === RESERVATION_STATUS.CONFIRMED) && (
                        <button 
                          className={styles.cancelButton}
                          onClick={() => handleCancelReservation(reservation._id || reservation.id)}
                          disabled={loading}
                        >
                          취소
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 예약 폼 */
          <div className={styles.reservationForm}>
            <h2 className={styles.formTitle}>{selectedService?.name} 예약</h2>
            
            <form onSubmit={handleReservationSubmit}>
              {/* 서비스 정보 */}
              <div className={styles.serviceInfo}>
                <h3>선택한 서비스</h3>
                <p><span className={styles.label}>서비스명:</span> {selectedService?.name}</p>
                <p><span className={styles.label}>제공기관:</span> {selectedService?.provider}</p>
                <p><span className={styles.label}>소요시간:</span> {selectedService?.duration}</p>
                <p><span className={styles.label}>이용료:</span> {formatPrice(selectedService?.price)}원</p>
              </div>

              {/* 날짜 선택 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>예약 날짜</label>
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.formSelect}
                  required
                >
                  <option value="">날짜를 선택해주세요</option>
                  {selectedService?.availableDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>

              {/* 시간 선택 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>예약 시간</label>
                <select 
                  value={selectedTime} 
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={styles.formSelect}
                  required
                >
                  <option value="">시간을 선택해주세요</option>
                  {selectedService?.timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* 신청자 정보 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>이름</label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={styles.formInput}
                  placeholder="이름을 입력해주세요"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>연락처</label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={styles.formInput}
                  placeholder="연락처를 입력해주세요"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>주소</label>
                <input
                  type="text"
                  value={userInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={styles.formInput}
                  placeholder="주소를 입력해주세요"
                  required
                />
              </div>

              {/* 버튼들 */}
              <div className={styles.formButtons}>
                <button 
                  type="button" 
                  className={styles.cancelFormButton}
                  onClick={() => setShowReservationForm(false)}
                  disabled={loading}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '예약 신청'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelfareReservation;
