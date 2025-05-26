const Consumption = require('../models/Consumption');
const User = require('../models/User');

class ConsumptionService {
  /**
   * 사용자의 모든 소비 내역 조회
   */
  static async getAllConsumptionsByUser(userNo, startDate, endDate) {
    try {
      const whereCondition = { userNo };

      // 날짜 범위 조건 추가
      if (startDate || endDate) {
        const { Op } = require('sequelize');
        whereCondition.transactionDate = {};
        
        if (startDate) {
          whereCondition.transactionDate[Op.gte] = startDate;
        }
        if (endDate) {
          whereCondition.transactionDate[Op.lte] = endDate;
        }
      }

      const consumptions = await Consumption.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName']
          }
        ],
        order: [['transactionDate', 'DESC']]
      });

      return consumptions.map(consumption => ({
        consumptionNo: consumption.consumptionNo,
        merchantName: consumption.merchantName,
        amount: consumption.amount,
        category: consumption.category,
        paymentMethod: consumption.paymentMethod,
        transactionDate: consumption.transactionDate,
        location: consumption.location,
        memo: consumption.memo,
        riskLevel: consumption.riskLevel,
        isAnomalous: consumption.isAnomalous,
        createdAt: consumption.createdAt,
        user: consumption.user ? {
          userNo: consumption.user.userNo,
          userId: consumption.user.userId,
          userName: consumption.user.userName
        } : null
      }));

    } catch (error) {
      console.error('❌ ConsumptionService.getAllConsumptionsByUser Error:', error);
      throw error;
    }
  }

  /**
   * 소비 내역 생성
   */
  static async createConsumption({ 
    userNo, 
    merchantName, 
    amount, 
    category, 
    paymentMethod, 
    transactionDate, 
    location, 
    memo 
  }) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const consumption = await Consumption.create({
        userNo,
        merchantName: merchantName || '일반가맹점',
        amount,
        category: category || '기타',
        paymentMethod: paymentMethod || '현금',
        transactionDate: transactionDate || new Date(),
        location,
        memo,
        riskLevel: 'LOW',
        isAnomalous: false
      });

      console.log(`💰 Consumption created - No: ${consumption.consumptionNo}, UserNo: ${userNo}, Amount: ${amount}`);

      return consumption.consumptionNo;

    } catch (error) {
      console.error('❌ ConsumptionService.createConsumption Error:', error);
      throw error;
    }
  }

  /**
   * 소비 내역 수정
   */
  static async updateConsumption(consumptionNo, updateData, userNo) {
    try {
      const consumption = await Consumption.findOne({
        where: { 
          consumptionNo,
          userNo // 소유권 확인
        }
      });

      if (!consumption) {
        throw new Error('소비 내역을 찾을 수 없습니다.');
      }

      await consumption.update(updateData);

      console.log(`🔄 Consumption updated - No: ${consumptionNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ ConsumptionService.updateConsumption Error:', error);
      throw error;
    }
  }

  /**
   * 소비 내역 삭제
   */
  static async deleteConsumption(consumptionNo, userNo) {
    try {
      const consumption = await Consumption.findOne({
        where: { 
          consumptionNo,
          userNo // 소유권 확인
        }
      });

      if (!consumption) {
        throw new Error('소비 내역을 찾을 수 없습니다.');
      }

      await consumption.destroy();

      console.log(`🗑️ Consumption deleted - No: ${consumptionNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ ConsumptionService.deleteConsumption Error:', error);
      throw error;
    }
  }

  /**
   * 소비 통계 조회
   */
  static async getConsumptionStats(userNo, startDate, endDate) {
    try {
      const { Op } = require('sequelize');
      const sequelize = require('../config/database');

      const whereCondition = { userNo };

      if (startDate || endDate) {
        whereCondition.transactionDate = {};
        if (startDate) {
          whereCondition.transactionDate[Op.gte] = startDate;
        }
        if (endDate) {
          whereCondition.transactionDate[Op.lte] = endDate;
        }
      }

      // 총 소비 금액
      const totalAmount = await Consumption.sum('amount', {
        where: whereCondition
      }) || 0;

      // 소비 건수
      const totalCount = await Consumption.count({
        where: whereCondition
      });

      // 카테고리별 통계
      const categoryStats = await Consumption.findAll({
        where: whereCondition,
        attributes: [
          'category',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('consumption_no')), 'count']
        ],
        group: ['category'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
      });

      return {
        totalAmount,
        totalCount,
        averageAmount: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
        categoryStats: categoryStats.map(stat => ({
          category: stat.category,
          totalAmount: parseInt(stat.dataValues.totalAmount),
          count: parseInt(stat.dataValues.count),
          percentage: totalAmount > 0 ? Math.round((parseInt(stat.dataValues.totalAmount) / totalAmount) * 100) : 0
        }))
      };

    } catch (error) {
      console.error('❌ ConsumptionService.getConsumptionStats Error:', error);
      throw error;
    }
  }

  /**
   * 월별 소비 리포트
   */
  static async getMonthlyReport(userNo, year, month) {
    try {
      const { Op } = require('sequelize');
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const consumptions = await this.getAllConsumptionsByUser(userNo, startDate, endDate);
      const stats = await this.getConsumptionStats(userNo, startDate, endDate);

      return {
        year,
        month,
        consumptions,
        stats
      };

    } catch (error) {
      console.error('❌ ConsumptionService.getMonthlyReport Error:', error);
      throw error;
    }
  }

  /**
   * 음성 입력용 간소화된 소비 내역 생성
   */
  static async createVoiceConsumption({ userNo, merchantName, amount, category, transactionDate, memo }) {
    try {
      return await this.createConsumption({
        userNo,
        merchantName: merchantName || '음성입력',
        amount,
        category: category || '기타',
        paymentMethod: '현금',
        transactionDate: transactionDate || new Date(),
        location: null,
        memo: memo || ''
      });

    } catch (error) {
      console.error('❌ ConsumptionService.createVoiceConsumption Error:', error);
      throw error;
    }
  }
}

module.exports = ConsumptionService;
