// backend-main/src/controllers/WelfareApiSyncController.js
const WelfareApiSyncService = require('../services/WelfareApiSyncService');
const logger = require('../utils/logger');

class WelfareApiSyncController {
  /**
   * 수동 전체 동기화 API
   * POST /api/welfare/sync/all
   */
  static async syncAllWelfareData(req, res) {
    try {
      logger.info('🔧 관리자에 의한 수동 전체 동기화 시작');

      const syncService = new WelfareApiSyncService();
      const result = await syncService.syncAllWelfareData();

      res.json({
        success: true,
        message: '복지서비스 데이터 전체 동기화가 완료되었습니다.',
        data: {
          summary: {
            totalProcessed: result.total,
            newServices: result.created,
            updatedServices: result.updated,
            errors: result.errors,
            duration: Math.round((result.endTime - result.startTime) / 1000)
          },
          startTime: result.startTime,
          endTime: result.endTime
        }
      });

    } catch (error) {
      logger.error('❌ 전체 동기화 API 오류:', error);
      res.status(500).json({
        success: false,
        message: '복지서비스 데이터 동기화에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 카테고리별 동기화 API
   * POST /api/welfare/sync/category/:category
   */
  static async syncWelfareDataByCategory(req, res) {
    try {
      const { category } = req.params;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: '카테고리를 지정해주세요.'
        });
      }

      logger.info(`🎯 관리자에 의한 카테고리별 동기화 시작: ${category}`);

      const syncService = new WelfareApiSyncService();
      const result = await syncService.syncWelfareDataByCategory(category);

      res.json({
        success: true,
        message: `'${category}' 카테고리 복지서비스 동기화가 완료되었습니다.`,
        data: {
          summary: {
            category: result.category,
            totalProcessed: result.total,
            newServices: result.created,
            updatedServices: result.updated,
            errors: result.errors,
            duration: Math.round((result.endTime - result.startTime) / 1000)
          },
          startTime: result.startTime,
          endTime: result.endTime
        }
      });

    } catch (error) {
      logger.error(`❌ 카테고리별 동기화 API 오류: ${error.message}`);
      res.status(500).json({
        success: false,
        message: '카테고리별 복지서비스 동기화에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 동기화 상태 확인 API
   * GET /api/welfare/sync/status
   */
  static async getSyncStatus(req, res) {
    try {
      const Welfare = require('../models/Welfare');
      
      // 데이터베이스 통계 조회
      const totalCount = await Welfare.count({ where: { isActive: true } });
      const categoryStats = await Welfare.findAll({
        attributes: [
          'category',
          [Welfare.sequelize.fn('COUNT', Welfare.sequelize.col('welfare_no')), 'count']
        ],
        where: { isActive: true },
        group: ['category'],
        raw: true
      });

      // 최근 업데이트 시간 조회
      const latestUpdate = await Welfare.findOne({
        where: { isActive: true },
        order: [['updatedAt', 'DESC']],
        attributes: ['updatedAt']
      });

      res.json({
        success: true,
        message: '동기화 상태 정보를 조회했습니다.',
        data: {
          database: {
            totalServices: totalCount,
            categoryBreakdown: categoryStats.reduce((acc, item) => {
              acc[item.category || '기타'] = parseInt(item.count);
              return acc;
            }, {}),
            lastUpdated: latestUpdate ? latestUpdate.updatedAt : null
          },
          api: {
            baseUrl: 'https://apis.data.go.kr/1383000/sftf/service',
            isConnected: true, // 실제로는 API 헬스체크 필요
            lastSyncAttempt: null // 별도 로그 테이블에서 관리 가능
          }
        }
      });

    } catch (error) {
      logger.error('❌ 동기화 상태 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '동기화 상태 조회에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * API 연결 테스트
   * GET /api/welfare/sync/test
   */
  static async testApiConnection(req, res) {
    try {
      logger.info('🔍 공공 API 연결 테스트 시작');

      const syncService = new WelfareApiSyncService();
      const testResult = await syncService.fetchWelfareDataFromApi(1, 1); // 1페이지 1개만 테스트

      if (testResult.success) {
        res.json({
          success: true,
          message: '공공 API 연결이 정상입니다.',
          data: {
            totalCount: testResult.totalCount,
            sampleData: testResult.items.length > 0 ? {
              serviceId: testResult.items[0].svcId,
              serviceName: testResult.items[0].svcNm,
              summary: testResult.items[0].svcSumry
            } : null,
            responseTime: new Date().toISOString()
          }
        });
      } else {
        res.status(503).json({
          success: false,
          message: '공공 API 연결에 실패했습니다.',
          error: testResult.error
        });
      }

    } catch (error) {
      logger.error('❌ API 연결 테스트 오류:', error);
      res.status(500).json({
        success: false,
        message: 'API 연결 테스트 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = WelfareApiSyncController;