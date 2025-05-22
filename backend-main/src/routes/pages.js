const express = require('express');
const PageController = require('../controllers/PageController');

const router = express.Router();

/**
 * 대화 페이지 리디렉션
 */
router.get('/conversation', PageController.conversationPage);

/**
 * STT 페이지 리디렉션
 */
router.get('/stt', PageController.sttPage);

/**
 * 로그인 페이지 리디렉션
 */
router.get('/login', PageController.loginPage);

/**
 * 알림 페이지 리디렉션
 */
router.get('/notification', PageController.notificationPage);

module.exports = router;
