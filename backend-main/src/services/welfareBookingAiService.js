const logger = require('../utils/logger');

class WelfareBookingAiService {
  constructor() {
    // 복지서비스 예약 관련 세션 상태 관리
    this.bookingSessionStates = new Map();
    
    // 복지서비스 캐시 (성능 향상)
    this.servicesCache = null;
    this.cacheExpiry = null;
  }

  // 세션 상태 초기화
  initBookingSession(sessionId) {
    if (!this.bookingSessionStates.has(sessionId)) {
      this.bookingSessionStates.set(sessionId, {
        welfareBookingState: null, // { step: 'service_selection' | 'details_input' | 'confirmation', data: {} }
        waitingForWelfareBooking: false
      });
    }
  }

  // 세션 상태 가져오기
  getBookingSessionState(sessionId) {
    this.initBookingSession(sessionId);
    return this.bookingSessionStates.get(sessionId);
  }

  // 세션 상태 업데이트
  updateBookingSessionState(sessionId, updates) {
    const currentState = this.getBookingSessionState(sessionId);
    this.bookingSessionStates.set(sessionId, { ...currentState, ...updates });
  }

  // 복지서비스 예약 요청 감지
  analyzeWelfareBookingRequest(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    logger.info('🔍 복지서비스 예약 요청 분석 - 입력:', message);
    logger.info('🔍 소문자 변환 후:', lowercaseMessage);
    
    // 먼저 취소 관련 키워드가 있는지 확인
    const cancelKeywords = [
      '취소', '철회', '취소하고', '취소해줘', '취소하고 싶어', '취소해주세요'
    ];
    
    const hasCancelKeyword = cancelKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    if (hasCancelKeyword) {
      logger.info('🚫 취소 키워드 감지됨, 예약 요청이 아님');
      return false;
    }
    
    const bookingKeywords = [
      '복지서비스 예약', '복지 서비스 예약', '복지예약', '서비스 예약',
      '예약하고 싶어', '예약해줘', '예약하고 싶다', '예약 신청',
      '가정간병 예약', '일상가사 예약', '정서지원 예약',
      '돌봄 서비스 예약', '돌봄 예약'
    ];
    
    const matchedKeywords = bookingKeywords.filter(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
    
    logger.info('🔍 매칭된 키워드들:', matchedKeywords);
    
    const isBookingRequest = matchedKeywords.length > 0;
    logger.info('🔍 예약 요청 감지 결과:', isBookingRequest);
    
    return isBookingRequest;
  }

  // 복지서비스 목록 조회 (캐시 사용)
  async getWelfareServices() {
    try {
      // 캐시가 유효한 경우 캐시 데이터 반환 (5분 캐시)
      const now = Date.now();
      if (this.servicesCache && this.cacheExpiry && now < this.cacheExpiry) {
        return this.servicesCache;
      }
      
      // 하드코딩된 서비스 목록 (실제 DB 연동 시 이 부분을 교체)
      const services = [
        {
          welfareNo: 1,
          welfareName: '일상가사 돌봄',
          welfarePrice: 30000,
          welfareCategory: '가사지원',
          welfareDescription: '주변 정리나 청소, 빨래, 밥짓기 등 일상가사 일을 힘들고 어려우신 어르신을 돕습니다',
          priceType: 'hourly'
        },
        {
          welfareNo: 2,
          welfareName: '가정간병 돌봄',
          welfarePrice: 40000,
          welfareCategory: '간병지원',
          welfareDescription: '의료진의 진료와 치료 외에도 항상 곁에서 누군가 돌봄주어야하나, 집에서 혼자 몸이 아프때에 어르신을 돕습니다',
          priceType: 'hourly'
        },
        {
          welfareNo: 3,
          welfareName: '정서지원 돌봄',
          welfarePrice: 20000,
          welfareCategory: '정서지원',
          welfareDescription: '심리적,정서적 지원에 집중한 말벗, 산책 동행, 취미활동 보조 등으로 노인의 외로움과 우울감 해소를 도와드립니다',
          priceType: 'hourly'
        }
      ];
      
      // 캐시 업데이트 (5분 캐시)
      this.servicesCache = services;
      this.cacheExpiry = now + (5 * 60 * 1000);
      
      return services;
      
    } catch (error) {
      logger.error('복지서비스 목록 조회 오류:', error);
      throw error;
    }
  }

  // 복지서비스 선택 감지 (동적으로 처리)
  async analyzeWelfareServiceSelection(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    try {
      // 실제 복지서비스 목록 조회
      const services = await this.getWelfareServices();
      
      // 각 서비스별 키워드 매핑 (동적 생성)
      for (const service of services) {
        const keywords = this.generateServiceKeywords(service.welfareName, service.welfareCategory);
        
        if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
          return {
            serviceId: service.welfareNo,
            serviceName: service.welfareName,
            serviceCategory: service.welfareCategory,
            servicePrice: service.welfarePrice
          };
        }
      }
      
      return null;
      
    } catch (error) {
      logger.error('복지서비스 선택 분석 오류:', error);
      return null;
    }
  }

