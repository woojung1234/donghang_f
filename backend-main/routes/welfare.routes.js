const express = require('express');
const axios = require('axios');
const router = express.Router();
const { Welfare, WelfareFavorite, User } = require('../src/models');
const auth = require('../src/middleware/auth');
const { Op } = require('sequelize');

// 환경 변수에서 API 키 가져오기
const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;

/**
 * @route   GET /api/welfare
 * @desc    복지 서비스 목록 조회
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereCondition = { isActive: true };
    
    if (category) {
      whereCondition.category = category;
    }
    
    // 데이터베이스에서 복지 서비스 조회
    const { count, rows } = await Welfare.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('복지 서비스 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/welfare/search
 * @desc    복지 서비스 검색
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!keyword) {
      return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }
    
    // 검색 조건
    const whereCondition = {
      isActive: true,
      [Op.or]: [
        { serviceName: { [Op.like]: `%${keyword}%` } },
        { serviceSummary: { [Op.like]: `%${keyword}%` } },
        { ministryName: { [Op.like]: `%${keyword}%` } },
        { organizationName: { [Op.like]: `%${keyword}%` } },
        { targetAudience: { [Op.like]: `%${keyword}%` } }
      ]
    };
    
    // 데이터베이스에서 검색
    const { count, rows } = await Welfare.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('복지 서비스 검색 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/welfare/:id
 * @desc    복지 서비스 상세 조회
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 데이터베이스에서 복지 서비스 상세 정보 조회
    const welfare = await Welfare.findOne({ 
      where: { serviceId: id }
    });
    
    if (!welfare) {
      return res.status(404).json({ message: '해당 복지 서비스를 찾을 수 없습니다.' });
    }
    
    res.json(welfare);
  } catch (error) {
    console.error('복지 서비스 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   POST /api/welfare/:id/favorite
 * @desc    복지 서비스 즐겨찾기 추가/삭제
 * @access  Private
 */
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // 복지 서비스 존재 확인
    const welfare = await Welfare.findOne({ where: { serviceId: id } });
    if (!welfare) {
      return res.status(404).json({ message: '해당 복지 서비스를 찾을 수 없습니다.' });
    }

    // 기존 즐겨찾기 확인
    const existingFavorite = await WelfareFavorite.findOne({
      where: {
        userNo: user.userNo,
        serviceId: id
      }
    });

    if (existingFavorite) {
      // 즐겨찾기 삭제
      await existingFavorite.destroy();
      res.json({ message: '즐겨찾기에서 제거되었습니다.', isFavorite: false });
    } else {
      // 즐겨찾기 추가
      await WelfareFavorite.create({
        userNo: user.userNo,
        serviceId: id
      });
      res.json({ message: '즐겨찾기에 추가되었습니다.', isFavorite: true });
    }
  } catch (error) {
    console.error('즐겨찾기 처리 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/welfare/user/favorites
 * @desc    사용자 즐겨찾기 복지 서비스 목록
 * @access  Private
 */
router.get('/user/favorites', auth, async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await WelfareFavorite.findAndCountAll({
      where: {
        userNo: user.userNo,
        isActive: true
      },
      include: [{
        model: Welfare,
        as: 'welfare',
        where: { isActive: true }
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const favorites = rows.map(favorite => ({
      ...favorite.welfare.toJSON(),
      favoriteId: favorite.favoriteNo,
      favoritedAt: favorite.createdAt
    }));

    res.json({
      data: favorites,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('즐겨찾기 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   POST /api/welfare/sync
 * @desc    공공 데이터 포털에서 복지 서비스 데이터 동기화 (관리자 전용)
 * @access  Private (Admin)
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { user } = req;
    
    // 관리자 권한 체크 (userType이 'ADMIN' 또는 별도 관리자 시스템 사용)
    // 현재는 개발용으로 임시 허용
    
    // 공공 데이터 포털 API 호출
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: 1,
        perPage: 1000
      }
    });
    
    if (!response.data || !response.data.data) {
      return res.status(500).json({ message: '공공 데이터 포털에서 데이터를 가져오는데 실패했습니다.' });
    }
    
    const serviceData = response.data.data;
    let successCount = 0;
    let errorCount = 0;
    
    for (const service of serviceData) {
      try {
        // 서비스 아이디 확인
        const serviceId = service.서비스아이디 || `WF${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        
        // 기존 서비스 확인 및 업데이트 또는 생성
        const [welfare, created] = await Welfare.findOrCreate({
          where: { serviceId },
          defaults: {
            serviceId,
            serviceName: service.서비스명 || '',
            serviceSummary: service.서비스요약 || '',
            ministryName: service.소관부처명 || '',
            organizationName: service.소관조직명 || '',
            contactInfo: service.대표문의 || '',
            website: service.사이트 || '',
            serviceUrl: service.서비스URL || '',
            referenceYear: service.기준연도 || null,
            lastModifiedDate: service.최종수정일 || '',
            targetAudience: service.지원대상 || '',
            applicationMethod: service.신청방법 || '',
            isActive: true
          }
        });

        if (!created) {
          // 기존 서비스 업데이트
          await welfare.update({
            serviceName: service.서비스명 || welfare.serviceName,
            serviceSummary: service.서비스요약 || welfare.serviceSummary,
            ministryName: service.소관부처명 || welfare.ministryName,
            organizationName: service.소관조직명 || welfare.organizationName,
            contactInfo: service.대표문의 || welfare.contactInfo,
            website: service.사이트 || welfare.website,
            serviceUrl: service.서비스URL || welfare.serviceUrl,
            referenceYear: service.기준연도 || welfare.referenceYear,
            lastModifiedDate: service.최종수정일 || welfare.lastModifiedDate,
            targetAudience: service.지원대상 || welfare.targetAudience,
            applicationMethod: service.신청방법 || welfare.applicationMethod
          });
        }
        
        successCount++;
      } catch (error) {
        console.error('서비스 저장 오류:', error);
        errorCount++;
      }
    }
    
    res.json({
      message: '복지 서비스 데이터 동기화가 완료되었습니다.',
      stats: {
        total: serviceData.length,
        success: successCount,
        error: errorCount
      }
    });
  } catch (error) {
    console.error('복지 서비스 동기화 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/welfare/peer-statistics
 * @desc    동년배 통계 데이터 조회
 * @access  Public
 */
router.get('/peer-statistics', async (req, res) => {
  try {
    const { age, gender } = req.query;
    
    // 필수 파라미터 체크
    if (!age) {
      return res.status(400).json({ message: '나이 정보가 필요합니다.' });
    }
    
    // 연령대 계산 (10살 단위)
    const ageGroup = Math.floor(parseInt(age) / 10) * 10;
    
    try {
      // 동년배들이 많이 이용한 복지 서비스 조회
      const whereCondition = {
        '$user.user_birth$': {
          [Op.between]: [
            new Date(`${new Date().getFullYear() - (ageGroup + 9)}-01-01`),
            new Date(`${new Date().getFullYear() - ageGroup}-12-31`)
          ]
        }
      };

      if (gender) {
        whereCondition['$user.user_gender$'] = gender;
      }

      const popularServices = await WelfareFavorite.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: [],
            where: {
              userBirth: {
                [Op.between]: [
                  new Date(`${new Date().getFullYear() - (ageGroup + 9)}-01-01`),
                  new Date(`${new Date().getFullYear() - ageGroup}-12-31`)
                ]
              },
              ...(gender ? { userGender: gender } : {})
            }
          },
          {
            model: Welfare,
            as: 'welfare',
            where: { isActive: true }
          }
        ],
        attributes: [
          'serviceId',
          [Welfare.sequelize.fn('COUNT', '*'), 'usageCount']
        ],
        group: ['serviceId'],
        order: [[Welfare.sequelize.literal('usageCount'), 'DESC']],
        limit: 5,
        raw: true
      });
      
      res.json({
        ageGroup: `${ageGroup}대`,
        gender: gender || '전체',
        popularServices: popularServices
      });
    } catch (error) {
      console.error('동년배 통계 조회 쿼리 오류:', error);
      
      // 데이터베이스 오류 시 더미 데이터 제공 (개발용)
      res.json({
        ageGroup: `${ageGroup}대`,
        gender: gender || '전체',
        popularServices: [
          {
            service_id: 'WF0001',
            service_name: '노인 돌봄 서비스',
            service_summary: '독거노인 및 노인부부가구를 위한 돌봄 서비스를 제공합니다.',
            ministry_name: '보건복지부',
            target_audience: '65세 이상 노인',
            usage_count: 120
          },
          {
            service_id: 'WF0003',
            service_name: '기초연금',
            service_summary: '노인의 안정적인 생활을 위한 기초연금을 지급합니다.',
            ministry_name: '보건복지부',
            target_audience: '만 65세 이상, 소득인정액 기준 하위 70%',
            usage_count: 98
          }
        ]
      });
    }
  } catch (error) {
    console.error('동년배 통계 데이터 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;