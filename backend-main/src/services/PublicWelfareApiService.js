// backend-main/src/services/PublicWelfareApiService.js

const axios = require('axios');
const logger = require('../utils/logger');

class PublicWelfareApiService {
  constructor() {
    // 공공데이터포털 복지로 API
    this.baseUrl = 'https://www.bokjiro.go.kr/openapi/rest/gvmtWelSvc';
    this.serviceKey = process.env.WELFARE_API_SERVICE_KEY || 'dummy-key';
    
    // 캐시 설정 (10분간 유지)
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분
  }

  /**
   * 복지서비스 목록 조회
   * @param {Object} params - 검색 파라미터
   * @returns {Array} 복지서비스 목록
   */
  async getWelfareServices(params = {}) {
    try {
      const cacheKey = JSON.stringify(params);
      
      // 캐시 확인
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.info('캐시된 복지서비스 데이터 반환');
          return cached.data;
        }
      }

      const requestParams = {
        serviceKey: this.serviceKey,
        numOfRows: params.numOfRows || 20,
        pageNo: params.pageNo || 1,
        _type: 'json'
      };

      // 연령대별 필터링
      if (params.lifeArray) {
        requestParams.lifeArray = params.lifeArray; // 영유아, 아동, 청소년, 청년, 중장년, 노년
      }

      // 가족상황별 필터링  
      if (params.familyArray) {
        requestParams.familyArray = params.familyArray; // 한부모, 조손, 다문화, 북한이탈주민
      }

      // 관심주제별 필터링
      if (params.characterArray) {
        requestParams.characterArray = params.characterArray; // 신체건강, 정신건강, 안전, 일상돌봄
      }

      // 지역 필터링
      if (params.siDo) {
        requestParams.siDo = params.siDo;
      }

      logger.info('공공데이터 복지서비스 API 호출:', requestParams);

      const response = await axios.get(this.baseUrl, {
        params: requestParams,
        timeout: 10000
      });

      if (response.data && response.data.response && response.data.response.body) {
        const services = response.data.response.body.items || [];
        
        // 데이터 정제
        const processedServices = services.map(service => ({
          serviceId: service.servId,
          serviceName: service.servNm,
          serviceSummary: service.servDgst,
          serviceDetail: service.servDtlLink,
          targetAudience: service.inqNum,
          applicationMethod: service.aplyMtdCn,
          supportContent: service.srvPvsnCn,
          organizationName: service.bizChrDeptNm,
          contactInfo: service.ctpvNm,
          lifeCategory: service.lifeNmArray,
          serviceCategory: service.intrsThemaNmArray,
          originalData: service
        }));

        // 캐시 저장
        this.cache.set(cacheKey, {
          data: processedServices,
          timestamp: Date.now()
        });

        logger.info(`공공데이터 복지서비스 ${processedServices.length}개 조회 완료`);
        return processedServices;
      }

