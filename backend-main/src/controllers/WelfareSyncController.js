// backend-main/src/controllers/WelfareSyncController.js
const PublicWelfareApiService = require('../services/PublicWelfareApiService');
const WelfareService = require('../services/WelfareService');
const logger = require('../utils/logger');

class WelfareSyncController {
  /**
   * 공공 API에서 복지서비스 데이터 동기화
   */
  static async syncWelfareServices(req, res) {
    try {
      logger.info('복지서비스 동기화 요청 시작');

      // API 키 유효성 검증
      const isValidKey = await PublicWelfareApiService.validateApiKey();
      
      if (!isValidKey) {
        logger.warn('공공 API 키가 유효하지 않음. 샘플 데이터로 대체');
        const sampleResult = await PublicWelfareApiService.createSampleWelfareData();
        
        return res.json({
          success: true,
          message: '공공 API 연결 실패로 샘플 데이터를 생성했습니다.',
          data: sampleResult,
          usedSampleData: true
        });
      }

      // 공공 API에서 데이터 동기화
      const syncResult = await PublicWelfareApiService.syncAllWelfareServices();

      res.json({
        success: true,
        message: '복지서비스 동기화가 완료되었습니다.',
        data: syncResult,
        usedSampleData: false
      });

    } catch (error) {
      logger.error('복지서비스 동기화 오류:', error);
      
      // 오류 발생시 샘플 데이터라도 생성
      try {
        const sampleResult = await PublicWelfareApiService.createSampleWelfareData();
        
        res.status(200).json({
          success: true,
          message: '공공 API 오류로 인해 샘플 데이터를 생성했습니다.',
          data: sampleResult,
          usedSampleData: true,
          error: error.message
        });
      } catch (sampleError) {
        res.status(500).json({
          success: false,
          message: '복지서비스 동기화 및 샘플 데이터 생성에 실패했습니다.',
          error: error.message
        });
      }
    }
  }

  /**
   * 현재 저장된 복지서비스 목록 조회
   */
  static async getWelfareServices(req, res) {
    try {
      const { category, page = 1, limit = 20 } = req.query;

      let services;
      
      if (category) {
        services = await WelfareService.getWelfareByCategory(category);
      } else {
        services = await WelfareService.getAllWelfareServices();
      }

      // 페이징 처리
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedServices = services.slice(startIndex, endIndex);

      const result = {
        services: paginatedServices,
        pagination: {
          currentPage: parseInt(page),
          totalItems: services.length,
          totalPages: Math.ceil(services.length / limit),
          itemsPerPage: parseInt(limit)
        }
      };

      res.json({
        success: true,
        message: '복지서비스 목록을 조회했습니다.',
        data: result
      });

    } catch (error) {
      logger.error('복지서비스 목록 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '복지서비스 목록 조회에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 복지서비스 통계 정보 조회
   */
  static async getWelfareStats(req, res) {
    try {
      const allServices = await WelfareService.getAllWelfareServices();
      
      // 카테고리별 통계
      const categoryStats = {};
      let freeServiceCount = 0;
      let paidServiceCount = 0;
      
      allServices.forEach(service => {
        // 카테고리별 카운트
        const category = service.welfareCategory || '기타';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        
        // 무료/유료 서비스 카운트
        if (!service.welfarePrice || service.welfarePrice === 0) {
          freeServiceCount++;
        } else {
          paidServiceCount++;
        }
      });

      const stats = {
        totalServices: allServices.length,
        freeServices: freeServiceCount,
        paidServices: paidServiceCount,
        categoryBreakdown: categoryStats,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        message: '복지서비스 통계 정보를 조회했습니다.',
        data: stats
      });

    } catch (error) {
      logger.error('복지서비스 통계 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '복지서비스 통계 조회에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 공공 API 연결 상태 확인
   */
  static async checkApiStatus(req, res) {
    try {
      const isValidKey = await PublicWelfareApiService.validateApiKey();
      
      res.json({
        success: true,
        data: {
          apiConnected: isValidKey,
          apiKey: process.env.PUBLIC_DATA_API_KEY ? '설정됨' : '미설정',
          message: isValidKey ? 'API 연결 정상' : 'API 연결 실패 또는 키 미설정'
        }
      });

    } catch (error) {
      logger.error('API 상태 확인 오류:', error);
      res.json({
        success: true,
        data: {
          apiConnected: false,
          apiKey: process.env.PUBLIC_DATA_API_KEY ? '설정됨' : '미설정',
          message: 'API 연결 확인 중 오류 발생',
          error: error.message
        }
      });
    }
  }

  /**
   * 샘플 복지서비스 데이터 생성
   */
  static async createSampleData(req, res) {
    try {
      const result = await PublicWelfareApiService.createSampleWelfareData();
      
      res.json({
        success: true,
        message: '샘플 복지서비스 데이터를 생성했습니다.',
        data: result
      });

    } catch (error) {
      logger.error('샘플 데이터 생성 오류:', error);
      res.status(500).json({
        success: false,
        message: '샘플 데이터 생성에 실패했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 특정 복지서비스 상세 정보 조회
   */
  static async getWelfareServiceDetail(req, res) {
    try {
      const { id } = req.params;
      
      const service = await WelfareService.getWelfareById(parseInt(id));
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: '해당 복지서비스를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '복지서비스 상세 정보를 조회했습니다.',
        data: service
      });

    } catch (error) {
      logger.error('복지서비스 상세 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '복지서비스 상세 조회에 실패했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = WelfareSyncController;