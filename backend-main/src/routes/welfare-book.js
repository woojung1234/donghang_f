const express = require('express');
const { body, param } = require('express-validator');
const WelfareBookController = require('../controllers/WelfareBookController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * 복지 예약 전체 조회
 */
router.get('/', WelfareBookController.readAllByUserNo);

/**
 * 복지 예약 상세 조회
 */
router.get('/:welfareBookNo', [
  param('welfareBookNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 예약 번호를 입력해주세요.')
], WelfareBookController.readDetail);

/**
 * 복지 예약 하기
 */
router.post('/reserve', [
  body('welfareNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 서비스 번호를 입력해주세요.'),
  body('welfareBookStartDate')
    .isISO8601()
    .withMessage('올바른 시작일을 입력해주세요. (YYYY-MM-DD 형식)'),
  body('welfareBookEndDate')
    .isISO8601()
    .withMessage('올바른 종료일을 입력해주세요. (YYYY-MM-DD 형식)'),
  body('welfareBookUseTime')
    .isInt({ min: 1, max: 24 })
    .withMessage('사용 시간은 1시간 이상 24시간 이하여야 합니다.'),
  body('welfareBookReservationDate')
    .optional()
    .isISO8601()
    .withMessage('올바른 예약 일시를 입력해주세요.')
], WelfareBookController.createWelfareBooking);

/**
 * 복지 예약 취소
 */
router.delete('/:welfareBookNo', [
  param('welfareBookNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 예약 번호를 입력해주세요.')
], WelfareBookController.delete);

module.exports = router;
