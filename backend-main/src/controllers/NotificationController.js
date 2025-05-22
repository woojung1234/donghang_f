const { Notification, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class NotificationController {
  // 알림 목록 조회
  static async getNotifications(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { 
        page = 1, 
        limit = 20, 
        isRead, 
        notificationType, 
        priority 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = { userNo: userNo };

      if (isRead !== undefined) {
        whereConditions.isRead = isRead === 'true';
      }

      if (notificationType) {
        whereConditions.notificationType = notificationType;
      }

      if (priority) {
        whereConditions.priority = priority;
      }

      const notifications = await Notification.findAndCountAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // 읽지 않은 알림 수
      const unreadCount = await Notification.count({
        where: { 
          userNo: userNo,
          isRead: false 
        }
      });

      res.status(200).json({
        message: '알림 목록 조회 성공',
        notifications: notifications.rows,
        unreadCount: unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          totalCount: notifications.count,
          hasNext: offset + parseInt(limit) < notifications.count
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // 알림 상세 조회
  static async getNotification(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: {
          notificationNo: notificationId,
          userNo: userNo
        }
      });

      if (!notification) {
        return res.status(404).json({
          message: '알림을 찾을 수 없습니다.'
        });
      }

      // 알림 조회시 자동으로 읽음 처리
      if (!notification.isRead) {
        await notification.update({
          isRead: true,
          readAt: new Date()
        });
      }

      res.status(200).json({
        message: '알림 상세 조회 성공',
        notification: notification
      });

    } catch (error) {
      next(error);
    }
  }

  // 알림 읽음 처리
  static async markAsRead(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: {
          notificationNo: notificationId,
          userNo: userNo
        }
      });

      if (!notification) {
        return res.status(404).json({
          message: '알림을 찾을 수 없습니다.'
        });
      }

      if (notification.isRead) {
        return res.status(400).json({
          message: '이미 읽은 알림입니다.'
        });
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      res.status(200).json({
        message: '알림을 읽음으로 처리했습니다.',
        notification: notification
      });

    } catch (error) {
      next(error);
    }
  }

  // 모든 알림 읽음 처리
  static async markAllAsRead(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const updateResult = await Notification.update({
        isRead: true,
        readAt: new Date()
      }, {
        where: {
          userNo: userNo,
          isRead: false
        }
      });

      res.status(200).json({
        message: '모든 알림을 읽음으로 처리했습니다.',
        updatedCount: updateResult[0]
      });

    } catch (error) {
      next(error);
    }
  }

  // 알림 삭제
  static async deleteNotification(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: {
          notificationNo: notificationId,
          userNo: userNo
        }
      });

      if (!notification) {
        return res.status(404).json({
          message: '알림을 찾을 수 없습니다.'
        });
      }

      await notification.destroy();

      res.status(200).json({
        message: '알림이 삭제되었습니다.'
      });

    } catch (error) {
      next(error);
    }
  }

  // 읽은 알림 모두 삭제
  static async deleteReadNotifications(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const deleteResult = await Notification.destroy({
        where: {
          userNo: userNo,
          isRead: true
        }
      });

      res.status(200).json({
        message: '읽은 알림이 모두 삭제되었습니다.',
        deletedCount: deleteResult
      });

    } catch (error) {
      next(error);
    }
  }

  // 알림 생성 (시스템용)
  static async createNotification(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const {
        userNo,
        title,
        content,
        notificationType,
        priority,
        relatedId,
        relatedType
      } = req.body;

      const newNotification = await Notification.create({
        userNo: userNo,
        title: title,
        content: content,
        notificationType: notificationType,
        priority: priority || 'NORMAL',
        relatedId: relatedId,
        relatedType: relatedType
      });

      res.status(201).json({
        message: '알림이 생성되었습니다.',
        notification: newNotification
      });

    } catch (error) {
      next(error);
    }
  }

  // 알림 통계
  static async getNotificationStats(req, res, next) {
    try {
      const userNo = req.user.userNo;

      // 총 알림 수
      const totalNotifications = await Notification.count({
        where: { userNo: userNo }
      });

      // 읽지 않은 알림 수
      const unreadNotifications = await Notification.count({
        where: { 
          userNo: userNo,
          isRead: false 
        }
      });

      // 오늘 받은 알림 수
      const todayNotifications = await Notification.count({
        where: {
          userNo: userNo,
          createdAt: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      });

      // 우선순위별 알림 수
      const priorityStats = await Notification.findAll({
        where: { userNo: userNo },
        attributes: [
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('notificationNo')), 'count']
        ],
        group: ['priority']
      });

      // 타입별 알림 수
      const typeStats = await Notification.findAll({
        where: { userNo: userNo },
        attributes: [
          'notificationType',
          [require('sequelize').fn('COUNT', require('sequelize').col('notificationNo')), 'count']
        ],
        group: ['notificationType']
      });

      res.status(200).json({
        message: '알림 통계 조회 성공',
        stats: {
          totalNotifications: totalNotifications,
          unreadNotifications: unreadNotifications,
          todayNotifications: todayNotifications,
          priorityBreakdown: priorityStats,
          typeBreakdown: typeStats
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // 실시간 알림 설정 조회
  static async getNotificationSettings(req, res, next) {
    try {
      const userNo = req.user.userNo;

      // 사용자 알림 설정 (실제로는 별도 테이블에 저장)
      const settings = {
        systemNotifications: true,
        paymentNotifications: true,
        welfareNotifications: true,
        anomalyNotifications: true,
        emailNotifications: false,
        smsNotifications: true,
        pushNotifications: true
      };

      res.status(200).json({
        message: '알림 설정 조회 성공',
        settings: settings
      });

    } catch (error) {
      next(error);
    }
  }

  // 실시간 알림 설정 수정
  static async updateNotificationSettings(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const settings = req.body;

      // 실제로는 사용자 설정 테이블에 저장
      // 여기서는 단순히 응답으로 처리
      
      res.status(200).json({
        message: '알림 설정이 수정되었습니다.',
        settings: settings
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
