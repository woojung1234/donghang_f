const express = require('express');
const { body, param, query } = require('express-validator');
const WelfareController = require('../controllers/WelfareController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * 복지 목록 전체 조회 (인증 불필요)
 */
router.get('/', WelfareController.readAll);

/**
 * 특정 복지 서비스 조회 (인증 불필요)
 */
router.get('/:welfareNo', [
  param('welfareNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 서비스 번호를 입력해주세요.')
], WelfareController.readOne);

// 아래 라우트들은 인증 필요
router.use(authMiddleware);

/**
 * 복지 서비스 생성 (관리자 기능)
 */
router.post('/', [
  body('welfareName')
    .notEmpty()
    .withMessage('복지 서비스 이름은 필수입니다.')
    .isLength({ max: 100 })
    .withMessage('복지 서비스 이름은 100자를 초과할 수 없습니다.'),
  body('welfarePrice')
    .isInt({ min: 0 })
    .withMessage('복지 서비스 가격은 0 이상의 숫자여야 합니다.'),
  body('welfareCategory')
    .notEmpty()
    .withMessage('복지 서비스 카테고리는 필수입니다.')
    .isLength({ max: 50 })
    .withMessage('복지 서비스 카테고리는 50자를 초과할 수 없습니다.')
], WelfareController.create);

/**
 * 복지 서비스 정보 수정 (관리자 기능)
 */
router.put('/', [
  body('welfareNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 서비스 번호를 입력해주세요.'),
  body('welfareName')
    .notEmpty()
    .withMessage('복지 서비스 이름은 필수입니다.')
    .isLength({ max: 100 })
    .withMessage('복지 서비스 이름은 100자를 초과할 수 없습니다.'),
  body('welfarePrice')
    .isInt({ min: 0 })
    .withMessage('복지 서비스 가격은 0 이상의 숫자여야 합니다.'),
  body('welfareCategory')
    .notEmpty()
    .withMessage('복지 서비스 카테고리는 필수입니다.')
    .isLength({ max: 50 })
    .withMessage('복지 서비스 카테고리는 50자를 초과할 수 없습니다.')
], WelfareController.update);

/**
 * 복지 서비스 삭제 (관리자 기능)
 */
router.delete('/:welfareNo', [
  param('welfareNo')
    .isInt({ min: 1 })
    .withMessage('올바른 복지 서비스 번호를 입력해주세요.')
], WelfareController.delete);

module.exports = router;
