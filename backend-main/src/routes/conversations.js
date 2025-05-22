const express = require('express');
const { body, param } = require('express-validator');
const ConversationController = require('../controllers/ConversationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * 대화 처리
 */
router.post('/', [
  body('input')
    .notEmpty()
    .withMessage('입력 메시지는 필수입니다.')
    .isLength({ max: 1000 })
    .withMessage('입력 메시지는 1000자를 초과할 수 없습니다.'),
  body('conversationRoomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.')
], ConversationController.conversation);

/**
 * 대화 테스트 처리
 */
router.post('/test', [
  body('input')
    .notEmpty()
    .withMessage('입력 메시지는 필수입니다.')
    .isLength({ max: 1000 })
    .withMessage('입력 메시지는 1000자를 초과할 수 없습니다.'),
  body('conversationRoomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.')
], ConversationController.conversationTest);

/**
 * 대화방 목록 조회
 */
router.get('/rooms', ConversationController.getConversationRooms);

/**
 * 새 대화방 생성
 */
router.post('/rooms', [
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('대화방 제목은 100자를 초과할 수 없습니다.')
], ConversationController.createConversationRoom);

/**
 * 대화방 내역 조회
 */
router.get('/rooms/:roomNo', [
  param('roomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.')
], ConversationController.getConversationHistory);

/**
 * 대화방 정보 수정
 */
router.put('/rooms/:roomNo', [
  param('roomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.'),
  body('title')
    .notEmpty()
    .withMessage('대화방 제목은 필수입니다.')
    .isLength({ max: 100 })
    .withMessage('대화방 제목은 100자를 초과할 수 없습니다.')
], ConversationController.updateConversationRoom);

/**
 * 대화방 삭제
 */
router.delete('/rooms/:roomNo', [
  param('roomNo')
    .isInt({ min: 1 })
    .withMessage('올바른 대화방 번호를 입력해주세요.')
], ConversationController.deleteConversationRoom);

module.exports = router;
