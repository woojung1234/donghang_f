// backend-main/src/services/WelfareApiSyncService.js
const axios = require('axios');
const Welfare = require('../models/Welfare');
const logger = require('../utils/logger');

class WelfareApiSyncService {
  constructor() {
    // 공공데이터포털 API 설정
    this.apiKey = process.env.WELFARE_API_KEY || 'N9UqNAJj7hLzHoNXu7XozSaMGv6m6mmfrsQcmV7jK%2BJGiKvBXdNBg8WOKZ%2BhVMzqlQ6Zr4XbPvhgfww9VRgDOg%3D%3D';
    this.baseUrl = 'https://apis.data.go.kr/1383000/sftf/service';
    this.pageSize = 100; // 한 번에 가져올 데이터 개수
  }

  /**
   * 공공 API에서 복지서비스 데이터 조회
   * @param {number} pageNo 페이지 번호
   * @param {number} numOfRows 한 페이지 결과 수
   * @returns {Object} API 응답 데이터
   */
  async fetchWelfareDataFromApi(pageNo = 1, numOfRows = 100) {
    try {
      const params = {
        serviceKey: this.apiKey,
        pageNo: pageNo,
        numOfRows: numOfRows,
        dataType: 'json'
      };

      logger.info(`📡 공공 API 호출 - 페이지: ${pageNo}, 개수: ${numOfRows}`);
      
      const response = await axios.get(`${this.baseUrl}/sftfList`, {
        params,
        timeout: 30000 // 30초 타임아웃
      });

      if (response.data && response.data.response) {
        const { header, body } = response.data.response;
        
        if (header.resultCode === '00') {
          logger.info(`✅ API 호출 성공 - 총 ${body.totalCount}개 중 ${body.items?.item?.length || 0}개 조회`);
          return {
            success: true,
            totalCount: body.totalCount,
            items: body.items?.item || [],
            numOfRows: body.numOfRows,
            pageNo: body.pageNo
          };
        } else {
          logger.error(`❌ API 응답 오류: ${header.resultCode} - ${header.resultMsg}`);
          return { success: false, error: header.resultMsg };
        }
      } else {
        logger.error('❌ API 응답 형식 오류');
        return { success: false, error: 'Invalid API response format' };
      }

    } catch (error) {
      logger.error(`❌ API 호출 실패: ${error.message}`);
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'API 호출 타임아웃' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * API 데이터를 데이터베이스 모델에 맞게 변환
   * @param {Object} apiItem API에서 받은 개별 아이템
   * @returns {Object} 데이터베이스 저장용 객체
   */
  transformApiDataToModel(apiItem) {
    return {
      serviceId: apiItem.svcId || `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceName: apiItem.svcNm || '서비스명 없음',
      serviceSummary: apiItem.svcSumry || null,
      ministryName: apiItem.inqplCtgryNm || null,
      organizationName: apiItem.jurMnofNm || null,
      contactInfo: apiItem.svcDtlLink || null,
      website: apiItem.svcDtlLink || null,
      serviceUrl: apiItem.svcDtlLink || null,
      referenceYear: apiItem.lastModYmd?.substr(0, 4) || new Date().getFullYear().toString(),
      lastModifiedDate: apiItem.lastModYmd || new Date().toISOString().split('T')[0].replace(/-/g, ''),
      targetAudience: apiItem.sprtTrgtCn || null,
      applicationMethod: apiItem.aplyMthCn || null,
      category: this.categorizeService(apiItem.svcNm, apiItem.svcSumry),
      isActive: true
    };
  }

  /**
   * 서비스명과 요약을 기반으로 카테고리 분류
   * @param {string} serviceName 서비스명
   * @param {string} summary 서비스 요약
   * @returns {string} 카테고리
   */
  categorizeService(serviceName, summary) {
    const text = `${serviceName || ''} ${summary || ''}`.toLowerCase();

    // 카테고리 키워드 매핑
    const categoryKeywords = {
      '의료/건강': ['의료', '건강', '진료', '치료', '병원', '질병', '검진', '예방접종', '재활'],
      '주거/생활': ['주거', '주택', '임대', '전세', '월세', '생활비', '난방비', '수도요금'],
      '교육/보육': ['교육', '보육', '어린이집', '유치원', '학교', '학습', '교재', '수업료'],
      '고용/취업': ['고용', '취업', '일자리', '구직', '직업', '훈련', '교육훈련', '근로'],
      '복지/돌봄': ['돌봄', '복지', '요양', '간병', '케어', '서비스', '지원', '도우미'],
      '경제/금융': ['경제', '금융', '대출', '지원금', '수당', '급여', '연금', '보조금'],
      '문화/여가': ['문화', '여가', '체육', '스포츠', '예술', '관광', '프로그램'],
      '안전/보안': ['안전', '보안', '방범', '응급', '구조', '신변보호']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return '기타';
  }

  /**
   * 단일 복지서비스 데이터 저장/업데이트
   * @param {Object} welfareData 복지서비스 데이터
   * @returns {Object} 결과 객체
   */
  async saveOrUpdateWelfareData(welfareData) {
    try {
      const existingWelfare = await Welfare.findOne({
        where: { serviceId: welfareData.serviceId }
      });

      if (existingWelfare) {
        // 기존 데이터 업데이트
        await existingWelfare.update(welfareData);
        logger.info(`🔄 복지서비스 업데이트: ${welfareData.serviceName}`);
        return { action: 'updated', welfare: existingWelfare };
      } else {
        // 새 데이터 생성
        const newWelfare = await Welfare.create(welfareData);
        logger.info(`➕ 새 복지서비스 추가: ${welfareData.serviceName}`);
        return { action: 'created', welfare: newWelfare };
      }

    } catch (error) {
      logger.error(`❌ 복지서비스 저장 실패 (${welfareData.serviceName}): ${error.message}`);
      throw error;
    }
  }

  /**
   * 전체 복지서비스 데이터 동기화
   * @returns {Object} 동기화 결과
   */
  async syncAllWelfareData() {
    try {
      logger.info('🚀 복지서비스 데이터 동기화 시작');
      
      const stats = {
        total: 0,
        created: 0,
        updated: 0,
        errors: 0,
        startTime: new Date(),
        endTime: null
      };

      let pageNo = 1;
      let hasMoreData = true;

      while (hasMoreData) {
        const apiResult = await this.fetchWelfareDataFromApi(pageNo, this.pageSize);
        
        if (!apiResult.success) {
          logger.error(`❌ API 호출 실패 (페이지 ${pageNo}): ${apiResult.error}`);
          stats.errors++;
          break;
        }

        const { items, totalCount } = apiResult;
        
        if (!items || items.length === 0) {
          logger.info('📄 더 이상 가져올 데이터가 없습니다.');
          hasMoreData = false;
          break;
        }

        // 각 아이템 처리
        for (const item of items) {
          try {
            const welfareData = this.transformApiDataToModel(item);
            const result = await this.saveOrUpdateWelfareData(welfareData);
            
            if (result.action === 'created') {
              stats.created++;
            } else if (result.action === 'updated') {
              stats.updated++;
            }
            
            stats.total++;
          } catch (error) {
            stats.errors++;
            logger.error(`❌ 데이터 처리 실패: ${error.message}`);
          }
        }

        logger.info(`📊 진행상황: ${stats.total}/${totalCount} (페이지 ${pageNo})`);

        // 다음 페이지 확인
        if (items.length < this.pageSize || stats.total >= totalCount) {
          hasMoreData = false;
        } else {
          pageNo++;
          // API 호출 간격 조절 (Rate Limit 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      stats.endTime = new Date();
      const duration = Math.round((stats.endTime - stats.startTime) / 1000);

      logger.info(`✅ 동기화 완료 - 소요시간: ${duration}초`);
      logger.info(`📈 결과: 총 ${stats.total}개, 추가 ${stats.created}개, 업데이트 ${stats.updated}개, 오류 ${stats.errors}개`);

      return stats;

    } catch (error) {
      logger.error(`❌ 전체 동기화 실패: ${error.message}`);
      throw error;
    }
  }
}

module.exports = WelfareApiSyncService;