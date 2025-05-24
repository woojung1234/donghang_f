const express = require('express');
const axios = require('axios');
const router = express.Router();
const sequelize = require('../src/config/database');
const auth = require('../src/middleware/auth');

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
    
    let query = 'SELECT * FROM welfare_services WHERE is_active = 1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // 데이터베이스에서 복지 서비스 조회
    const [result] = await sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });
    
    // 총 개수 조회
    let countQuery = 'SELECT COUNT(*) as count FROM welfare_services WHERE is_active = 1';
    const countParams = [];
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    const [countResult] = await sequelize.query(countQuery, {
      replacements: countParams,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      data: result,
      pagination: {
        total: parseInt(countResult.count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.count) / limit)
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
    
    // 검색 쿼리 (SQLite용)
    const query = `
      SELECT * FROM welfare_services 
      WHERE is_active = 1 AND (
        service_name LIKE ? OR 
        service_summary LIKE ? OR 
        ministry_name LIKE ? OR 
        organization_name LIKE ? OR
        target_audience LIKE ?
      )
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count FROM welfare_services 
      WHERE is_active = 1 AND (
        service_name LIKE ? OR 
        service_summary LIKE ? OR 
        ministry_name LIKE ? OR 
        organization_name LIKE ? OR
        target_audience LIKE ?
      )
    `;
    
    const searchParam = `%${keyword}%`;
    const searchParams = [searchParam, searchParam, searchParam, searchParam, searchParam];
    
    // 데이터베이스에서 검색
    const result = await sequelize.query(query, {
      replacements: [...searchParams, parseInt(limit), parseInt(offset)],
      type: sequelize.QueryTypes.SELECT
    });
    
    const [countResult] = await sequelize.query(countQuery, {
      replacements: searchParams,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      data: result,
      pagination: {
        total: parseInt(countResult.count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.count) / limit)
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
    const [result] = await sequelize.query('SELECT * FROM welfare_services WHERE service_id = ?', {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!result) {
      return res.status(404).json({ message: '해당 복지 서비스를 찾을 수 없습니다.' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('복지 서비스 상세 조회 오류:', error);
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
    
    // 관리자 권한 체크
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    
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
    
    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      for (const service of serviceData) {
        try {
          // 서비스 아이디 확인
          const serviceId = service.서비스아이디 || `WF${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
          
          // 기존 서비스 확인
          const [existingService] = await sequelize.query(
            'SELECT * FROM welfare_services WHERE service_id = ?',
            {
              replacements: [serviceId],
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          if (existingService) {
            // 기존 서비스 업데이트
            await sequelize.query(`
              UPDATE welfare_services SET
                service_name = ?,
                service_summary = ?,
                ministry_name = ?,
                organization_name = ?,
                contact_info = ?,
                website = ?,
                service_url = ?,
                reference_year = ?,
                last_modified_date = ?,
                target_audience = ?,
                application_method = ?,
                updated_at = datetime('now')
              WHERE service_id = ?
            `, {
              replacements: [
                service.서비스명 || existingService.service_name,
                service.서비스요약 || existingService.service_summary,
                service.소관부처명 || existingService.ministry_name,
                service.소관조직명 || existingService.organization_name,
                service.대표문의 || existingService.contact_info,
                service.사이트 || existingService.website,
                service.서비스URL || existingService.service_url,
                service.기준연도 || existingService.reference_year,
                service.최종수정일 || existingService.last_modified_date,
                service.지원대상 || existingService.target_audience,
                service.신청방법 || existingService.application_method,
                serviceId
              ],
              transaction
            });
          } else {
            // 새 서비스 추가
            await sequelize.query(`
              INSERT INTO welfare_services (
                service_id, service_name, service_summary, ministry_name, organization_name,
                contact_info, website, service_url, reference_year, last_modified_date,
                target_audience, application_method, created_at, updated_at, is_active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)
            `, {
              replacements: [
                serviceId,
                service.서비스명 || '',
                service.서비스요약 || '',
                service.소관부처명 || '',
                service.소관조직명 || '',
                service.대표문의 || '',
                service.사이트 || '',
                service.서비스URL || '',
                service.기준연도 || null,
                service.최종수정일 || '',
                service.지원대상 || '',
                service.신청방법 || ''
              ],
              transaction
            });
          }
          
          successCount++;
        } catch (error) {
          console.error('서비스 저장 오류:', error);
          errorCount++;
        }
      }
      
      await transaction.commit();
      
      res.json({
        message: '복지 서비스 데이터 동기화가 완료되었습니다.',
        stats: {
          total: serviceData.length,
          success: successCount,
          error: errorCount
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
    
    // 성별 조건 설정
    const genderCondition = gender ? `AND gender = '${gender}'` : '';
    
    try {
      // 동년배들이 많이 이용한 복지 서비스 조회 (SQLite용)
      const query = `
        SELECT 
          ws.service_id,
          ws.service_name,
          ws.service_summary,
          ws.ministry_name,
          ws.target_audience,
          COUNT(*) as usage_count
        FROM welfare_favorites wf
        JOIN welfare_services ws ON wf.service_id = ws.service_id
        JOIN users u ON wf.user_id = u.id
        WHERE 
          u.age BETWEEN ? AND ?
          ${genderCondition}
        GROUP BY 
          ws.service_id, ws.service_name, ws.service_summary, 
          ws.ministry_name, ws.target_audience
        ORDER BY usage_count DESC
        LIMIT 5
      `;
      
      const result = await sequelize.query(query, {
        replacements: [ageGroup, ageGroup + 9],
        type: sequelize.QueryTypes.SELECT
      });
      
      res.json({
        ageGroup: `${ageGroup}대`,
        gender: gender || '전체',
        popularServices: result
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