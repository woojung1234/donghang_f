import { call } from '../login/service/ApiService';

// 복지 서비스 예약 관련 API 함수들

/**
 * 예약 생성
 * @param {Object} reservationData - 예약 데이터
 * @returns {Promise} API 응답
 */
export const createReservation = async (reservationData) => {
  try {
    console.log("예약 생성 요청:", reservationData);
    const response = await call('/api/v1/welfare/bookings', 'POST', reservationData);
    console.log("예약 생성 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 생성 실패:", error);
    throw error;
  }
};

/**
 * 사용자의 예약 목록 조회
 * @returns {Promise} 예약 목록
 */
export const getReservations = async () => {
  try {
    console.log("예약 목록 조회 요청");
    const response = await call('/api/v1/welfare/bookings', 'GET', null);
    console.log("예약 목록 조회 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 목록 조회 실패:", error);
    throw error;
  }
};

/**
 * 특정 예약 상세 조회
 * @param {string} reservationId - 예약 ID
 * @returns {Promise} 예약 상세 정보
 */
export const getReservationDetail = async (reservationId) => {
  try {
    console.log("예약 상세 조회 요청:", reservationId);
    const response = await call(`/api/v1/welfare/bookings/${reservationId}`, 'GET', null);
    console.log("예약 상세 조회 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 상세 조회 실패:", error);
    throw error;
  }
};

/**
 * 예약 취소
 * @param {string} reservationId - 예약 ID
 * @returns {Promise} API 응답
 */
export const cancelReservation = async (reservationId) => {
  try {
    console.log("예약 취소 요청:", reservationId);
    const response = await call(`/api/v1/welfare/bookings/${reservationId}/cancel`, 'PUT', null);
    console.log("예약 취소 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 취소 실패:", error);
    throw error;
  }
};

/**
 * 예약 수정
 * @param {string} reservationId - 예약 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise} API 응답
 */
export const updateReservation = async (reservationId, updateData) => {
  try {
    console.log("예약 수정 요청:", reservationId, updateData);
    const response = await call(`/api/v1/welfare/bookings/${reservationId}`, 'PUT', updateData);
    console.log("예약 수정 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 수정 실패:", error);
    throw error;
  }
};

/**
 * 이용 가능한 복지 서비스 목록 조회
 * @returns {Promise} 서비스 목록
 */
export const getAvailableServices = async () => {
  try {
    console.log("이용 가능한 서비스 목록 조회 요청");
    const response = await call('/api/v1/welfare/services/available', 'GET', null);
    console.log("서비스 목록 조회 성공:", response);
    return response;
  } catch (error) {
    console.error("서비스 목록 조회 실패:", error);
    // 실패 시 기본 서비스 목록 반환
    return {
      services: [
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
      ]
    };
  }
};

/**
 * 예약 상태별 통계 조회
 * @returns {Promise} 예약 통계
 */
export const getReservationStats = async () => {
  try {
    console.log("예약 통계 조회 요청");
    const response = await call('/api/v1/welfare/bookings/stats', 'GET', null);
    console.log("예약 통계 조회 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 통계 조회 실패:", error);
    throw error;
  }
};

/**
 * 특정 날짜의 예약 가능 시간 조회
 * @param {string} serviceId - 서비스 ID
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD)
 * @returns {Promise} 예약 가능 시간 목록
 */
export const getAvailableTimeSlots = async (serviceId, date) => {
  try {
    console.log("예약 가능 시간 조회 요청:", serviceId, date);
    const response = await call(`/api/v1/welfare/services/${serviceId}/available-times`, 'GET', { date });
    console.log("예약 가능 시간 조회 성공:", response);
    return response;
  } catch (error) {
    console.error("예약 가능 시간 조회 실패:", error);
    throw error;
  }
};

// 예약 상태 상수
export const RESERVATION_STATUS = {
  PENDING: 'PENDING',       // 예약 대기
  CONFIRMED: 'CONFIRMED',   // 예약 확정
  COMPLETED: 'COMPLETED',   // 이용 완료
  CANCELLED: 'CANCELLED',   // 취소됨
  NO_SHOW: 'NO_SHOW'       // 노쇼
};

// 결제 상태 상수
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',       // 결제 대기
  COMPLETED: 'COMPLETED',   // 결제 완료
  FAILED: 'FAILED',         // 결제 실패
  REFUNDED: 'REFUNDED'      // 환불됨
};

// 상태 한글 변환 함수
export const getStatusText = (status) => {
  switch(status) {
    case RESERVATION_STATUS.PENDING: return '예약대기';
    case RESERVATION_STATUS.CONFIRMED: return '예약확정';
    case RESERVATION_STATUS.COMPLETED: return '이용완료';
    case RESERVATION_STATUS.CANCELLED: return '취소됨';
    case RESERVATION_STATUS.NO_SHOW: return '노쇼';
    default: return '알 수 없음';
  }
};

// 결제 상태 한글 변환 함수
export const getPaymentStatusText = (status) => {
  switch(status) {
    case PAYMENT_STATUS.PENDING: return '결제대기';
    case PAYMENT_STATUS.COMPLETED: return '결제완료';
    case PAYMENT_STATUS.FAILED: return '결제실패';
    case PAYMENT_STATUS.REFUNDED: return '환불완료';
    default: return '알 수 없음';
  }
};

// 가격 포맷팅 함수
export const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 날짜 포맷팅 함수
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

// 시간 포맷팅 함수
export const formatTime = (timeString) => {
  return timeString.substring(0, 5); // HH:MM 형태로 변환
};

export default {
  createReservation,
  getReservations,
  getReservationDetail,
  cancelReservation,
  updateReservation,
  getAvailableServices,
  getReservationStats,
  getAvailableTimeSlots,
  RESERVATION_STATUS,
  PAYMENT_STATUS,
  getStatusText,
  getPaymentStatusText,
  formatPrice,
  formatDate,
  formatTime
};
