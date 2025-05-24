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
    
    console.log('🔄 공공데이터 API 호출 시작...');
    
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      return res.status(400).json({ 
        message: 'API 키가 설정되지 않았습니다. .env 파일에서 PUBLIC_DATA_API_KEY를 설정해주세요.' 
      });
    }
    
    // 공공 데이터 포털 API 호출
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
    console.log('📊 API 응답 데이터:', response.data);
    
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
    
    console.log(`🔍 검색어: ${keyword}로 공공데이터 검색 시작...`);
    
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      return res.status(400).json({ 
        message: 'API 키가 설정되지 않았습니다.' 
      });
    }
    
    // 공공 데이터 포털 API 호출
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: parseInt(page),
        perPage: 100, // 검색을 위해 더 많이 가져옴
        returnType: 'JSON'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.data || !response.data.data) {
      return res.status(500).json({ 
        message: '공공 데이터 포털에서 데이터를 가져오는데 실패했습니다.' 
      });
    }
    
    // 검색어로 필터링
    const filteredData = response.data.data.filter(service => {
      const searchText = `${service.서비스명} ${service.서비스요약} ${service.소관부처명} ${service.지원대상}`.toLowerCase();
      return searchText.includes(keyword.toLowerCase());
    });
    
    // 페이지네이션 적용
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    // 응답 데이터 변환
    const transformedData = paginatedData.map(service => ({
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
        total: filteredData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredData.length / parseInt(limit))
      },
      searchInfo: {
        keyword,
        totalResults: filteredData.length
      }
    });
    
  } catch (error) {
    console.error('❌ 복지 서비스 검색 오류:', error.message);
    res.status(500).json({ 
      message: '검색 중 오류가 발생했습니다.',
      error: error.message
    });
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
    
    console.log(`🔍 서비스 ID: ${id} 상세 조회 시작...`);
    
    if (!PUBLIC_DATA_API_KEY || PUBLIC_DATA_API_KEY === 'your_public_data_api_key_here') {
      return res.status(400).json({ 
        message: 'API 키가 설정되지 않았습니다.' 
      });
    }
    
    // 전체 데이터에서 해당 서비스 찾기
    const apiUrl = 'https://api.odcloud.kr/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d';
    
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        page: 1,
        perPage: 1000,
        returnType: 'JSON'
      },
      timeout: 10000
    });
    
    if (!response.data || !response.data.data) {
      return res.status(500).json({ 
        message: '공공 데이터를 가져올 수 없습니다.' 
      });
    }
    
    // 해당 서비스 찾기
    const service = response.data.data.find(item => 
      item.서비스아이디 === id || `WF${Date.now()}_${Math.random()}` === id
    );
    
    if (!service) {
      return res.status(404).json({ message: '해당 복지 서비스를 찾을 수 없습니다.' });
    }
    
    // 상세 정보 반환
    const detailData = {
      serviceId: service.서비스아이디 || id,
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
      category: service.서비스분야 || '기타',
      // 추가 상세 정보
      applicationPeriod: service.신청기간 || '',
      selectionCriteria: service.선정기준 || '',
      supportContent: service.지원내용 || '',
      processingInstitution: service.처리기관명 || ''
    };
    
    res.json(detailData);
    
  } catch (error) {
    console.error('❌ 복지 서비스 상세 조회 오류:', error.message);
    res.status(500).json({ 
      message: '상세 조회 중 오류가 발생했습니다.',
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
      return res.status(400).json({ 
        message: 'API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.',
        apiKey: PUBLIC_DATA_API_KEY
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