const express = require('express');
const router = express.Router();
const AIChatController = require('../controllers/aiChatController');
const authMiddleware = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route POST /api/v1/ai-chat/message
 * @description AI 채팅 메시지 처리
 * @access Private
 */
router.post('/message', AIChatController.processMessage);

/**
 * @route POST /api/v1/ai-chat/reset-session
 * @description 채팅 세션 초기화
 * @access Private
 */
router.post('/reset-session', AIChatController.resetSession);

/**
 * @route GET /api/v1/ai-chat/session/:sessionId
 * @description 채팅 세션 상태 조회
 * @access Private
 */
router.get('/session/:sessionId?', AIChatController.getSessionStatus);

module.exports = router;
