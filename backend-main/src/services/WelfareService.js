const Welfare = require('../models/Welfare');

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
        welfareCategory: welfare.welfareCategory
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
        welfareCategory: welfare.welfareCategory
      };

    } catch (error) {
      console.error('❌ WelfareService.getWelfareById Error:', error);
      throw error;
    }
  }

  /**
   * 새 복지 서비스 생성
   */
  static async createWelfare({ welfareName, welfarePrice, welfareCategory }) {
    try {
      const welfare = await Welfare.create({
        welfareName,
        welfarePrice,
        welfareCategory
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
        welfareCategory: welfare.welfareCategory
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
        welfareCategory: welfare.welfareCategory
      }));

    } catch (error) {
      console.error('❌ WelfareService.getWelfareByPriceRange Error:', error);
      throw error;
    }
  }
}

module.exports = WelfareService;
