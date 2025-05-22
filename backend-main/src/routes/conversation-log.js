const express = require('express');
const { body, param } = require('express-validator');
const ConversationLogController = require('../controllers/ConversationLogController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * 대화 내역 생성
 */
router.post('/', [
  body('conversationRoomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.'),
  body('message')
    .notEmpty()
    .withMessage('메시지는 필수입니다.')
    .isLength({ max: 1000 })
    .withMessage('메시지는 1000자를 초과할 수 없습니다.'),
  body('sender')
    .isIn(['USER', 'BOT'])
    .withMessage('발신자는 USER 또는 BOT이어야 합니다.')
], ConversationLogController.createConversationLog);

/**
 * 모든 대화 내역 조회
 */
router.get('/', ConversationLogController.getAllConversationLogs);

/**
 * 대화 내역 수정
 */
router.put('/:conversationLogNo', [
  param('conversationLogNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화 로그 번호를 입력해주세요.'),
  body('message')
    .notEmpty()
    .withMessage('메시지는 필수입니다.')
    .isLength({ max: 1000 })
    .withMessage('메시지는 1000자를 초과할 수 없습니다.')
], ConversationLogController.updateConversationLog);

/**
 * 대화 내역 삭제
 */
router.delete('/:conversationLogNo', [
  param('conversationLogNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화 로그 번호를 입력해주세요.')
], ConversationLogController.deleteConversationLog);

module.exports = router;
