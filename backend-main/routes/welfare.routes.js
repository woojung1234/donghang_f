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
 * @desc    복지 서비스 목록 조회 - 공공데이터에서 실시간 가져오기
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    console.log('🔄 복지 서비스 API 호출 시작...');
    console.log('API 키 상태:', PUBLIC_DATA_API_KEY ? '설정됨' : '설정되지 않음');
    
    // API 키가 없는 경우 샘플 데이터 제공
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      console.log('⚠️ API 키가 설정되지 않아 샘플 데이터를 제공합니다.');
      
      const sampleData = [
        {
          serviceId: 'WF001',
          serviceName: '기초연금',
          serviceSummary: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '국민연금공단',
          contactInfo: '국민연금공단 콜센터 1355',
          website: 'https://www.nps.or.kr',
          targetAudience: '만 65세 이상, 소득인정액 기준 하위 70%',
          applicationMethod: '온라인 신청, 방문신청, 우편신청',
          category: '노인'
        },
        {
          serviceId: 'WF002',
          serviceName: '노인돌봄종합서비스',
          serviceSummary: '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '65세 이상 노인 중 장기요양등급외자',
          applicationMethod: '읍면동 주민센터 방문신청',
          category: '노인'
        },
        {
          serviceId: 'WF003',
          serviceName: '아동수당',
          serviceSummary: '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '0~95개월(만 8세 미만) 아동',
          applicationMethod: '온라인 신청, 방문신청',
          category: '아동'
        },
        {
          serviceId: 'WF004',
          serviceName: '장애인연금',
          serviceSummary: '중증장애인의 근로능력 상실 또는 현저한 감소로 인한 소득보전과 추가비용 보전을 위해 매월 일정액의 연금을 지급합니다.',
          ministryName: '보건복지부',
          organizationName: '국민연금공단',
          contactInfo: '국민연금공단 1355',
          targetAudience: '18세 이상 중증장애인',
          applicationMethod: '국민연금공단 또는 주민센터 신청',
          category: '장애인'
        },
        {
          serviceId: 'WF005',
          serviceName: '의료급여',
          serviceSummary: '생활이 어려운 저소득층의 의료문제를 국가가 보장하는 공공부조 의료보장제도입니다.',
          ministryName: '보건복지부',
          organizationName: '시군구청',
          contactInfo: '보건복지콜센터 129',
          targetAudience: '의료급여 수급권자',
          applicationMethod: '거주지 시군구청 또는 읍면동 주민센터 신청',
          category: '의료'
        }
      ];
      
      // 카테고리 필터링
      let filteredData = sampleData;
      if (category) {
        filteredData = sampleData.filter(service => 
          service.category && service.category.includes(category)
        );
      }
      
      // 페이지네이션 적용
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      return res.json({
        data: paginatedData,
        pagination: {
          total: filteredData.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredData.length / parseInt(limit))
        },
        message: '샘플 데이터입니다. 실제 공공데이터 API를 사용하려면 .env 파일에 PUBLIC_DATA_API_KEY를 설정하세요.'
      });
    }
    
    // API 키가 있는 경우 실제 공공데이터 호출
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: parseInt(page),
        perPage: parseInt(limit),
        returnType: 'JSON'
      },
      timeout: 10000,
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
    
    // 카테고리 필터링 (필요시)
    let filteredData = serviceData;
    if (category) {
      filteredData = serviceData.filter(service => 
        service.서비스분야 && service.서비스분야.includes(category)
      );
    }
    
    // 응답 데이터 변환
    const transformedData = filteredData.map(service => ({
      serviceId: service.서비스아이디 || `WF${Date.now()}_${Math.random()}`,
      serviceName: service.서비스명 || '',
      serviceSummary: service.서비스요약 || '',
      ministryName: service.소관부처명 || '',
      organizationName: service.소관조직명 || '',
      contactInfo: service.대표문의 || '',
      website: service.사이트 || '',
      serviceUrl: service.서비스URL || '',
      referenceYear: service.기준연도 || '',
      lastModifiedDate: service.최종수정일 || '',
      targetAudience: service.지원대상 || '',
      applicationMethod: service.신청방법 || '',
      category: service.서비스분야 || '기타'
    }));
    
    res.json({
      data: transformedData,
      pagination: {
        total: response.data.totalCount || serviceData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((response.data.totalCount || serviceData.length) / parseInt(limit))
      },
      apiInfo: {
        totalCount: response.data.totalCount,
        currentCount: response.data.currentCount,
        matchCount: response.data.matchCount
      }
    });
    
  } catch (error) {
    console.error('❌ 복지 서비스 API 호출 오류:', error.message);
    
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
 * @route   GET /api/welfare/search
 * @desc    복지 서비스 검색 - 공공데이터에서 검색
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }
    
    console.log(`🔍 검색어: ${keyword}로 복지 서비스 검색 시작...`);
    
    // 샘플 데이터에서 검색 (API 키가 없는 경우)
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      const sampleData = [
        {
          serviceId: 'WF001',
          serviceName: '기초연금',
          serviceSummary: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '국민연금공단',
          contactInfo: '국민연금공단 콜센터 1355',
          targetAudience: '만 65세 이상, 소득인정액 기준 하위 70%',
          applicationMethod: '온라인 신청, 방문신청, 우편신청',
          category: '노인'
        }
      ];
      
      // 검색어로 필터링
      const filteredData = sampleData.filter(service => {
        const searchText = `${service.serviceName} ${service.serviceSummary} ${service.ministryName} ${service.targetAudience}`.toLowerCase();
        return searchText.includes(keyword.toLowerCase());
      });
      
      return res.json({
        data: filteredData,
        pagination: {
          total: filteredData.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredData.length / parseInt(limit))
        },
        searchInfo: {
          keyword,
          totalResults: filteredData.length
        },
        message: '샘플 데이터에서 검색했습니다.'
      });
    }
    
    // 실제 API 검색 로직...
    // (위의 기존 코드와 동일)
    
  } catch (error) {
    console.error('❌ 복지 서비스 검색 오류:', error.message);
    res.status(500).json({ 
      message: '검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/welfare/test-connection
 * @desc    공공데이터 API 연결 테스트
 * @access  Public
 */
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 공공데이터 API 연결 테스트 시작...');
    console.log('API 키:', PUBLIC_DATA_API_KEY ? '설정됨' : '설정되지 않음');
    
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      return res.json({ 
        message: 'API 키가 설정되지 않았습니다. 샘플 데이터를 제공하고 있습니다.',
        status: 'sample_mode',
        apiKey: '설정되지 않음'
      });
    }
    
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: 1,
        perPage: 5,
        returnType: 'JSON'
      },
      timeout: 10000
    });
    
    console.log('✅ API 연결 테스트 성공!');
    
    res.json({
      message: '공공데이터 API 연결 성공!',
      status: response.status,
      totalCount: response.data.totalCount,
      currentCount: response.data.currentCount,
      sampleData: response.data.data ? response.data.data.slice(0, 2) : []
    });
    
  } catch (error) {
    console.error('❌ API 연결 테스트 실패:', error.message);
    
    res.status(500).json({
      message: 'API 연결 테스트 실패',
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
});

module.exports = router;