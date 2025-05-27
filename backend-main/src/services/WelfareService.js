const Welfare = require('../models/Welfare');
const axios = require('axios');

class WelfareService {
  /**
   * 모든 복지 서비스 조회
   */
  static async getAllWelfareServices() {
    try {
      const welfareList = await Welfare.findAll({
        order: [['welfareNo', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      }));

    } catch (error) {
      console.error('❌ WelfareService.getAllWelfareServices Error:', error);
      throw error;
    }
  }

  /**
   * ID로 특정 복지 서비스 조회
   */
  static async getWelfareById(welfareNo) {
    try {
      const welfare = await Welfare.findOne({
        where: { welfareNo }
      });

      if (!welfare) {
        return null;
      }

      return {
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      };

    } catch (error) {
      console.error('❌ WelfareService.getWelfareById Error:', error);
      throw error;
    }
  }

  /**
   * 새 복지 서비스 생성
   */
  static async createWelfare({ 
    welfareName, 
    welfarePrice, 
    welfareCategory,
    welfareDescription = null,
    targetAge = null,
    serviceArea = null,
    contactInfo = null
  }) {
    try {
      const welfare = await Welfare.create({
        welfareName,
        welfarePrice,
        welfareCategory,
        welfareDescription,
        targetAge,
        serviceArea,
        contactInfo
      });

      console.log(`✅ New welfare service created - WelfareNo: ${welfare.welfareNo}, Name: ${welfareName}`);

      return welfare.welfareNo;

    } catch (error) {
      console.error('❌ WelfareService.createWelfare Error:', error);
      throw error;
    }
  }

  /**
   * 복지 서비스 정보 수정
   */
  static async updateWelfare(welfareNo, updateData) {
    try {
      const welfare = await Welfare.findOne({
        where: { welfareNo }
      });

      if (!welfare) {
        return false;
      }

      await welfare.update(updateData);

      console.log(`🔄 Welfare service updated - WelfareNo: ${welfareNo}`);

      return true;

    } catch (error) {
      console.error('❌ WelfareService.updateWelfare Error:', error);
      throw error;
    }
  }

  /**
   * 복지 서비스 삭제
   */
  static async deleteWelfare(welfareNo) {
    try {
      const welfare = await Welfare.findOne({
        where: { welfareNo }
      });

      if (!welfare) {
        return false;
      }

      await welfare.destroy();

      console.log(`🗑️ Welfare service deleted - WelfareNo: ${welfareNo}`);

      return true;

    } catch (error) {
      console.error('❌ WelfareService.deleteWelfare Error:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 복지 서비스 조회
   */
  static async getWelfareByCategory(category) {
    try {
      const welfareList = await Welfare.findAll({
        where: { welfareCategory: category },
        order: [['welfarePrice', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      }));

    } catch (error) {
      console.error('❌ WelfareService.getWelfareByCategory Error:', error);
      throw error;
    }
  }

  /**
   * 가격 범위별 복지 서비스 조회
   */
  static async getWelfareByPriceRange(minPrice, maxPrice) {
    try {
      const { Op } = require('sequelize');
      
      const whereCondition = {};
      if (minPrice !== undefined) {
        whereCondition.welfarePrice = { [Op.gte]: minPrice };
      }
      if (maxPrice !== undefined) {
        whereCondition.welfarePrice = {
          ...whereCondition.welfarePrice,
          [Op.lte]: maxPrice
        };
      }

      const welfareList = await Welfare.findAll({
        where: whereCondition,
        order: [['welfarePrice', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      }));

    } catch (error) {
      console.error('❌ WelfareService.getWelfareByPriceRange Error:', error);
      throw error;
    }
  }

  /**
   * 공공 API 키 유효성 검증
   */
  static async validatePublicApiKey() {
    try {
      const apiKey = process.env.PUBLIC_DATA_API_KEY;
      if (!apiKey) {
        console.log('❌ 공공 API 키가 설정되지 않음');
        return false;
      }

      // 실제 공공 API 호출 테스트 (예: 보건복지부 복지서비스 API)
      const testUrl = `https://apis.data.go.kr/B554287/DisabledPersonVocationalRehabilitationService/getVocationalRehabilitationServiceList?serviceKey=${apiKey}&numOfRows=1&pageNo=1&type=json`;
      
      try {
        const response = await axios.get(testUrl, { timeout: 5000 });
        
        // API 응답이 성공적인지 확인
        if (response.status === 200 && response.data) {
          console.log('✅ 공공 API 키 유효성 검증 성공');
          return true;
        }
      } catch (apiError) {
        console.log('❌ 공공 API 호출 실패:', apiError.message);
      }
      
      return false;
    } catch (error) {
      console.error('❌ API 키 검증 오류:', error);
      return false;
    }
  }

  /**
   * 공공 API에서 복지서비스 데이터 동기화
   */
  static async syncFromPublicApi() {
    try {
      const apiKey = process.env.PUBLIC_DATA_API_KEY;
      if (!apiKey) {
        throw new Error('공공 API 키가 설정되지 않음');
      }

      // 여러 공공 API 엔드포인트에서 데이터 수집
      const syncResults = [];
      
      // 1. 보건복지부 장애인 직업재활 서비스
      try {
        const vocationalUrl = `https://apis.data.go.kr/B554287/DisabledPersonVocationalRehabilitationService/getVocationalRehabilitationServiceList?serviceKey=${apiKey}&numOfRows=20&pageNo=1&type=json`;
        const vocationalResponse = await axios.get(vocationalUrl, { timeout: 10000 });
        
        if (vocationalResponse.data?.response?.body?.items) {
          const items = Array.isArray(vocationalResponse.data.response.body.items) 
            ? vocationalResponse.data.response.body.items 
            : [vocationalResponse.data.response.body.items];
            
          for (const item of items) {
            if (item && item.svcNm) {
              await this.createWelfare({
                welfareName: item.svcNm || '직업재활서비스',
                welfarePrice: 0,
                welfareCategory: '직업재활',
                welfareDescription: item.svcCn || '장애인 직업재활 서비스입니다.',
                serviceArea: item.ctpvNm || '전국',
                contactInfo: item.telno || null
              });
              syncResults.push({ service: item.svcNm, status: 'success' });
            }
          }
        }
      } catch (apiError) {
        console.log('보건복지부 API 호출 실패:', apiError.message);
      }

      console.log(`✅ 공공 API 동기화 완료: ${syncResults.length}개 서비스 추가`);
      return { syncedCount: syncResults.length, results: syncResults };

    } catch (error) {
      console.error('❌ 공공 API 동기화 오류:', error);
      throw error;
    }
  }

  /**
   * 샘플 복지서비스 데이터 생성
   */
  static async createSampleWelfareData() {
    try {
      const sampleData = [
        {
          welfareName: '어르신 건강체조 교실',
          welfarePrice: 0,
          welfareCategory: '건강',
          welfareDescription: '어르신들의 건강 증진을 위한 맞춤형 체조 프로그램입니다. 전문 강사와 함께 안전하게 운동할 수 있습니다.',
          targetAge: '65세 이상',
          serviceArea: '전국',
          contactInfo: '보건소 또는 복지관 문의'
        },
        {
          welfareName: '노인 일자리 창출 사업',
          welfarePrice: 0,
          welfareCategory: '취업',
          welfareDescription: '어르신들의 사회참여와 소득창출을 위한 다양한 일자리를 제공합니다.',
          targetAge: '60세 이상',
          serviceArea: '전국',
          contactInfo: '시니어클럽, 노인복지관'
        },
        {
          welfareName: '경로당 프로그램 운영',
          welfarePrice: 0,
          welfareCategory: '사회참여',
          welfareDescription: '지역 경로당에서 진행되는 다양한 여가활동 및 교육 프로그램입니다.',
          targetAge: '65세 이상',
          serviceArea: '전국',
          contactInfo: '지역 경로당'
        },
        {
          welfareName: '문화예술 교육 프로그램',
          welfarePrice: 5000,
          welfareCategory: '문화',
          welfareDescription: '어르신들을 위한 서예, 그림, 음악 등 다양한 문화예술 교육을 제공합니다.',
          targetAge: '60세 이상',
          serviceArea: '전국',
          contactInfo: '문화센터, 복지관'
        },
        {
          welfareName: '실버 요리 교실',
          welfarePrice: 10000,
          welfareCategory: '교육',
          welfareDescription: '건강한 식단과 요리법을 배우며 영양 관리를 할 수 있는 프로그램입니다.',
          targetAge: '55세 이상',
          serviceArea: '전국',
          contactInfo: '지역 복지관'
        },
        {
          welfareName: '어르신 스마트폰 교육',
          welfarePrice: 0,
          welfareCategory: '교육',
          welfareDescription: '디지털 격차 해소를 위한 스마트폰 기초 사용법 교육 프로그램입니다.',
          targetAge: '60세 이상',
          serviceArea: '전국',
          contactInfo: '주민센터, 복지관'
        },
        {
          welfareName: '치매 예방 인지 훈련',
          welfarePrice: 0,
          welfareCategory: '건강',
          welfareDescription: '치매 예방을 위한 인지 능력 향상 프로그램으로 전문가가 진행합니다.',
          targetAge: '65세 이상',
          serviceArea: '전국',
          contactInfo: '치매안심센터'
        },
        {
          welfareName: '노인 상담 및 심리지원 서비스',
          welfarePrice: 0,
          welfareCategory: '상담',
          welfareDescription: '어르신들의 심리적 안정과 정신건강을 위한 전문 상담 서비스입니다.',
          targetAge: '60세 이상',
          serviceArea: '전국',
          contactInfo: '노인상담센터'
        },
        {
          welfareName: '실버 댄스 교실',
          welfarePrice: 8000,
          welfareCategory: '문화',
          welfareDescription: '건강한 신체활동과 즐거운 여가시간을 위한 댄스 프로그램입니다.',
          targetAge: '50세 이상',
          serviceArea: '전국',
          contactInfo: '문화센터, 복지관'
        },
        {
          welfareName: '노인 돌봄 서비스',
          welfarePrice: 0,
          welfareCategory: '돌봄',
          welfareDescription: '거동이 불편한 어르신들을 위한 일상생활 지원 서비스입니다.',
          targetAge: '65세 이상',
          serviceArea: '전국',
          contactInfo: '국민건강보험공단'
        }
      ];

      const createdServices = [];
      
      for (const data of sampleData) {
        try {
          // 이미 같은 이름의 서비스가 있는지 확인
          const existingService = await Welfare.findOne({
            where: { welfareName: data.welfareName }
          });
          
          if (!existingService) {
            const welfareNo = await this.createWelfare(data);
            createdServices.push({ 
              welfareNo,
              welfareName: data.welfareName,
              category: data.welfareCategory
            });
          }
        } catch (err) {
          console.error(`샘플 데이터 생성 실패 - ${data.welfareName}:`, err.message);
        }
      }

      console.log(`✅ 샘플 복지서비스 데이터 생성 완료: ${createdServices.length}개 서비스`);
      return { 
        createdCount: createdServices.length, 
        services: createdServices,
        message: `${createdServices.length}개의 샘플 복지서비스가 생성되었습니다.`
      };

    } catch (error) {
      console.error('❌ 샘플 데이터 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 키워드로 복지서비스 검색
   */
  static async searchWelfareServices(keyword) {
    try {
      const { Op } = require('sequelize');
      
      const welfareList = await Welfare.findAll({
        where: {
          [Op.or]: [
            { welfareName: { [Op.like]: `%${keyword}%` } },
            { welfareCategory: { [Op.like]: `%${keyword}%` } },
            { welfareDescription: { [Op.like]: `%${keyword}%` } }
          ]
        },
        order: [['welfarePrice', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      }));

    } catch (error) {
      console.error('❌ WelfareService.searchWelfareServices Error:', error);
      throw error;
    }
  }

  /**
   * 금복이 AI용 복지서비스 추천 (나이, 관심사에 따른 맞춤 추천)
   */
  static async getRecommendedWelfareForAI(userAge = null, interests = [], maxCount = 3) {
    try {
      let whereCondition = {};
      
      // 나이에 따른 필터링
      if (userAge) {
        const { Op } = require('sequelize');
        whereCondition = {
          [Op.or]: [
            { targetAge: null }, // 나이 제한 없는 서비스
            { targetAge: { [Op.like]: '%전체%' } },
            { targetAge: { [Op.like]: '%모든%' } }
          ]
        };
        
        // 구체적인 나이 조건 확인
        if (userAge >= 65) {
          whereCondition[Op.or].push(
            { targetAge: { [Op.like]: '%65세%' } },
            { targetAge: { [Op.like]: '%어르신%' } },
            { targetAge: { [Op.like]: '%노인%' } }
          );
        } else if (userAge >= 60) {
          whereCondition[Op.or].push(
            { targetAge: { [Op.like]: '%60세%' } },
            { targetAge: { [Op.like]: '%55세%' } }
          );
        }
      }

      const welfareList = await Welfare.findAll({
        where: whereCondition,
        order: [['welfarePrice', 'ASC'], ['welfareNo', 'ASC']]
      });

      let filteredServices = welfareList;

      // 관심사에 따른 추가 필터링
      if (interests && interests.length > 0) {
        const { Op } = require('sequelize');
        const interestFiltered = welfareList.filter(service => {
          return interests.some(interest => 
            service.welfareCategory?.toLowerCase().includes(interest.toLowerCase()) ||
            service.welfareName?.toLowerCase().includes(interest.toLowerCase()) ||
            service.welfareDescription?.toLowerCase().includes(interest.toLowerCase())
          );
        });
        
        if (interestFiltered.length > 0) {
          filteredServices = interestFiltered;
        }
      }

      // 무료 서비스 우선 정렬 후 랜덤 선택
      const freeServices = filteredServices.filter(service => !service.welfarePrice || service.welfarePrice === 0);
      const paidServices = filteredServices.filter(service => service.welfarePrice && service.welfarePrice > 0);
      
      let selectedServices = [];
      
      // 무료 서비스 우선 선택 (최대 2개)
      if (freeServices.length > 0) {
        const shuffledFree = [...freeServices].sort(() => 0.5 - Math.random());
        selectedServices = selectedServices.concat(shuffledFree.slice(0, Math.min(2, maxCount)));
      }
      
      // 부족한 만큼 유료 서비스에서 추가
      if (selectedServices.length < maxCount && paidServices.length > 0) {
        const shuffledPaid = [...paidServices].sort(() => 0.5 - Math.random());
        const needed = maxCount - selectedServices.length;
        selectedServices = selectedServices.concat(shuffledPaid.slice(0, needed));
      }

      return selectedServices.map(welfare => ({
        welfareNo: welfare.welfareNo,
        welfareName: welfare.welfareName,
        welfarePrice: welfare.welfarePrice,
        welfareCategory: welfare.welfareCategory,
        welfareDescription: welfare.welfareDescription || null,
        targetAge: welfare.targetAge || null,
        serviceArea: welfare.serviceArea || null,
        contactInfo: welfare.contactInfo || null
      }));

    } catch (error) {
      console.error('❌ WelfareService.getRecommendedWelfareForAI Error:', error);
      throw error;
    }
  }
}

module.exports = WelfareService;