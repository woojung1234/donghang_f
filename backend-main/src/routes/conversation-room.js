const express = require('express');
const { body, param } = require('express-validator');
const ConversationRoomController = require('../controllers/ConversationRoomController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * 대화방 생성
 */
router.post('/', ConversationRoomController.createConversationRoom);

/**
 * 모든 대화방 조회 (관리자용)
 */
router.get('/', ConversationRoomController.readAll);

/**
 * 마지막 대화 시간 조회
 */
router.get('/last-conversation-time', ConversationRoomController.readLastConversationTime);

/**
 * 대화방 수정
 */
router.put('/:conversationRoomNo', [
  param('conversationRoomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.'),
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('대화방 제목은 100자를 초과할 수 없습니다.')
], ConversationRoomController.updateConversationRoom);

/**
 * 대화방 삭제
 */
router.delete('/:conversationRoomNo', [
  param('conversationRoomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.')
], ConversationRoomController.deleteConversationRoom);

module.exports = router;
