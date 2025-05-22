const WelfareBook = require('../models/WelfareBook');
const Welfare = require('../models/Welfare');
const User = require('../models/User');

class WelfareBookService {
  /**
   * 특정 사용자의 모든 복지 예약 조회
   */
  static async getAllByUserNo(userNo) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자 정보가 존재하지 않습니다.');
      }

      const welfareBooks = await WelfareBook.findAll({
        where: { userNo },
        include: [
          {
            model: Welfare,
            as: 'welfare',
            attributes: ['welfareNo', 'welfareName', 'welfarePrice', 'welfareCategory']
          }
        ],
        order: [['welfareBookReservationDate', 'DESC']]
      });

      return welfareBooks.map(book => ({
        welfareBookNo: book.welfareBookNo,
        welfareBookStartDate: book.welfareBookStartDate,
        welfareBookEndDate: book.welfareBookEndDate,
        welfareBookIsCancel: book.welfareBookIsCancel,
        welfareBookIsComplete: book.welfareBookIsComplete,
        welfareBookUseTime: book.welfareBookUseTime,
        welfareBookTotalPrice: book.welfareBookTotalPrice,
        welfareBookReservationDate: book.welfareBookReservationDate,
        welfare: book.welfare ? {
          welfareNo: book.welfare.welfareNo,
          welfareName: book.welfare.welfareName,
          welfarePrice: book.welfare.welfarePrice,
          welfareCategory: book.welfare.welfareCategory
        } : null
      }));

    } catch (error) {
      console.error('❌ WelfareBookService.getAllByUserNo Error:', error);
      throw error;
    }
  }

  /**
   * 복지 예약 상세 조회
   */
  static async getDetailById(welfareBookNo, userNo) {
    try {
      const welfareBook = await WelfareBook.findOne({
        where: { 
          welfareBookNo,
          userNo // 소유권 확인
        },
        include: [
          {
            model: Welfare,
            as: 'welfare',
            attributes: ['welfareNo', 'welfareName', 'welfarePrice', 'welfareCategory']
          },
          {
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName', 'userType']
          }
        ]
      });

      if (!welfareBook) {
        throw new Error('복지 예약 내역을 찾을 수 없습니다.');
      }

      return {
        welfareBookNo: welfareBook.welfareBookNo,
        welfareBookStartDate: welfareBook.welfareBookStartDate,
        welfareBookEndDate: welfareBook.welfareBookEndDate,
        welfareBookIsCancel: welfareBook.welfareBookIsCancel,
        welfareBookIsComplete: welfareBook.welfareBookIsComplete,
        welfareBookUseTime: welfareBook.welfareBookUseTime,
        welfareBookTotalPrice: welfareBook.welfareBookTotalPrice,
        welfareBookReservationDate: welfareBook.welfareBookReservationDate,
        welfare: welfareBook.welfare ? {
          welfareNo: welfareBook.welfare.welfareNo,
          welfareName: welfareBook.welfare.welfareName,
          welfarePrice: welfareBook.welfare.welfarePrice,
          welfareCategory: welfareBook.welfare.welfareCategory
        } : null,
        user: welfareBook.user ? {
          userNo: welfareBook.user.userNo,
          userId: welfareBook.user.userId,
          userName: welfareBook.user.userName,
          userType: welfareBook.user.userType
        } : null
      };

    } catch (error) {
      console.error('❌ WelfareBookService.getDetailById Error:', error);
      throw error;
    }
  }

  /**
   * 복지 예약 생성
   */
  static async createWelfareBook({ welfareNo, welfareBookStartDate, welfareBookEndDate, welfareBookUseTime, welfareBookReservationDate, userNo }) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자 정보가 존재하지 않습니다.');
      }

      // 복지 서비스 존재 확인
      const welfare = await Welfare.findOne({
        where: { welfareNo }
      });

      if (!welfare) {
        throw new Error('복지 서비스가 존재하지 않습니다.');
      }

      // 총 가격 계산
      const welfareBookTotalPrice = welfare.welfarePrice * welfareBookUseTime;

      const welfareBook = await WelfareBook.create({
        welfareBookStartDate,
        welfareBookEndDate,
        welfareBookIsCancel: false,
        welfareBookIsComplete: false,
        welfareBookUseTime,
        welfareBookTotalPrice,
        welfareBookReservationDate,
        userNo,
        welfareNo
      });

      console.log(`✅ Welfare booking created - BookNo: ${welfareBook.welfareBookNo}, UserNo: ${userNo}, WelfareNo: ${welfareNo}, Price: ${welfareBookTotalPrice}`);

      return welfareBook.welfareBookNo;

    } catch (error) {
      console.error('❌ WelfareBookService.createWelfareBook Error:', error);
      throw error;
    }
  }

  /**
   * 복지 예약 취소 (소프트 삭제)
   */
  static async deleteWelfareBook(welfareBookNo, userNo) {
    try {
      const welfareBook = await WelfareBook.findOne({
        where: { 
          welfareBookNo,
          userNo // 소유권 확인
        }
      });

      if (!welfareBook) {
        throw new Error('복지 예약 내역을 찾을 수 없습니다.');
      }

      // 이미 취소된 예약인지 확인
      if (welfareBook.welfareBookIsCancel) {
        throw new Error('이미 취소된 예약입니다.');
      }

      // 완료된 예약은 취소 불가
      if (welfareBook.welfareBookIsComplete) {
        throw new Error('완료된 예약은 취소할 수 없습니다.');
      }

      await welfareBook.update({
        welfareBookIsCancel: true,
        welfareBookTotalPrice: 0 // 취소 시 가격을 0으로 설정
      });

      console.log(`🗑️ Welfare booking cancelled - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ WelfareBookService.deleteWelfareBook Error:', error);
      throw error;
    }
  }

  /**
   * 복지 예약 완료 처리
   */
  static async completeWelfareBook(welfareBookNo, userNo) {
    try {
      const welfareBook = await WelfareBook.findOne({
        where: { 
          welfareBookNo,
          userNo
        }
      });

      if (!welfareBook) {
        throw new Error('복지 예약 내역을 찾을 수 없습니다.');
      }

      if (welfareBook.welfareBookIsCancel) {
        throw new Error('취소된 예약은 완료할 수 없습니다.');
      }

      if (welfareBook.welfareBookIsComplete) {
        throw new Error('이미 완료된 예약입니다.');
      }

      await welfareBook.update({
        welfareBookIsComplete: true
      });

      console.log(`✅ Welfare booking completed - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);

      return true;

    } catch (error) {
      console.error('❌ WelfareBookService.completeWelfareBook Error:', error);
      throw error;
    }
  }

  /**
   * 사용자의 예약 통계 조회
   */
  static async getBookingStats(userNo) {
    try {
      const { Op } = require('sequelize');

      const totalCount = await WelfareBook.count({
        where: { userNo }
      });

      const completedCount = await WelfareBook.count({
        where: { 
          userNo,
          welfareBookIsComplete: true,
          welfareBookIsCancel: false
        }
      });

      const cancelledCount = await WelfareBook.count({
        where: { 
          userNo,
          welfareBookIsCancel: true
        }
      });

      const pendingCount = await WelfareBook.count({
        where: { 
          userNo,
          welfareBookIsComplete: false,
          welfareBookIsCancel: false
        }
      });

      return {
        totalCount,
        completedCount,
        cancelledCount,
        pendingCount
      };

    } catch (error) {
      console.error('❌ WelfareBookService.getBookingStats Error:', error);
      throw error;
    }
  }
}

module.exports = WelfareBookService;
