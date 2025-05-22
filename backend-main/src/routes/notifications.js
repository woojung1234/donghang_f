const express = require('express');
const { body } = require('express-validator');
const NotificationController = require('../controllers/NotificationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 알림 관리 API
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: notificationType
 *         schema:
 *           type: string
 *           enum: [SYSTEM, PAYMENT, WELFARE, ANOMALY]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
 */
router.get('/', authMiddleware, NotificationController.getNotifications);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   get:
 *     summary: 알림 상세 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 알림 상세 조회 성공
 */
router.get('/:notificationId', authMiddleware, NotificationController.getNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   put:
 *     summary: 알림 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
 */
router.put('/:notificationId/read', authMiddleware, NotificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: 모든 알림 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 알림 읽음 처리 성공
 */
router.put('/read-all', authMiddleware, NotificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: 알림 삭제
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 알림 삭제 성공
 */
router.delete('/:notificationId', authMiddleware, NotificationController.deleteNotification);

/**
 * @swagger
 * /api/v1/notifications/read/delete:
 *   delete:
 *     summary: 읽은 알림 모두 삭제
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽은 알림 모두 삭제 성공
 */
router.delete('/read/delete', authMiddleware, NotificationController.deleteReadNotifications);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: 알림 통계 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 통계 조회 성공
 */
router.get('/stats', authMiddleware, NotificationController.getNotificationStats);

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   get:
 *     summary: 알림 설정 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 설정 조회 성공
 */
router.get('/settings', authMiddleware, NotificationController.getNotificationSettings);

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   put:
 *     summary: 알림 설정 수정
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systemNotifications:
 *                 type: boolean
 *               paymentNotifications:
 *                 type: boolean
 *               welfareNotifications:
 *                 type: boolean
 *               anomalyNotifications:
 *                 type: boolean
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 알림 설정 수정 성공
 */
router.put('/settings', authMiddleware, NotificationController.updateNotificationSettings);

module.exports = router;
