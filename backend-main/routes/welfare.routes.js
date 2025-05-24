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
    
    // 데이터가 없으면 샘플 데이터로 응답
    if (count === 0) {
      const sampleData = [
        {
          welfareNo: 1,
          serviceId: 'WF001',
          serviceName: '기초연금',
          serviceSummary: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '국민연금공단',
          contactInfo: '국민연금공단 콜센터 1355',
          website: 'https://www.nps.or.kr',
          targetAudience: '만 65세 이상, 소득인정액 기준 하위 70%',
          applicationMethod: '온라인 신청, 방문신청, 우편신청',
          category: '노인',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          welfareNo: 2,
          serviceId: 'WF002',
          serviceName: '노인돌봄종합서비스',
          serviceSummary: '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '65세 이상 노인 중 장기요양등급외자',
          applicationMethod: '읍면동 주민센터 방문신청',
          category: '노인',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          welfareNo: 3,
          serviceId: 'WF003',
          serviceName: '아동수당',
          serviceSummary: '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '0~95개월(만 8세 미만) 아동',
          applicationMethod: '온라인 신청, 방문신청',
          category: '아동',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return res.json({
        data: sampleData,
        pagination: {
          total: sampleData.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 1
        },
        message: '샘플 데이터입니다. 실제 데이터를 가져오려면 /api/welfare/sync를 호출하세요.'
      });
    }
    
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
 * @desc    공공 데이터 포털에서 복지 서비스 데이터 동기화
 * @access  Public (테스트용)
 */
router.post('/sync', async (req, res) => {
  try {
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      return res.status(400).json({ 
        message: 'API 키가 설정되지 않았습니다. .env 파일에서 PUBLIC_DATA_API_KEY를 설정해주세요.' 
      });
    }
    
    console.log('🔄 공공데이터 API 호출 시작...');
    
    // 공공 데이터 포털 API 호출
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: 1,
        perPage: 50, // 첫 테스트로 50개
        returnType: 'JSON'
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📡 API 응답 받음:', response.status);
    
    if (!response.data || !response.data.data) {
      console.error('❌ API 응답 데이터 없음:', response.data);
      return res.status(500).json({ 
        message: '공공 데이터 포털에서 데이터를 가져오는데 실패했습니다.',
        details: response.data
      });
    }
    
    const serviceData = response.data.data;
    console.log(`📊 받은 데이터 개수: ${serviceData.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const service of serviceData.slice(0, 20)) { // 처음 20개만 처리
      try {
        // 서비스 아이디 생성
        const serviceId = service.서비스아이디 || `WF${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        console.log(`🔄 처리 중: ${service.서비스명}`);
        
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
            category: service.서비스분야 || '기타',
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
            applicationMethod: service.신청방법 || welfare.applicationMethod,
            category: service.서비스분야 || welfare.category
          });
        }
        
        successCount++;
        console.log(`✅ 성공: ${service.서비스명}`);
      } catch (error) {
        console.error(`❌ 서비스 저장 오류 [${service.서비스명}]:`, error.message);
        errorCount++;
      }
    }
    
    res.json({
      message: '복지 서비스 데이터 동기화가 완료되었습니다.',
      stats: {
        total: serviceData.length,
        processed: Math.min(20, serviceData.length),
        success: successCount,
        error: errorCount
      },
      apiResponse: {
        totalCount: response.data.totalCount,
        currentCount: response.data.currentCount
      }
    });
  } catch (error) {
    console.error('❌ 복지 서비스 동기화 오류:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ message: 'API 호출 시간 초과가 발생했습니다.' });
    }
    
    if (error.response) {
      console.error('API 오류 응답:', error.response.status, error.response.data);
      return res.status(500).json({ 
        message: 'API 호출 중 오류가 발생했습니다.',
        status: error.response.status,
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
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
    
    // 더미 데이터 제공 (실제 통계 데이터가 충분하지 않을 수 있음)
    res.json({
      ageGroup: `${ageGroup}대`,
      gender: gender || '전체',
      popularServices: [
        {
          service_id: 'WF001',
          service_name: '기초연금',
          service_summary: '만 65세 이상 어르신을 위한 기초연금 지급',
          ministry_name: '보건복지부',
          target_audience: '만 65세 이상, 소득인정액 기준 하위 70%',
          usage_count: 120
        },
        {
          service_id: 'WF002',
          service_name: '노인돌봄종합서비스',
          service_summary: '돌봄이 필요한 노인을 위한 종합 서비스',
          ministry_name: '보건복지부',
          target_audience: '65세 이상 노인 중 장기요양등급외자',
          usage_count: 98
        }
      ]
    });
  } catch (error) {
    console.error('동년배 통계 데이터 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;