      logger.warn('공공데이터 API 응답이 비어있음');
      return [];

    } catch (error) {
      logger.error('공공데이터 복지서비스 API 호출 오류:', error.message);
      
      // API 키가 잘못되었거나 서비스 장애 시 더미 데이터 반환
      return this.getFallbackWelfareServices(params);
    }
  }

  /**
   * 노인분들을 위한 맞춤형 복지서비스 조회
   * @param {Object} userProfile - 사용자 프로필 (나이, 관심사 등)
   * @returns {Array} 추천 복지서비스 목록
   */
  async getRecommendedServicesForSeniors(userProfile = {}) {
    try {
      const params = {
        lifeArray: '노년', // 노년층 대상
        numOfRows: 30,
        pageNo: 1
      };

      // 관심사에 따른 카테고리 필터링
      if (userProfile.interests && userProfile.interests.length > 0) {
        const categoryMap = {
          '건강': '신체건강',
          '의료': '신체건강',
          '문화': '문화여가',
          '교육': '교육',
          '사회': '사회참여',
          '돌봄': '일상돌봄',
          '취업': '일자리'
        };

        const categories = userProfile.interests
          .map(interest => categoryMap[interest])
          .filter(category => category);

        if (categories.length > 0) {
          params.characterArray = categories.join(',');
        }
      }

      // 지역 설정 (기본: 서울)
      if (userProfile.region) {
        params.siDo = userProfile.region;
      }

      const services = await this.getWelfareServices(params);
      
      // 노인분들에게 적합한 서비스 필터링 및 정렬
      const filteredServices = services
        .filter(service => this.isSuitableForSeniors(service))
        .sort((a, b) => this.calculateRelevanceScore(b, userProfile) - this.calculateRelevanceScore(a, userProfile))
        .slice(0, 10); // 상위 10개만

      logger.info(`노인분들을 위한 추천 복지서비스 ${filteredServices.length}개 생성`);
      return filteredServices;

    } catch (error) {
      logger.error('노인 맞춤형 복지서비스 조회 오류:', error);
      return this.getFallbackWelfareServices();
    }
  }

  /**
   * 노인분들에게 적합한 서비스인지 판단
   * @param {Object} service - 복지서비스 정보
   * @returns {boolean} 적합성 여부
   */
  isSuitableForSeniors(service) {
    if (!service) return false;

    const serviceName = (service.serviceName || '').toLowerCase();
    const serviceSummary = (service.serviceSummary || '').toLowerCase();
    const combined = serviceName + ' ' + serviceSummary;

    // 노인 관련 키워드
    const seniorKeywords = [
      '노인', '노년', '어르신', '고령', '시니어',
      '건강', '의료', '돌봄', '요양', '간병',
      '문화', '여가', '교육', '평생학습',
      '사회참여', '일자리', '자원봉사'
    ];

    // 제외할 키워드 (영유아, 청소년 등)
    const excludeKeywords = [
      '영유아', '아동', '청소년', '청년', '임산부',
      '출산', '육아', '보육', '학생'
    ];

    const hasExcludeKeyword = excludeKeywords.some(keyword => combined.includes(keyword));
    if (hasExcludeKeyword) return false;

    const hasSeniorKeyword = seniorKeywords.some(keyword => combined.includes(keyword));
    return hasSeniorKeyword || service.lifeCategory?.includes('노년');
  }

  /**
   * 사용자 프로필에 따른 관련성 점수 계산
   * @param {Object} service - 복지서비스
   * @param {Object} userProfile - 사용자 프로필
   * @returns {number} 관련성 점수 (0-100)
   */
  calculateRelevanceScore(service, userProfile = {}) {
    let score = 50; // 기본 점수

    // 관심사 매칭
    if (userProfile.interests && userProfile.interests.length > 0) {
      const serviceName = (service.serviceName || '').toLowerCase();
      const serviceSummary = (service.serviceSummary || '').toLowerCase();
      const combined = serviceName + ' ' + serviceSummary;

      userProfile.interests.forEach(interest => {
        if (combined.includes(interest.toLowerCase())) {
          score += 20;
        }
      });
    }

    // 서비스 카테고리 매칭
    if (service.serviceCategory) {
      const categories = Array.isArray(service.serviceCategory) 
        ? service.serviceCategory 
        : [service.serviceCategory];
      
      categories.forEach(category => {
        if (category.includes('건강') || category.includes('돌봄')) score += 15;
        if (category.includes('문화') || category.includes('교육')) score += 10;
        if (category.includes('사회참여')) score += 10;
      });
    }

    // 서비스명에 핵심 키워드가 있으면 가산점
    const priorityKeywords = ['건강', '의료', '돌봄', '문화', '교육', '사회참여'];
    const serviceName = (service.serviceName || '').toLowerCase();
    priorityKeywords.forEach(keyword => {
      if (serviceName.includes(keyword)) {
        score += 5;
      }
    });

    return Math.min(score, 100); // 최대 100점
  }

  /**
   * API 실패 시 폴백 데이터 반환
   * @param {Object} params - 검색 파라미터
   * @returns {Array} 폴백 복지서비스 데이터
   */
  getFallbackWelfareServices(params = {}) {
    logger.info('폴백 복지서비스 데이터 반환');
    
    return [
      {
        serviceId: 'fallback-001',
        serviceName: '노인 건강관리 서비스',
        serviceSummary: '65세 이상 어르신을 위한 종합 건강관리 및 상담 서비스입니다.',
        targetAudience: '65세 이상 노인',
        applicationMethod: '가까운 보건소 방문 또는 전화 신청',
        organizationName: '보건복지부',
        contactInfo: '1577-1000',
        lifeCategory: ['노년'],
        serviceCategory: ['건강관리']
      },
      {
        serviceId: 'fallback-002',
        serviceName: '시니어 문화활동 지원',
        serviceSummary: '고령자를 위한 다양한 문화활동 및 평생교육 프로그램을 제공합니다.',
        targetAudience: '60세 이상 어르신',
        applicationMethod: '온라인 신청 또는 주민센터 방문',
        organizationName: '문화체육관광부',
        contactInfo: '1577-2000',
        lifeCategory: ['노년'],
        serviceCategory: ['문화여가', '교육']
      },
      {
        serviceId: 'fallback-003',
        serviceName: '독거노인 안전지킴이',
        serviceSummary: '홀로 사시는 어르신의 안전을 확인하고 필요시 응급대응 서비스를 제공합니다.',
        targetAudience: '독거노인',
        applicationMethod: '주민센터 신청',
        organizationName: '지방자치단체',
        contactInfo: '지역 주민센터',
        lifeCategory: ['노년'],
        serviceCategory: ['안전', '일상돌봄']
      },
      {
        serviceId: 'fallback-004',
        serviceName: '노인일자리 창출사업',
        serviceSummary: '활기찬 노후생활을 위한 다양한 일자리 기회를 제공하는 프로그램입니다.',
        targetAudience: '60세 이상 구직희망자',
        applicationMethod: '노인일자리지원기관 방문',
        organizationName: '고용노동부',
        contactInfo: '1577-3000',
        lifeCategory: ['노년'],
        serviceCategory: ['일자리']
      },
      {
        serviceId: 'fallback-005',
        serviceName: '치매안심센터 운영',
        serviceSummary: '치매 예방, 진단, 치료부터 돌봄까지 치매와 관련된 종합서비스를 제공합니다.',
        targetAudience: '치매환자 및 가족',
        applicationMethod: '치매안심센터 방문 또는 전화',
        organizationName: '보건복지부',
        contactInfo: '1899-9988',
        lifeCategory: ['노년'],
        serviceCategory: ['건강관리', '일상돌봄']
      }
    ];
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    logger.info('공공데이터 API 캐시 초기화 완료');
  }

  /**
   * API 연결 상태 확인
   * @returns {boolean} 연결 가능 여부
   */
  async checkConnection() {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          serviceKey: this.serviceKey,
          numOfRows: 1,
          pageNo: 1,
          _type: 'json'
        },
        timeout: 5000
      });

      const isConnected = response.status === 200 && 
        response.data && 
        response.data.response;

      logger.info('공공데이터 API 연결 상태:', isConnected ? '정상' : '비정상');
      return isConnected;
    } catch (error) {
      logger.error('공공데이터 API 연결 확인 실패:', error.message);
      return false;
    }
  }
}

module.exports = new PublicWelfareApiService();