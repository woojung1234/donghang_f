const Welfare = require('../models/Welfare');

class WelfareService {
  /**
   * 모든 복지 서비스 조회
   */
  static async getAllWelfareServices() {
    try {
      const welfareList = await Welfare.findAll({
        where: { isActive: true },
        order: [['welfareNo', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        serviceId: welfare.serviceId,
        serviceName: welfare.serviceName,
        serviceSummary: welfare.serviceSummary,
        ministryName: welfare.ministryName,
        organizationName: welfare.organizationName,
        contactInfo: welfare.contactInfo,
        website: welfare.website,
        serviceUrl: welfare.serviceUrl,
        targetAudience: welfare.targetAudience,
        applicationMethod: welfare.applicationMethod,
        category: welfare.category
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
        where: { welfareNo, isActive: true }
      });

      if (!welfare) {
        return null;
      }

      return {
        welfareNo: welfare.welfareNo,
        serviceId: welfare.serviceId,
        serviceName: welfare.serviceName,
        serviceSummary: welfare.serviceSummary,
        ministryName: welfare.ministryName,
        organizationName: welfare.organizationName,
        contactInfo: welfare.contactInfo,
        website: welfare.website,
        serviceUrl: welfare.serviceUrl,
        targetAudience: welfare.targetAudience,
        applicationMethod: welfare.applicationMethod,
        category: welfare.category
      };

    } catch (error) {
      console.error('❌ WelfareService.getWelfareById Error:', error);
      throw error;
    }
  }

  /**
   * 새 복지 서비스 생성
   */
  static async createWelfare(welfareData) {
    try {
      const welfare = await Welfare.create(welfareData);

      console.log(`✅ New welfare service created - WelfareNo: ${welfare.welfareNo}, Name: ${welfare.serviceName}`);

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

      await welfare.update({ isActive: false });

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
        where: { 
          category: category,
          isActive: true 
        },
        order: [['serviceName', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        serviceId: welfare.serviceId,
        serviceName: welfare.serviceName,
        serviceSummary: welfare.serviceSummary,
        ministryName: welfare.ministryName,
        organizationName: welfare.organizationName,
        contactInfo: welfare.contactInfo,
        website: welfare.website,
        serviceUrl: welfare.serviceUrl,
        targetAudience: welfare.targetAudience,
        applicationMethod: welfare.applicationMethod,
        category: welfare.category
      }));

    } catch (error) {
      console.error('❌ WelfareService.getWelfareByCategory Error:', error);
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
          [Op.and]: [
            { isActive: true },
            {
              [Op.or]: [
                { serviceName: { [Op.iLike]: `%${keyword}%` } },
                { serviceSummary: { [Op.iLike]: `%${keyword}%` } },
                { category: { [Op.iLike]: `%${keyword}%` } },
                { targetAudience: { [Op.iLike]: `%${keyword}%` } }
              ]
            }
          ]
        },
        order: [['serviceName', 'ASC']]
      });

      return welfareList.map(welfare => ({
        welfareNo: welfare.welfareNo,
        serviceId: welfare.serviceId,
        serviceName: welfare.serviceName,
        serviceSummary: welfare.serviceSummary,
        ministryName: welfare.ministryName,
        organizationName: welfare.organizationName,
        contactInfo: welfare.contactInfo,
        website: welfare.website,
        serviceUrl: welfare.serviceUrl,
        targetAudience: welfare.targetAudience,
        applicationMethod: welfare.applicationMethod,
        category: welfare.category
      }));

    } catch (error) {
      console.error('❌ WelfareService.searchWelfareServices Error:', error);
      throw error;
    }
  }

  /**
   * AI 챗봇용 복지서비스 추천 (기존 공공 API 데이터 활용)
   */
  static async getRecommendedWelfareForAI(userAge = null, interests = [], maxCount = 3) {
    try {
      const { Op } = require('sequelize');
      
      let whereCondition = { isActive: true };
      
      // 관심사에 따른 카테고리 필터링
      if (interests && interests.length > 0) {
        const categoryConditions = interests.map(interest => {
          return {
            [Op.or]: [
              { category: { [Op.iLike]: `%${interest}%` } },
              { serviceName: { [Op.iLike]: `%${interest}%` } },
              { serviceSummary: { [Op.iLike]: `%${interest}%` } },
              { targetAudience: { [Op.iLike]: `%${interest}%` } }
            ]
          };
        });
        
        whereCondition[Op.or] = categoryConditions;
      }

      const welfareList = await Welfare.findAll({
        where: whereCondition,
        order: [['serviceName', 'ASC']],
        limit: maxCount * 2 // 더 많이 가져와서 랜덤 선택
      });

      // 랜덤하게 섞어서 maxCount만큼 선택
      const shuffled = welfareList.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, maxCount);

      return selected.map(welfare => ({
        welfareNo: welfare.welfareNo,
        serviceId: welfare.serviceId,
        serviceName: welfare.serviceName,
        serviceSummary: welfare.serviceSummary,
        ministryName: welfare.ministryName,
        organizationName: welfare.organizationName,
        contactInfo: welfare.contactInfo,
        website: welfare.website,
        serviceUrl: welfare.serviceUrl,
        targetAudience: welfare.targetAudience,
        applicationMethod: welfare.applicationMethod,
        category: welfare.category
      }));

    } catch (error) {
      console.error('❌ WelfareService.getRecommendedWelfareForAI Error:', error);
      throw error;
    }
  }
}

module.exports = WelfareService;