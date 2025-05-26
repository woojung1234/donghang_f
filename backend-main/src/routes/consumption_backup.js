const express = require('express');
const { body } = require('express-validator');
const ConsumptionController = require('../controllers/ConsumptionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consumption
 *   description: 소비 관리 API
 */

// 소비 내역 조회
router.get('/', authMiddleware, ConsumptionController.getConsumptions);

// 소비 내역 상세 조회
router.get('/:consumptionId', authMiddleware, ConsumptionController.getConsumption);

// 소비 내역 생성
router.post('/', authMiddleware, [
  body('merchantName').notEmpty().withMessage('가맹점명은 필수입니다.'),
  body('amount').isNumeric().withMessage('금액은 숫자여야 합니다.'),
  body('paymentMethod').notEmpty().withMessage('결제수단은 필수입니다.'),
  body('transactionDate').isISO8601().withMessage('올바른 날짜 형식이 아닙니다.')
], ConsumptionController.createConsumption);

// 음성 입력으로 소비 내역 생성 (간소화된 검증)
router.post('/voice', authMiddleware, [
  body('merchantName').optional(),
  body('amount').isNumeric().withMessage('금액은 숫자여야 합니다.'),
  body('category').optional(),
  body('memo').optional()
], ConsumptionController.createVoiceConsumption);

// 소비 리포트 조회
router.get('/report', authMiddleware, ConsumptionController.getReport);

// 소비 패턴 분석
router.get('/analysis', authMiddleware, ConsumptionController.getAnalysis);

// 월별/일별 소비 통계 (노인분들을 위한 큰 그래프용)
router.get('/stats/:period', authMiddleware, ConsumptionController.getConsumptionStats);

module.exports = router;