  // 서비스명과 카테고리로 키워드 생성
  generateServiceKeywords(serviceName, serviceCategory) {
    const keywords = [];
    
    // 서비스명 기반 키워드
    if (serviceName.includes('가정간병')) {
      keywords.push('가정간병', '간병', '가정 간병', '간병 서비스', '가정간병서비스', '가정간병 서비스');
    } else if (serviceName.includes('일상가사')) {
      keywords.push('일상가사', '가사', '일상 가사', '가사 서비스', '일상가사서비스', '일상가사 서비스', '가사돌봄', '가사 돌봄');
    } else if (serviceName.includes('정서지원')) {
      keywords.push('정서지원', '정서 지원', '정서지원서비스', '정서지원 서비스', '정서 돌봄', '정서돌봄');
    }
    
    // 카테고리 기반 키워드
    if (serviceCategory === '간병지원') {
      keywords.push('간병', '간병지원', '간병서비스');
    } else if (serviceCategory === '가사지원') {
      keywords.push('가사', '가사지원', '가사서비스', '청소', '빨래', '집안일');
    } else if (serviceCategory === '정서지원') {
      keywords.push('정서', '정서지원', '정서서비스', '말벗', '상담');
    }
    
    return keywords;
  }

  // 시간대 분석 (동적 처리)
  analyzeTimeSelection(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // 시간대 옵션 정의 (이 부분만 설정으로 관리)
    const timeOptions = [
      {
        id: 1,
        keywords: ['12시', '점심', '오전', '3시간', '12시까지'],
        display: '오전 9시부터 오후 12시',
        hours: 3
      },
      {
        id: 2,  
        keywords: ['3시까지', '15시', '6시간', '오후 3시', '3시'],
        display: '오전 9시부터 오후 3시',
        hours: 6
      },
      {
        id: 3,
        keywords: ['6시까지', '18시', '9시간', '저녁', '오후 6시', '6시'],
        display: '오전 9시부터 오후 6시',
        hours: 9
      }
    ];
    
    // 키워드 매칭으로 시간대 찾기
    for (const option of timeOptions) {
      if (option.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return {
          timeOption: option.id,
          timeDisplay: option.display,
          hours: option.hours
        };
      }
    }
    
    return null;
  }

  // 날짜 분석 (예약용)
  analyzeDateForBooking(message) {
    const lowercaseMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (lowercaseMessage.includes('내일')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
        displayText: '내일'
      };
    }
    
