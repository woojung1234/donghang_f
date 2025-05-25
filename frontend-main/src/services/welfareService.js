import axios from 'axios';

// 백엔드 서버 URL (포트 9090)
const API_BASE_URL = 'http://localhost:9090';

// 복지 서비스 목록 조회 (백엔드 서버에서 공공데이터 가져오기)
export const getWelfareServices = async (category = '', page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/welfare`, {
      params: { 
        category, 
        page, 
        limit 
      }
    });
    return response.data;
  } catch (error) {
    console.error('복지 서비스 목록 조회 오류:', error);
    throw error;
  }
};

// 공공 데이터 포털에서 복지 서비스 목록 조회 (백엔드를 통해)
export const getPublicWelfareServices = async (page = 1, perPage = 10) => {
  try {
    console.log(`API 호출: ${API_BASE_URL}/api/welfare?page=${page}&limit=${perPage}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/welfare`, {
      params: {
        page,
        limit: perPage
      }
    });
    
    console.log('API 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('공공 복지 서비스 목록 조회 오류:', error);
    throw error;
  }
};

// 복지 서비스 검색
export const searchWelfareServices = async (keyword, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/welfare/search`, {
      params: { 
        keyword, 
        page, 
        limit 
      }
    });
    return response.data;
  } catch (error) {
    console.error('복지 서비스 검색 오류:', error);
    throw error;
  }
};

// 복지 서비스 상세 조회
export const getWelfareServiceById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/welfare/${id}`);
    return response.data;
  } catch (error) {
    console.error('복지 서비스 상세 조회 오류:', error);
    throw error;
  }
};

// 복지 서비스 동기화 (관리자 전용)
export const syncWelfareServices = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/welfare/sync`);
    return response.data;
  } catch (error) {
    console.error('복지 서비스 동기화 오류:', error);
    throw error;
  }
};

// 동년배 통계 데이터 조회
export const getPeerStatistics = async (age, gender) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/welfare/peer-statistics`, {
      params: { age, gender }
    });
    return response.data;
  } catch (error) {
    console.error('동년배 통계 데이터 조회 오류:', error);
    throw error;
  }
};

// API 연결 테스트
export const testWelfareConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/welfare/test-connection`);
    return response.data;
  } catch (error) {
    console.error('API 연결 테스트 오류:', error);
    throw error;
  }
};

export default {
  getWelfareServices,
  getPublicWelfareServices,
  searchWelfareServices,
  getWelfareServiceById,
  syncWelfareServices,
  getPeerStatistics,
  testWelfareConnection
};