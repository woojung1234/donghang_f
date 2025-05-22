const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * 사용자의 모든 알림 조회
   */
  static async getAllNotificationsByUser(userNo) {
    try {
      const notifications = await Notification.findAll({
        where: { userNo },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName']
          }
        ],
        order: [['notificationCreatedAt', 'DESC']]
      });

      return notifications.map(notification => ({
        notificationNo: notification.notificationNo,
        notificationTitle: notification.notificationTitle,
        notificationContent: notification.notificationContent,
        notificationIsRead: notification.notificationIsRead,
        notificationType: notification.notificationType,
        notificationCreatedAt: notification.notificationCreatedAt
      }));

    } catch (error) {
      console.error('❌ NotificationService.getAllNotificationsByUser Error:', error);
      throw error;
    }
  }

  /**
   * 알림 생성
   */
  static async createNotification({ userNo, notificationTitle, notificationContent, notificationType = 'GENERAL' }) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const notification = await Notification.create({
        userNo,
        notificationTitle,
        notificationContent,
        notificationIsRead: false,
        notificationType,
        notificationCreatedAt: new Date()
      });

      console.log(`🔔 Notification created - No: ${notification.notificationNo}, UserNo: ${userNo}, Type: ${notificationType}`);

      return notification.notificationNo;

    } catch (error) {
      console.error('❌ NotificationService.createNotification Error:', error);
      throw error;
    }
  }

  /**
   * 알림 읽음 처리
   */
  static async markAsRead(notificationNo, userNo) {
    try {
      const notification = await Notification.findOne({
        where: { 
          notificationNo,
          userNo // 소유권 확인
        }
      });

      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      if (notification.notificationIsRead) {
        return false; // 이미 읽음 처리됨
      }

      await notification.update({
        notificationIsRead: true
      });

      console.log(`📖 Notification marked as read - No: ${notificationNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ NotificationService.markAsRead Error:', error);
      throw error;
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  static async markAllAsRead(userNo) {
    try {
      const result = await Notification.update(
        { notificationIsRead: true },
        { 
          where: { 
            userNo,
            notificationIsRead: false
          }
        }
      );

      console.log(`📖 All notifications marked as read - UserNo: ${userNo}, Count: ${result[0]}`);

      return result[0]; // 업데이트된 행의 수

    } catch (error) {
      console.error('❌ NotificationService.markAllAsRead Error:', error);
      throw error;
    }
  }

  /**
   * 알림 삭제
   */
  static async deleteNotification(notificationNo, userNo) {
    try {
      const notification = await Notification.findOne({
        where: { 
          notificationNo,
          userNo // 소유권 확인
        }
      });

      if (!notification) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      await notification.destroy();

      console.log(`🗑️ Notification deleted - No: ${notificationNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ NotificationService.deleteNotification Error:', error);
      throw error;
    }
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  static async getUnreadCount(userNo) {
    try {
      const count = await Notification.count({
        where: { 
          userNo,
          notificationIsRead: false
        }
      });

      return count;

    } catch (error) {
      console.error('❌ NotificationService.getUnreadCount Error:', error);
      throw error;
    }
  }

  /**
   * 특정 타입의 알림 조회
   */
  static async getNotificationsByType(userNo, notificationType) {
    try {
      const notifications = await Notification.findAll({
        where: { 
          userNo,
          notificationType
        },
        order: [['notificationCreatedAt', 'DESC']]
      });

      return notifications.map(notification => ({
        notificationNo: notification.notificationNo,
        notificationTitle: notification.notificationTitle,
        notificationContent: notification.notificationContent,
        notificationIsRead: notification.notificationIsRead,
        notificationType: notification.notificationType,
        notificationCreatedAt: notification.notificationCreatedAt
      }));

    } catch (error) {
      console.error('❌ NotificationService.getNotificationsByType Error:', error);
      throw error;
    }
  }

  /**
   * 오래된 알림 정리 (30일 이상)
   */
  static async cleanupOldNotifications() {
    try {
      const { Op } = require('sequelize');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.destroy({
        where: {
          notificationCreatedAt: {
            [Op.lt]: thirtyDaysAgo
          },
          notificationIsRead: true // 읽은 알림만 삭제
        }
      });

      console.log(`🧹 Old notifications cleaned up - Count: ${result}`);

      return result;

    } catch (error) {
      console.error('❌ NotificationService.cleanupOldNotifications Error:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
