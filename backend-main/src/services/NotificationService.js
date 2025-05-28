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
        order: [['created_at', 'DESC']]
      });

      return notifications.map(notification => ({
        notificationNo: notification.notificationNo,
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        notificationType: notification.notificationType,
        priority: notification.priority,
        readAt: notification.readAt,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        createdAt: notification.created_at
      }));

    } catch (error) {
      console.error('❌ NotificationService.getAllNotificationsByUser Error:', error);
      throw error;
    }
  }

  /**
   * 알림 생성
   */
  static async createNotification({ userNo, title, content, notificationType = 'SYSTEM', priority = 'NORMAL', relatedId = null, relatedType = null }) {
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
        title,
        content,
        isRead: false,
        notificationType,
        priority,
        relatedId,
        relatedType
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

      if (notification.isRead) {
        return false; // 이미 읽음 처리됨
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
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
        { 
          isRead: true,
          readAt: new Date()
        },
        { 
          where: { 
            userNo,
            isRead: false
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
          isRead: false
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
        order: [['created_at', 'DESC']]
      });

      return notifications.map(notification => ({
        notificationNo: notification.notificationNo,
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        notificationType: notification.notificationType,
        priority: notification.priority,
        readAt: notification.readAt,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        createdAt: notification.created_at
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
          created_at: {
            [Op.lt]: thirtyDaysAgo
          },
          isRead: true // 읽은 알림만 삭제
        }
      });

      console.log(`🧹 Old notifications cleaned up - Count: ${result}`);

      return result;

    } catch (error) {
      console.error('❌ NotificationService.cleanupOldNotifications Error:', error);
      throw error;
    }
  }

  /**
   * 복지서비스 예약 완료 알림 생성
   */
  static async createWelfareBookingNotification({ userNo, welfareBookNo, welfareName, startDate, endDate, totalPrice }) {
    try {
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const title = '복지서비스 예약 완료';
      const content = `${welfareName} 서비스 예약이 완료되었습니다.\n` +
                     `예약기간: ${formatDate(startDate)} ~ ${formatDate(endDate)}\n` +
                     `총 비용: ${totalPrice.toLocaleString()}원\n` +
                     `예약번호: ${welfareBookNo}`;

      const notificationNo = await this.createNotification({
        userNo,
        title,
        content,
        notificationType: 'WELFARE',
        priority: 'NORMAL',
        relatedId: welfareBookNo,
        relatedType: 'WELFARE_BOOKING'
      });

      console.log(`🔔 Welfare booking notification created - NotificationNo: ${notificationNo}, BookingNo: ${welfareBookNo}`);

      return notificationNo;

    } catch (error) {
      console.error('❌ NotificationService.createWelfareBookingNotification Error:', error);
      throw error;
    }
  }

  /**
   * 복지서비스 예약 취소 알림 생성
   */
  static async createWelfareBookingCancelNotification({ userNo, welfareBookNo, welfareName, startDate, endDate }) {
    try {
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const title = '복지서비스 예약 취소';
      const content = `${welfareName} 서비스 예약이 취소되었습니다.\n` +
                     `취소된 예약기간: ${formatDate(startDate)} ~ ${formatDate(endDate)}\n` +
                     `예약번호: ${welfareBookNo}`;

      const notificationNo = await this.createNotification({
        userNo,
        title,
        content,
        notificationType: 'WELFARE',
        priority: 'NORMAL',
        relatedId: welfareBookNo,
        relatedType: 'WELFARE_CANCEL'
      });

      console.log(`🔔 Welfare booking cancel notification created - NotificationNo: ${notificationNo}, BookingNo: ${welfareBookNo}`);

      return notificationNo;

    } catch (error) {
      console.error('❌ NotificationService.createWelfareBookingCancelNotification Error:', error);
      throw error;
    }
  }

  /**
   * 복지서비스 예약 확인 알림 생성 (예약일 하루 전)
   */
  static async createWelfareBookingReminderNotification({ userNo, welfareBookNo, welfareName, startDate }) {
    try {
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const title = '복지서비스 예약 안내';
      const content = `내일 예약된 ${welfareName} 서비스를 잊지 마세요!\n` +
                     `서비스 날짜: ${formatDate(startDate)}\n` +
                     `예약번호: ${welfareBookNo}`;

      const notificationNo = await this.createNotification({
        userNo,
        title,
        content,
        notificationType: 'WELFARE',
        priority: 'HIGH',
        relatedId: welfareBookNo,
        relatedType: 'WELFARE_REMINDER'
      });

      console.log(`🔔 Welfare booking reminder notification created - NotificationNo: ${notificationNo}, BookingNo: ${welfareBookNo}`);

      return notificationNo;

    } catch (error) {
      console.error('❌ NotificationService.createWelfareBookingReminderNotification Error:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
