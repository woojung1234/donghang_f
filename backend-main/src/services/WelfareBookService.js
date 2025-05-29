const WelfareBook = require('../models/WelfareBook');
const User = require('../models/User');
const NotificationService = require('./NotificationService');

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
        order: [['welfareBookReservationDate', 'DESC']]
      });

      // 하드코딩된 복지서비스 정보
      const welfareServices = {
        1: { welfareNo: 1, welfareName: '일상가사 돌봄', welfarePrice: 30000, welfareCategory: '가사지원' },
        2: { welfareNo: 2, welfareName: '가정간병 돌봄', welfarePrice: 40000, welfareCategory: '간병지원' },
        3: { welfareNo: 3, welfareName: '정서지원 돌봄', welfarePrice: 20000, welfareCategory: '정서지원' }
      };

      return welfareBooks.map(book => ({
        welfareBookNo: book.welfareBookNo,
        welfareBookStartDate: book.welfareBookStartDate,
        welfareBookEndDate: book.welfareBookEndDate,
        welfareBookIsCancel: book.welfareBookIsCancel,
        welfareBookIsComplete: book.welfareBookIsComplete,
        welfareBookUseTime: book.welfareBookUseTime,
        welfareBookTotalPrice: book.welfareBookTotalPrice,
        welfareBookReservationDate: book.welfareBookReservationDate,
        // 예약자 개인정보 추가
        userName: book.userName,
        userBirth: book.userBirth,
        userGender: book.userGender,
        userAddress: book.userAddress,
        userDetailAddress: book.userDetailAddress,
        userPhone: book.userPhone,
        userHeight: book.userHeight,
        userWeight: book.userWeight,
        userMedicalInfo: book.userMedicalInfo,
        specialRequest: book.specialRequest,
        welfare: welfareServices[book.welfareNo] || null
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
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName', 'userType']
          }
        ]
      });

      if (!welfareBook) {
        throw new Error('복지 예약 내역을 찾을 수 없습니다.');
      }

      // 하드코딩된 복지서비스 정보
      const welfareServices = {
        1: { welfareNo: 1, welfareName: '일상가사 돌봄', welfarePrice: 30000, welfareCategory: '가사지원' },
        2: { welfareNo: 2, welfareName: '가정간병 돌봄', welfarePrice: 40000, welfareCategory: '간병지원' },
        3: { welfareNo: 3, welfareName: '정서지원 돌봄', welfarePrice: 20000, welfareCategory: '정서지원' }
      };

      return {
        welfareBookNo: welfareBook.welfareBookNo,
        welfareBookStartDate: welfareBook.welfareBookStartDate,
        welfareBookEndDate: welfareBook.welfareBookEndDate,
        welfareBookIsCancel: welfareBook.welfareBookIsCancel,
        welfareBookIsComplete: welfareBook.welfareBookIsComplete,
        welfareBookUseTime: welfareBook.welfareBookUseTime,
        welfareBookTotalPrice: welfareBook.welfareBookTotalPrice,
        welfareBookReservationDate: welfareBook.welfareBookReservationDate,
        // 예약자 개인정보 추가
        userName: welfareBook.userName,
        userBirth: welfareBook.userBirth,
        userGender: welfareBook.userGender,
        userAddress: welfareBook.userAddress,
        userDetailAddress: welfareBook.userDetailAddress,
        userPhone: welfareBook.userPhone,
        userHeight: welfareBook.userHeight,
        userWeight: welfareBook.userWeight,
        userMedicalInfo: welfareBook.userMedicalInfo,
        specialRequest: welfareBook.specialRequest,
        welfare: welfareServices[welfareBook.welfareNo] || null,
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
  static async createWelfareBook(bookingData) {
    try {
      const { 
        welfareNo, 
        welfareBookStartDate, 
        welfareBookEndDate, 
        welfareBookUseTime, 
        welfareBookReservationDate, 
        userNo,
        // 예약자 개인정보
        userName,
        userBirth,
        userGender,
        userAddress,
        userDetailAddress,
        userPhone,
        userHeight,
        userWeight,
        userMedicalInfo,
        specialRequest
      } = bookingData;

      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자 정보가 존재하지 않습니다.');
      }

      // 복지 서비스 존재 확인 (하드코딩된 서비스 확인)
      const validWelfareServices = [
        { welfareNo: 1, welfarePrice: 30000 },
        { welfareNo: 2, welfarePrice: 40000 }, 
        { welfareNo: 3, welfarePrice: 20000 }
      ];

      const welfare = validWelfareServices.find(w => w.welfareNo === welfareNo);
      if (!welfare) {
        throw new Error('복지 서비스가 존재하지 않습니다.');
      }

      // 총 가격 계산 (시간당 요금 × 실제 시간)
      let actualHours = 0;
      const timeValue = parseInt(welfareBookUseTime);
      
      switch(timeValue) {
        case 1: actualHours = 3; break;  // 3시간
        case 2: actualHours = 6; break;  // 6시간  
        case 3: actualHours = 9; break;  // 9시간
        case 4: actualHours = 24 * 30; break;  // 1개월 (30일 기준)
        case 5: actualHours = 24 * 60; break;  // 2개월 (60일 기준)
        case 6: actualHours = 24 * 90; break;  // 3개월 (90일 기준)
        case 7: actualHours = 24 * 120; break; // 4개월 (120일 기준)
        case 8: actualHours = 24 * 150; break; // 5개월 (150일 기준)
        case 9: actualHours = 24 * 180; break; // 6개월 (180일 기준)
        default: actualHours = timeValue;
      }

      const welfareBookTotalPrice = welfare.welfarePrice * actualHours;

      const welfareBook = await WelfareBook.create({
        welfareNo,
        userNo,
        // 예약자 개인정보
        userName,
        userBirth,
        userGender, 
        userAddress,
        userDetailAddress,
        userPhone,
        userHeight: userHeight ? parseInt(userHeight) : null,
        userWeight: userWeight ? parseInt(userWeight) : null,
        userMedicalInfo,
        // 예약 정보
        welfareBookStartDate,
        welfareBookEndDate,
        welfareBookUseTime: actualHours, // 실제 시간으로 저장
        welfareBookTotalPrice,
        welfareBookReservationDate: welfareBookReservationDate || new Date(),
        specialRequest,
        welfareBookIsCancel: false,
        welfareBookIsComplete: false
      });

      console.log(`✅ Welfare booking created - BookNo: ${welfareBook.welfareBookNo}, UserNo: ${userNo}, WelfareNo: ${welfareNo}, Price: ${welfareBookTotalPrice}, ActualHours: ${actualHours}`);

      // 예약 완료 알림 생성
      try {
        const welfareNames = {
          1: '일상가사 돌봄',
          2: '가정간병 돌봄', 
          3: '정서지원 돌봄'
        };

        console.log(`🔔 [WELFARE_BOOKING] 알림 생성 시작`);
        console.log(`   - UserNo: ${userNo}`);
        console.log(`   - BookingNo: ${welfareBook.welfareBookNo}`);
        console.log(`   - WelfareNo: ${welfareNo}`);
        console.log(`   - WelfareName: ${welfareNames[welfareNo] || '복지서비스'}`);
        console.log(`   - StartDate: ${welfareBookStartDate}`);
        console.log(`   - EndDate: ${welfareBookEndDate}`);
        console.log(`   - TotalPrice: ${welfareBookTotalPrice}`);

        const notificationResult = await NotificationService.createWelfareBookingNotification({
          userNo,
          welfareBookNo: welfareBook.welfareBookNo,
          welfareName: welfareNames[welfareNo] || '복지서비스',
          startDate: welfareBookStartDate,
          endDate: welfareBookEndDate,
          totalPrice: welfareBookTotalPrice
        });

        console.log(`✅ [WELFARE_BOOKING] 알림 생성 완료 - NotificationNo: ${notificationResult}`);
        
        // 생성된 알림 확인
        if (notificationResult) {
          console.log(`🎯 [WELFARE_BOOKING] 알림이 성공적으로 생성되었습니다!`);
        } else {
          console.warn(`⚠️ [WELFARE_BOOKING] 알림 생성 결과가 null입니다.`);
        }
        
      } catch (notificationError) {
        console.error('❌ [WELFARE_BOOKING] 알림 생성 실패:', notificationError);
        console.error('Error details:', {
          message: notificationError.message,
          stack: notificationError.stack,
          userNo,
          welfareBookNo: welfareBook.welfareBookNo,
          welfareNo
        });
        // 알림 생성 실패해도 예약은 정상 진행
      }

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
      console.log(`🔍 Attempting to delete welfare book - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);
      
      const welfareBook = await WelfareBook.findOne({
        where: { 
          welfareBookNo,
          userNo // 소유권 확인
        }
      });

      if (!welfareBook) {
        console.log(`❌ Welfare book not found - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);
        throw new Error('복지 예약 내역을 찾을 수 없습니다.');
      }

      // 이미 취소된 예약인지 확인
      if (welfareBook.welfareBookIsCancel) {
        console.log(`⚠️ Welfare book already cancelled - BookNo: ${welfareBookNo}`);
        throw new Error('이미 취소된 예약입니다.');
      }

      // 완료된 예약은 취소 불가
      if (welfareBook.welfareBookIsComplete) {
        console.log(`⚠️ Welfare book already completed - BookNo: ${welfareBookNo}`);
        throw new Error('완료된 예약은 취소할 수 없습니다.');
      }

      const updateResult = await welfareBook.update({
        welfareBookIsCancel: true,
        welfareBookTotalPrice: 0 // 취소 시 가격을 0으로 설정
      });

      console.log(`✅ Welfare booking update successful - BookNo: ${welfareBookNo}, Result:`, updateResult);

      // 예약 취소 알림 생성
      try {
        const welfareNames = {
          1: '일상가사 돌봄',
          2: '가정간병 돌봄', 
          3: '정서지원 돌봄'
        };

        await NotificationService.createWelfareBookingCancelNotification({
          userNo,
          welfareBookNo,
          welfareName: welfareNames[welfareBook.welfareNo] || '복지서비스',
          startDate: welfareBook.welfareBookStartDate,
          endDate: welfareBook.welfareBookEndDate
        });
        
        console.log(`🔔 Cancel notification created for booking: ${welfareBookNo}`);
      } catch (notificationError) {
        console.error('⚠️ Failed to create welfare booking cancel notification:', notificationError);
        // 알림 생성 실패해도 취소는 정상 진행
      }

      console.log(`🗑️ Welfare booking cancelled successfully - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);
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
