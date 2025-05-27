// backend-main/src/controllers/WelfareSyncController.js
const WelfareService = require('../services/WelfareService');
const logger = require('../utils/logger');

class WelfareSyncController {
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
      
      allServices.forEach(service => {
        const category = service.category || '기타';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      const stats = {
        totalServices: allServices.length,
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

  /**
   * 복지서비스 검색
   */
  static async searchWelfareServices(req, res) {
    try {
      const { keyword, page = 1, limit = 20 } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: '검색 키워드를 입력해주세요.'
        });
      }

      const services = await WelfareService.searchWelfareServices(keyword);

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
        },
        keyword: keyword
      };

      res.json({
        success: true,
        message: `'${keyword}' 검색 결과입니다.`,
        data: result
      });

    } catch (error) {
      logger.error('복지서비스 검색 오류:', error);
      res.status(500).json({
        success: false,
        message: '복지서비스 검색에 실패했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = WelfareSyncController;