    if (lowercaseMessage.includes('모레')) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return {
        startDate: dayAfterTomorrow.toISOString().split('T')[0],
        endDate: dayAfterTomorrow.toISOString().split('T')[0],
        displayText: '모레'
      };
    }
    
    // N일 후 패턴
    const daysLaterMatch = message.match(/(\d+)일?\s*후/);
    if (daysLaterMatch) {
      const daysLater = parseInt(daysLaterMatch[1]);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysLater);
      return {
        startDate: targetDate.toISOString().split('T')[0],
        endDate: targetDate.toISOString().split('T')[0],
        displayText: `${daysLater}일 후`
      };
    }
    
    return null;
  }

  // 복지서비스 예약 초기 응답
  generateWelfareBookingWelcome() {
    return "안녕하세요! 어떤 복지 서비스를 예약하고 싶으신가요? " +
           "가정간병 서비스와 일상가사 서비스, 정서지원 서비스중 선택하실 수 있습니다.";
  }

  // 시간대 선택 응답
  generateTimeSelectionResponse(serviceName) {
    return `좋습니다 ${serviceName}을 예약하실 날짜와 원하는 시간대, 주소를 알려주시겠어요? ` +
           "선택할 수 있는 시간대는 오전 9시부터 오후 12시, 오전 9시부터 오후 3시, 오전 9시부터 오후 6시까지 입니다";
  }

  // 예약 확인 응답
  generateBookingConfirmation(bookingData) {
    const { serviceName, dateText, timeDisplay, address } = bookingData;
    
    return `${dateText} ${timeDisplay}까지 ${serviceName}을 예약하시겠군요 그럼 주소를 알려주시겠어요?`;
  }

  // 예약 완료 안내
  generateBookingComplete() {
    return "확인감사합니다 예약 페이지로 안내해드리겠습니다 잠시만 기다려주세요";
  }

  // 복지서비스 예약 플로우 처리
  async handleWelfareBookingFlow(message, sessionId) {
    const sessionState = this.getBookingSessionState(sessionId);
    const { step, data } = sessionState.welfareBookingState;
    
    try {
      switch (step) {
        case 'service_selection':
          return this.handleServiceSelection(message, sessionId);
          
        case 'details_input':
          return this.handleDetailsInput(message, sessionId);
          
        case 'address_input':
          return this.handleAddressInput(message, sessionId);
          
        case 'confirmation':
          return this.handleBookingConfirmation(message, sessionId);
          
        default:
          // 잘못된 상태인 경우 초기화
          this.resetWelfareBookingState(sessionId);
          return {
            type: 'welfare_booking_error',
            content: '예약 과정에서 오류가 발생했습니다. 다시 시도해주세요.',
            needsVoice: true
          };
      }
    } catch (error) {
      logger.error('복지서비스 예약 플로우 오류:', error);
      this.resetWelfareBookingState(sessionId);
      return {
        type: 'welfare_booking_error',
        content: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        needsVoice: true
      };
    }
  }

  // 서비스 선택 처리
  async handleServiceSelection(message, sessionId) {
    const serviceSelection = await this.analyzeWelfareServiceSelection(message);
    
    if (!serviceSelection) {
      return {
        type: 'service_selection_retry',
        content: '어떤 서비스를 원하시는지 정확히 말씀해주세요. ' +
                '가정간병 서비스, 일상가사 서비스, 정서지원 서비스 중에서 선택해주세요.',
        needsVoice: true
      };
    }
    
    // 다음 단계로 진행
    this.updateBookingSessionState(sessionId, {
      welfareBookingState: {
        step: 'details_input',
        data: {
          serviceId: serviceSelection.serviceId,
          serviceName: serviceSelection.serviceName,
          serviceCategory: serviceSelection.serviceCategory,
          servicePrice: serviceSelection.servicePrice
        }
      }
    });
    
    return {
      type: 'service_selected',
      content: this.generateTimeSelectionResponse(serviceSelection.serviceName),
      needsVoice: true
    };
  }

  // 세부사항 입력 처리 (날짜, 시간)
  handleDetailsInput(message, sessionId) {
    const sessionState = this.getBookingSessionState(sessionId);
    const { data } = sessionState.welfareBookingState;
    
    // 시간대 분석
    const timeSelection = this.analyzeTimeSelection(message);
    
    // 날짜 분석
    const dateSelection = this.analyzeDateForBooking(message);
    
    // 필요한 정보가 모두 있는지 확인
    if (!timeSelection) {
      return {
        type: 'time_selection_retry',
        content: '시간대를 명확히 말씀해주세요. 예: "내일 3시까지", "모레 오후 6시까지"',
        needsVoice: true
      };
    }
    
    if (!dateSelection) {
      return {
        type: 'date_selection_retry',
        content: '날짜를 명확히 말씀해주세요. 예: "내일", "모레", "3일 후"',
        needsVoice: true
      };
    }
    
    // 날짜와 시간이 모두 준비되면 주소 입력 단계로
    const bookingData = {
      ...data,
      timeOption: timeSelection.timeOption,
      timeDisplay: timeSelection.timeDisplay,
      startDate: dateSelection.startDate,
      endDate: dateSelection.endDate,
      dateText: dateSelection.displayText
    };
    
    this.updateBookingSessionState(sessionId, {
      welfareBookingState: {
        step: 'address_input',
        data: bookingData
      }
    });
    
    return {
      type: 'time_details_collected',
      content: `${dateSelection.displayText} ${timeSelection.timeDisplay}까지 ${data.serviceName}을 예약하시겠군요 그럼 주소를 알려주시겠어요?`,
      needsVoice: true
    };
  }

  // 주소 입력 처리
  handleAddressInput(message, sessionId) {
    const sessionState = this.getBookingSessionState(sessionId);
    const { data } = sessionState.welfareBookingState;
    
    // 주소 추출 (간단한 방식으로)
    const addressMatch = message.match(/([가-힣\s\d-]+(?:구|동|로|길|아파트|빌딩|시|군|읍|면)[가-힣\s\d-]*)/);
    const address = addressMatch ? addressMatch[1].trim() : message.trim();
    
    if (!address || address.length < 5) {
      return {
        type: 'address_input_retry',
        content: '주소를 정확히 말씀해주세요. 예: "서울시 강남구 테헤란로 123"',
        needsVoice: true
      };
    }
    
    // 주소가 입력되면 확인 단계로
    const bookingData = {
      ...data,
      address: address
    };
    
    this.updateBookingSessionState(sessionId, {
      welfareBookingState: {
        step: 'confirmation',
        data: bookingData
      }
    });
    
    return {
      type: 'address_collected',
      content: `해당 주소로 예약을 진행하려고 하는데 맞으신가요? 확인해주시면 예약 페이지로 안내해드리겠습니다`,
      needsVoice: true
    };
  }

  // 예약 확인 처리
  handleBookingConfirmation(message, sessionId) {
    const lowercaseMessage = message.toLowerCase().trim();
    
    // 긍정적 응답 확인
    const positiveResponses = ['응', '네', '예', '맞아', '맞습니다', '좋아', '확인', '진행'];
    const isPositive = positiveResponses.some(response => lowercaseMessage.includes(response));
    
    if (!isPositive) {
      // 부정적 응답이거나 불확실한 경우
      const negativeResponses = ['아니', '아니요', '틀려', '다시', '취소'];
      const isNegative = negativeResponses.some(response => lowercaseMessage.includes(response));
      
      if (isNegative) {
        this.resetWelfareBookingState(sessionId);
        return {
          type: 'booking_cancelled',
          content: '예약을 취소했습니다. 다시 예약하시려면 "복지서비스 예약하고 싶어"라고 말씀해주세요.',
          needsVoice: true
        };
      } else {
        return {
          type: 'confirmation_retry',
          content: '"예" 또는 "아니요"로 답변해주세요.',
          needsVoice: true
        };
      }
    }
    
    // 긍정적 응답인 경우 예약 페이지로 이동
    const sessionState = this.getBookingSessionState(sessionId);
    const bookingData = sessionState.welfareBookingState.data;
    
    // 세션 상태 초기화
    this.resetWelfareBookingState(sessionId);
    
    return {
      type: 'booking_confirmed',
      content: this.generateBookingComplete(),
      needsVoice: true,
      needsNavigation: true,
      navigationData: {
        type: 'welfare_booking_modal',
        serviceId: bookingData.serviceId,
        serviceName: bookingData.serviceName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        timeOption: bookingData.timeOption,
        address: bookingData.address
      }
    };
  }

  // 복지서비스 예약 상태 초기화
  resetWelfareBookingState(sessionId) {
    this.updateBookingSessionState(sessionId, {
      waitingForWelfareBooking: false,
      welfareBookingState: null
    });
  }

  // 예약 시작
  startWelfareBooking(sessionId) {
    this.updateBookingSessionState(sessionId, {
      waitingForWelfareBooking: true,
      welfareBookingState: {
        step: 'service_selection',
        data: {}
      }
    });
    
    return {
      type: 'welfare_booking_start',
      content: this.generateWelfareBookingWelcome(),
      needsVoice: true
    };
  }
}

module.exports = new WelfareBookingAiService();
