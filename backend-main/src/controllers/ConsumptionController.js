const { Consumption, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class ConsumptionController {
  // 소비 내역 조회
  static async getConsumptions(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { 
        page = 1, 
        limit = 20, 
        startDate, 
        endDate, 
        category, 
        minAmount, 
        maxAmount,
        riskLevel 
      } = req.query;

      const offset = (page - 1) * limit;
      
      // 필터 조건 구성
      const whereConditions = { userNo: userNo };

      if (startDate && endDate) {
        whereConditions.transactionDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereConditions.transactionDate = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereConditions.transactionDate = {
          [Op.lte]: new Date(endDate)
        };
      }

      if (category) {
        whereConditions.category = category;
      }

      if (minAmount && maxAmount) {
        whereConditions.amount = {
          [Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)]
        };
      } else if (minAmount) {
        whereConditions.amount = {
          [Op.gte]: parseFloat(minAmount)
        };
      } else if (maxAmount) {
        whereConditions.amount = {
          [Op.lte]: parseFloat(maxAmount)
        };
      }

      if (riskLevel) {
        whereConditions.riskLevel = riskLevel;
      }

      const consumptions = await Consumption.findAndCountAll({
        where: whereConditions,
        order: [['transactionDate', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // 총합 계산
      const totalAmount = await Consumption.sum('amount', {
        where: whereConditions
      });

      res.status(200).json({
        message: '소비 내역 조회 성공',
        consumptions: consumptions.rows,
        summary: {
          totalAmount: totalAmount || 0,
          totalCount: consumptions.count,
          averageAmount: consumptions.count > 0 ? totalAmount / consumptions.count : 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(consumptions.count / limit),
          totalCount: consumptions.count,
          hasNext: offset + parseInt(limit) < consumptions.count
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // 소비 내역 상세 조회
  static async getConsumption(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { consumptionId } = req.params;

      const consumption = await Consumption.findOne({
        where: { 
          consumptionNo: consumptionId,
          userNo: userNo 
        }
      });

      if (!consumption) {
        return res.status(404).json({
          message: '소비 내역을 찾을 수 없습니다.'
        });
      }

      res.status(200).json({
        message: '소비 내역 상세 조회 성공',
        consumption: consumption
      });

    } catch (error) {
      next(error);
    }
  }

  // 소비 내역 생성 (카드 사용시 자동 생성용)
  static async createConsumption(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const {
        merchantName,
        amount,
        category,
        paymentMethod,
        transactionDate,
        location,
        memo
      } = req.body;

      // 이상 거래 탐지 로직 (간단한 예시)
      let riskLevel = 'LOW';
      let isAnomalous = false;

      // 금액이 평소보다 높은 경우
      const avgAmount = await Consumption.findOne({
        where: { userNo: userNo },
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount']]
      });

      const userAverage = avgAmount?.dataValues?.avgAmount || 0;
      if (amount > userAverage * 3) {
        riskLevel = 'HIGH';
        isAnomalous = true;
      } else if (amount > userAverage * 2) {
        riskLevel = 'MEDIUM';
      }

      // 야간 시간대 거래
      const transactionHour = new Date(transactionDate).getHours();
      if (transactionHour < 6 || transactionHour > 23) {
        riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
        isAnomalous = true;
      }

      const newConsumption = await Consumption.create({
        userNo: userNo,
        merchantName: merchantName,
        amount: amount,
        category: category || '기타',
        paymentMethod: paymentMethod,
        transactionDate: transactionDate,
        location: location,
        memo: memo,
        riskLevel: riskLevel,
        isAnomalous: isAnomalous
      });

      // 이상 거래인 경우 알림 생성
      if (isAnomalous) {
        const { Notification } = require('../models');
        await Notification.create({
          userNo: userNo,
          title: '이상 거래 탐지',
          content: `${merchantName}에서 ${amount.toLocaleString()}원 결제가 감지되었습니다. 본인이 사용한 것이 맞는지 확인해주세요.`,
          notificationType: 'ANOMALY',
          priority: 'HIGH',
          relatedId: newConsumption.consumptionNo,
          relatedType: 'consumption'
        });
      }

      res.status(201).json({
        message: '소비 내역이 등록되었습니다.',
        consumption: newConsumption,
        warning: isAnomalous ? '이상 거래로 판단되어 알림이 발송되었습니다.' : null
      });

    } catch (error) {
      next(error);
    }
  }

  // 음성 입력으로 소비 내역 생성 (간소화된 버전)
  static async createVoiceConsumption(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const {
        merchantName = '일반가맹점',
        amount,
        category = '기타',
        memo = '',
        location = null
      } = req.body;

      const newConsumption = await Consumption.create({
        userNo: userNo,
        merchantName: merchantName,
        amount: amount,
        category: category,
        paymentMethod: '현금', // 음성 입력은 기본적으로 현금으로 처리
        transactionDate: new Date(),
        location: location,
        memo: memo,
        riskLevel: 'LOW', // 음성 입력은 기본적으로 낮은 위험도
        isAnomalous: false
      });

      res.status(201).json({
        message: '음성으로 소비 내역이 등록되었습니다.',
        consumption: newConsumption
      });

    } catch (error) {
      next(error);
    }
  }

  // 소비 리포트 조회
  static async getReport(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { period = 'month' } = req.query;

      let startDate, endDate;
      const now = new Date();

      if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }

      // 기간별 총 소비
      const totalConsumption = await Consumption.sum('amount', {
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      // 카테고리별 소비
      const categoryConsumption = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'category',
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count']
        ],
        group: ['category'],
        order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']]
      });

      // 일별 소비 (최근 7일)
      const dailyConsumption = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('transactionDate')), 'date'],
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('transactionDate'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('transactionDate')), 'ASC']]
      });

      // 이상 거래 건수
      const anomalousCount = await Consumption.count({
        where: {
          userNo: userNo,
          isAnomalous: true,
          transactionDate: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      // 최다 이용 가맹점
      const topMerchants = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'merchantName',
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count']
        ],
        group: ['merchantName'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'DESC']],
        limit: 5
      });

      res.status(200).json({
        message: '소비 리포트 조회 성공',
        report: {
          period: period,
          periodRange: {
            startDate: startDate,
            endDate: endDate
          },
          summary: {
            totalAmount: totalConsumption || 0,
            anomalousCount: anomalousCount
          },
          categoryBreakdown: categoryConsumption,
          dailyTrend: dailyConsumption,
          topMerchants: topMerchants
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // 소비 패턴 분석
  static async getAnalysis(req, res, next) {
    try {
      const userNo = req.user.userNo;

      // 시간대별 소비 패턴
      const hourlyPattern = await Consumption.findAll({
        where: { userNo: userNo },
        attributes: [
          [require('sequelize').fn('EXTRACT', require('sequelize').literal('HOUR FROM "transactionDate"')), 'hour'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count'],
          [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount']
        ],
        group: [require('sequelize').fn('EXTRACT', require('sequelize').literal('HOUR FROM "transactionDate"'))],
        order: [[require('sequelize').fn('EXTRACT', require('sequelize').literal('HOUR FROM "transactionDate"')), 'ASC']]
      });

      // 요일별 소비 패턴
      const weeklyPattern = await Consumption.findAll({
        where: { userNo: userNo },
        attributes: [
          [require('sequelize').fn('EXTRACT', require('sequelize').literal('DOW FROM "transactionDate"')), 'dayOfWeek'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count'],
          [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount']
        ],
        group: [require('sequelize').fn('EXTRACT', require('sequelize').literal('DOW FROM "transactionDate"'))],
        order: [[require('sequelize').fn('EXTRACT', require('sequelize').literal('DOW FROM "transactionDate"')), 'ASC']]
      });

      // 월별 소비 트렌드
      const monthlyTrend = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 최근 1년
          }
        },
        attributes: [
          [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('transactionDate')), 'month'],
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count']
        ],
        group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('transactionDate'))],
        order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('transactionDate')), 'ASC']]
      });

      res.status(200).json({
        message: '소비 패턴 분석 성공',
        analysis: {
          hourlyPattern: hourlyPattern,
          weeklyPattern: weeklyPattern,
          monthlyTrend: monthlyTrend
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // 노인분들을 위한 큰 그래프용 통계 데이터
  static async getConsumptionStats(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { period } = req.params; // 'daily', 'weekly', 'monthly'

      let groupBy, dateFormat, days;
      
      switch (period) {
        case 'daily':
          groupBy = 'DATE';
          dateFormat = 'YYYY-MM-DD';
          days = 30; // 최근 30일
          break;
        case 'weekly':
          groupBy = 'WEEK';
          dateFormat = 'YYYY-"W"WW';
          days = 84; // 최근 12주
          break;
        case 'monthly':
          groupBy = 'MONTH';
          dateFormat = 'YYYY-MM';
          days = 365; // 최근 12개월
          break;
        default:
          return res.status(400).json({
            message: '올바르지 않은 기간입니다. daily, weekly, monthly 중 선택해주세요.'
          });
      }

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // 기간별 소비 통계
      const stats = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [require('sequelize').fn('DATE_TRUNC', groupBy.toLowerCase(), require('sequelize').col('transactionDate')), 'period'],
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count'],
          [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount']
        ],
        group: [require('sequelize').fn('DATE_TRUNC', groupBy.toLowerCase(), require('sequelize').col('transactionDate'))],
        order: [[require('sequelize').fn('DATE_TRUNC', groupBy.toLowerCase(), require('sequelize').col('transactionDate')), 'ASC']]
      });

      // 카테고리별 통계 (같은 기간)
      const categoryStats = await Consumption.findAll({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'category',
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'count'],
          [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount']
        ],
        group: ['category'],
        order: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'DESC']]
      });

      // 총 통계
      const totalStats = await Consumption.findOne({
        where: {
          userNo: userNo,
          transactionDate: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalAmount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('consumptionNo')), 'totalCount'],
          [require('sequelize').fn('AVG', require('sequelize').col('amount')), 'avgAmount'],
          [require('sequelize').fn('MAX', require('sequelize').col('amount')), 'maxAmount'],
          [require('sequelize').fn('MIN', require('sequelize').col('amount')), 'minAmount']
        ]
      });

      res.status(200).json({
        message: `${period} 소비 통계 조회 성공`,
        period: period,
        dateRange: {
          start: startDate,
          end: new Date()
        },
        stats: {
          timeline: stats.map(item => ({
            period: item.dataValues.period,
            totalAmount: parseInt(item.dataValues.totalAmount) || 0,
            count: parseInt(item.dataValues.count) || 0,
            avgAmount: parseInt(item.dataValues.avgAmount) || 0
          })),
          categories: categoryStats.map(item => ({
            category: item.dataValues.category,
            totalAmount: parseInt(item.dataValues.totalAmount) || 0,
            count: parseInt(item.dataValues.count) || 0,
            avgAmount: parseInt(item.dataValues.avgAmount) || 0
          })),
          summary: {
            totalAmount: parseInt(totalStats.dataValues.totalAmount) || 0,
            totalCount: parseInt(totalStats.dataValues.totalCount) || 0,
            avgAmount: parseInt(totalStats.dataValues.avgAmount) || 0,
            maxAmount: parseInt(totalStats.dataValues.maxAmount) || 0,
            minAmount: parseInt(totalStats.dataValues.minAmount) || 0
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConsumptionController;