// backend-main/src/routes/welfare.js 업데이트
const express = require('express');
const router = express.Router();
const WelfareController = require('../controllers/WelfareController');
const WelfareSyncController = require('../controllers/WelfareSyncController');
const authMiddleware = require('../middleware/auth');

// 공개 라우트 (인증 불필요)
/**
 * @route GET /api/welfare
 * @description 복지서비스 목록 조회 (페이징, 카테고리 필터링 지원)
 * @query {string} category - 카테고리 필터
 * @query {number} page - 페이지 번호 (기본값: 1)  
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @access Public
 */
router.get('/', WelfareSyncController.getWelfareServices);

/**
 * @route GET /api/welfare/stats
 * @description 복지서비스 통계 정보 조회
 * @access Public
 */
router.get('/stats', WelfareSyncController.getWelfareStats);

/**
 * @route GET /api/welfare/api-status
 * @description 공공 API 연결 상태 확인
 * @access Public
 */
router.get('/api-status', WelfareSyncController.checkApiStatus);

/**
 * @route GET /api/welfare/:id
 * @description 특정 복지서비스 상세 정보 조회
 * @param {number} id - 복지서비스 ID
 * @access Public
 */
router.get('/:id', WelfareSyncController.getWelfareServiceDetail);

// 관리자 전용 라우트 (인증 필요)
/**
 * @route POST /api/welfare/sync
 * @description 공공 API에서 복지서비스 데이터 동기화
 * @access Private (Admin)
 */
router.post('/sync', authMiddleware, WelfareSyncController.syncWelfareServices);

/**
 * @route POST /api/welfare/sample-data
 * @description 샘플 복지서비스 데이터 생성
 * @access Private (Admin)
 */
router.post('/sample-data', authMiddleware, WelfareSyncController.createSampleData);

// 기존 CRUD 라우트 (관리자 전용)
/**
 * @route POST /api/welfare
 * @description 새 복지서비스 생성
 * @access Private (Admin)
 */
router.post('/', authMiddleware, WelfareController.createWelfare);

/**
 * @route PUT /api/welfare/:id
 * @description 복지서비스 정보 수정
 * @param {number} id - 복지서비스 ID
 * @access Private (Admin)
 */
router.put('/:id', authMiddleware, WelfareController.updateWelfare);

/**
 * @route DELETE /api/welfare/:id
 * @description 복지서비스 삭제
 * @param {number} id - 복지서비스 ID
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, WelfareController.deleteWelfare);

module.exports = router;