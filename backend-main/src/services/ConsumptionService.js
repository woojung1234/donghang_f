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
      logger.error('❌ ConsumptionService.getAllConsumptionsByUser Error:', error);
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
      logger.error('❌ ConsumptionService.createConsumption Error:', error);
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

      logger.info(`🔄 Consumption updated - No: ${consumptionNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      logger.error('❌ ConsumptionService.updateConsumption Error:', error);
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

      logger.info(`🗑️ Consumption deleted - No: ${consumptionNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      logger.error('❌ ConsumptionService.deleteConsumption Error:', error);
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
      logger.error('❌ ConsumptionService.getConsumptionStats Error:', error);
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
      logger.error('❌ ConsumptionService.getMonthlyReport Error:', error);
      throw error;
    }
  }

  /**
   * 기간별 날짜 범위 계산 함수
   */
  static getDateRangeByPeriod(period, customMonth = null) {
    const today = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
        
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = new Date(yesterday);
        endDate = new Date(yesterday);
        break;
        
      case 'this_week':
        // 이번 주 월요일부터 일요일까지
        const thisWeekStart = new Date(today);
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        thisWeekStart.setDate(today.getDate() + mondayOffset);
        
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        
        startDate = new Date(thisWeekStart);
        endDate = new Date(thisWeekEnd);
        break;
        
      case 'last_week':
        // 지난 주 월요일부터 일요일까지
        const lastWeekEnd = new Date(today);
        const currentDayOfWeek = today.getDay();
        const lastSundayOffset = currentDayOfWeek === 0 ? -7 : -currentDayOfWeek;
        lastWeekEnd.setDate(today.getDate() + lastSundayOffset);
        
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        
        startDate = new Date(lastWeekStart);
        endDate = new Date(lastWeekEnd);
        break;
        
      case 'this_month':
        // 이번 달 1일부터 오늘까지
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
        
      case 'last_month':
        // 지난 달 1일부터 마지막 날까지
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = new Date(lastMonth);
        endDate = new Date(lastMonthEnd);
        break;
        
      case 'custom_month':
        // 구체적인 월 지정
        if (customMonth) {
          const currentMonth = today.getMonth() + 1;
          let targetYear = today.getFullYear();
          
          // 현재 월보다 큰 월이면 작년
          if (customMonth > currentMonth) {
            targetYear -= 1;
          }
          
          startDate = new Date(targetYear, customMonth - 1, 1);
          endDate = new Date(targetYear, customMonth, 0);
        } else {
          // fallback
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = new Date(today);
        }
        break;
        
      default: // 'recent'
        // 최근 30일
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date(today);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * AI 서비스용 소비내역 조회 함수
   */
  static async getExpenseHistory(userNo, period = 'recent', customMonth = null) {
    try {
      logger.info('소비내역 조회 시도 - 기간:', period, customMonth ? `(${customMonth}월)` : '');
      
      // 기간별 날짜 범위 계산
      const dateRange = this.getDateRangeByPeriod(period, customMonth);
      logger.info('날짜 범위:', dateRange);
      
      const consumptions = await this.getAllConsumptionsByUser(
        userNo,
        dateRange.startDate,
        dateRange.endDate
      );
      
      const summary = await this.getConsumptionStats(
        userNo,
        dateRange.startDate,
        dateRange.endDate
      );
      
      logger.info('소비내역 조회 성공:', { 
        consumptionCount: consumptions.length,
        totalAmount: summary.totalAmount 
      });
      
      return {
        consumptions,
        summary,
        period,
        dateRange
      };
      
    } catch (error) {
      logger.error('소비내역 조회 실패:', error);
      return null;
    }
  }

  /**
   * AI 서비스용 소비 내역 생성 (개선됨)
   */
  static async createConsumptionForAI(userNo, data) {
    try {
      logger.info(`AI 소비 내역 생성 시도 - 사용자: ${userNo}, 금액: ${data.amount}, 카테고리: ${data.category}`);
      
      if (!userNo || !data || !data.amount) {
        logger.error('AI 소비 내역 생성 실패: 필수 데이터 누락', { userNo, data });
        throw new Error('소비 내역 생성에 필요한 데이터가 부족합니다.');
      }
      
      // 데이터 정제 및 기본값 설정
      const cleanData = {
        userNo,
        merchantName: data.merchantName || '음성입력',
        amount: parseInt(data.amount) || 0,  // 확실히 숫자로 변환
        category: data.category || '기타',
        transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
        memo: data.memo || '음성 입력으로 추가된 내역'
      };
      
      // 금액이 유효한지 확인
      if (cleanData.amount <= 0) {
        logger.error('AI 소비 내역 생성 실패: 유효하지 않은 금액', { amount: cleanData.amount });
        throw new Error('유효한 금액이 아닙니다.');
      }

      // 음성 입력용 간소화된 함수 호출
      const consumptionNo = await this.createVoiceConsumption(cleanData);
      
      logger.info(`AI 소비 내역 생성 성공 - ID: ${consumptionNo}, 금액: ${cleanData.amount}`);
      return consumptionNo;
      
    } catch (error) {
      logger.error('❌ ConsumptionService.createConsumptionForAI Error:', error);
      throw error;
    }
  }

  /**
   * 음성 입력용 간소화된 소비 내역 생성 (개선됨)
   */
  static async createVoiceConsumption({ userNo, merchantName, amount, category, transactionDate, memo }) {
    try {
      logger.info(`음성 소비 내역 생성 - 사용자: ${userNo}, 금액: ${amount}, 카테고리: ${category}`);
      
      // 트랜잭션 날짜가 문자열로 들어온 경우 날짜 객체로 변환
      let parsedDate;
      if (transactionDate && typeof transactionDate === 'string') {
        parsedDate = new Date(transactionDate);
        // 날짜가 유효하지 않으면 현재 날짜 사용
        if (isNaN(parsedDate.getTime())) {
          logger.warn(`유효하지 않은 날짜 형식(${transactionDate}), 현재 날짜로 대체`);
          parsedDate = new Date();
        }
      } else {
        parsedDate = new Date();
      }
      
      return await this.createConsumption({
        userNo,
        merchantName: merchantName || '음성입력',
        amount: amount,
        category: category || '기타',
        paymentMethod: '현금',
        transactionDate: parsedDate,
        location: null,
        memo: memo || '음성 입력으로 추가된 내역'
      });

    } catch (error) {
      logger.error('❌ ConsumptionService.createVoiceConsumption Error:', error);
      throw error;
    }
  }
}

module.exports = ConsumptionService;
