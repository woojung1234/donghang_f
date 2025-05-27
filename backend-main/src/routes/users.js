const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 회원 관리 API
 */

/**
 * @swagger
 * /api/v1/users/validation/{userId}:
 *   get:
 *     summary: 아이디 중복 확인
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 사용자 아이디
 *     responses:
 *       200:
 *         description: 아이디 중복 확인 결과
 */
router.get('/validation/:userId', UserController.duplicateCheckUserId);

/**
 * @swagger
 * /api/v1/users/validation/phone:
 *   post:
 *     summary: SMS 인증번호 전송
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *     responses:
 *       200:
 *         description: SMS 전송 결과
 */
router.post('/validation/phone', [
  body('phone').isMobilePhone('ko-KR').withMessage('올바른 전화번호를 입력해주세요.')
], UserController.sendSms);

/**
 * @swagger
 * /api/v1/users/validation/number:
 *   post:
 *     summary: SMS 인증번호 검증
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - validationNum
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *               validationNum:
 *                 type: string
 *                 description: 인증번호
 *     responses:
 *       200:
 *         description: 인증 결과
 */
router.post('/validation/number', [
  body('phone').isMobilePhone('ko-KR').withMessage('올바른 전화번호를 입력해주세요.'),
  body('validationNum').isLength({ min: 6, max: 6 }).withMessage('인증번호는 6자리입니다.')
], UserController.validationSms);

/**
 * @swagger
 * /api/v1/users/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userPassword
 *               - userName
 *               - userPhone
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 아이디
 *               userPassword:
 *                 type: string
 *                 description: 비밀번호
 *               userName:
 *                 type: string
 *                 description: 사용자 이름
 *               userPhone:
 *                 type: string
 *                 description: 전화번호
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *       409:
 *         description: 중복된 정보
 */
router.post('/signup', [
  body('userId').isLength({ min: 4, max: 20 }).withMessage('아이디는 4-20자 사이여야 합니다.'),
  body('userPassword').isLength({ min: 8 }).withMessage('비밀번호는 최소 8자 이상이어야 합니다.'),
  body('userName').notEmpty().withMessage('이름은 필수입니다.'),
  body('userPhone').isMobilePhone('ko-KR').withMessage('올바른 전화번호를 입력해주세요.'),
  body('userBirth').isDate().withMessage('올바른 생년월일을 입력해주세요.'),
  body('userGender').isIn(['남성', '여성']).withMessage('성별을 선택해주세요.')
], UserController.createUser);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 회원 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원 정보 조회 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get('/', authMiddleware, UserController.readUser);

/**
 * @swagger
 * /api/v1/users:
 *   put:
 *     summary: 회원 정보 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               userAddress:
 *                 type: string
 *               userHeight:
 *                 type: integer
 *               userWeight:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 정보 수정 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.put('/', authMiddleware, UserController.updateUser);

/**
 * @swagger
 * /api/v1/users/withdraw:
 *   put:
 *     summary: 회원 탈퇴
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 탈퇴 완료
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.put('/withdraw', authMiddleware, UserController.deleteUser);

/**
 * @swagger
 * /api/v1/users/payment:
 *   get:
 *     summary: 간편 결제 비밀번호 등록 여부 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get('/payment', authMiddleware, UserController.readPaymentPassword);

/**
 * @swagger
 * /api/v1/users/payment:
 *   put:
 *     summary: 간편 결제 비밀번호 등록
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - simplePassword
 *             properties:
 *               simplePassword:
 *                 type: string
 *                 description: 간편 비밀번호
 *     responses:
 *       200:
 *         description: 등록 성공
 */
router.put('/payment', authMiddleware, [
  body('simplePassword').isLength({ min: 4, max: 6 }).withMessage('간편 비밀번호는 4-6자리여야 합니다.')
], UserController.createPaymentPassword);

/**
 * @swagger
 * /api/v1/users/payment:
 *   post:
 *     summary: 간편 결제 비밀번호 검증
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - simplePassword
 *             properties:
 *               simplePassword:
 *                 type: string
 *                 description: 간편 비밀번호
 *     responses:
 *       200:
 *         description: 검증 결과
 */
router.post('/payment', authMiddleware, [
  body('simplePassword').notEmpty().withMessage('간편 비밀번호는 필수입니다.')
], UserController.validatePaymentPassword);

module.exports = router;
