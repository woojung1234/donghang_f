const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

/**
 * @swagger
 * /api/v1/auth/login/normal:
 *   post:
 *     summary: 아이디/패스워드 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 아이디
 *               userPassword:
 *                 type: string
 *                 description: 사용자 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 로그인 실패
 */
router.post('/login/normal', [
  body('userId').notEmpty().withMessage('아이디는 필수입니다.'),
  body('userPassword').notEmpty().withMessage('비밀번호는 필수입니다.')
], AuthController.idLogin);

/**
 * @swagger
 * /api/v1/auth/login/simple:
 *   post:
 *     summary: 간편 비밀번호 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - simplePassword
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 아이디
 *               simplePassword:
 *                 type: string
 *                 description: 간편 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 로그인 실패
 */
router.post('/login/simple', [
  body('userId').notEmpty().withMessage('아이디는 필수입니다.'),
  body('simplePassword').notEmpty().withMessage('간편 비밀번호는 필수입니다.')
], AuthController.simpleLogin);

/**
 * @swagger
 * /api/v1/auth/login/bio:
 *   post:
 *     summary: 생체 인증 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - biometricData
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 아이디
 *               biometricData:
 *                 type: string
 *                 description: 생체 인증 데이터
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 로그인 실패
 */
router.post('/login/bio', [
  body('userId').notEmpty().withMessage('아이디는 필수입니다.'),
  body('biometricData').notEmpty().withMessage('생체 인증 데이터는 필수입니다.')
], AuthController.bioLogin);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
