const WelfareBookService = require('../services/WelfareBookService');
const { validationResult } = require('express-validator');

class WelfareBookController {
  /**
   * @swagger
   * /api/v1/welfare-book:
   *   get:
   *     tags:
   *       - 4. 복지 예약 내역
   *     summary: 복지 예약 전체 조회
   *     description: 특정 사용자의 복지 예약 내역을 전부 조회하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 복지 예약 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   welfareBookNo:
   *                     type: number
   *                     description: 예약 번호
   *                   welfareName:
   *                     type: string
   *                     description: 복지 서비스 이름
   *                   welfareBookStartDate:
   *                     type: string
   *                     format: date
   *                     description: 서비스 시작일
   *                   welfareBookEndDate:
   *                     type: string
   *                     format: date
   *                     description: 서비스 종료일
   *                   welfareBookTotalPrice:
   *                     type: number
   *                     description: 총 가격
   *       400:
   *         description: 복지 예약 조회 실패
   */
  static async readAllByUserNo(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const welfareBooks = await WelfareBookService.getAllByUserNo(userNo);

      console.log(`📋 Welfare book list retrieved - UserNo: ${userNo}, Count: ${welfareBooks.length}`);

      res.status(200).json(welfareBooks);

    } catch (error) {
      console.error('❌ WelfareBookController.readAllByUserNo Error:', error);
      
      if (error.message === '사용자 정보가 존재하지 않습니다.') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: '복지 예약 내역 조회 중 오류가 발생했습니다.' 
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare-book/{welfareBookNo}:
   *   get:
   *     tags:
   *       - 4. 복지 예약 내역
   *     summary: 복지 예약 조회 detail [Not Use]
   *     description: 복지 예약 내역 중 하나를 조회하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: welfareBookNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 복지 예약 번호
   *     responses:
   *       200:
   *         description: 복지 예약 상세 조회 성공
   *       400:
   *         description: 복지 예약 상세 조회 실패
   */
  static async readDetail(req, res, next) {
    try {
      const { welfareBookNo } = req.params;
      const userNo = req.user.userNo;

      const welfareBook = await WelfareBookService.getDetailById(welfareBookNo, userNo);

      if (!welfareBook) {
        return res.status(404).json({ message: '복지 예약 내역을 찾을 수 없습니다.' });
      }

      console.log(`🔍 Welfare book detail retrieved - BookNo: ${welfareBookNo}`);

      res.status(200).json(welfareBook);

    } catch (error) {
      console.error('❌ WelfareBookController.readDetail Error:', error);
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: '복지 예약 상세 조회 중 오류가 발생했습니다.' 
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare-book/reserve:
   *   post:
   *     tags:
   *       - 4. 복지 예약 내역
   *     summary: 복지 예약 하기
   *     description: 복지 서비스를 예약하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - welfareNo
   *               - welfareBookStartDate
   *               - welfareBookEndDate
   *               - welfareBookUseTime
   *             properties:
   *               welfareNo:
   *                 type: number
   *                 description: 복지 서비스 번호
   *               welfareBookStartDate:
   *                 type: string
   *                 format: date
   *                 description: 서비스 시작일
   *               welfareBookEndDate:
   *                 type: string
   *                 format: date
   *                 description: 서비스 종료일
   *               welfareBookUseTime:
   *                 type: number
   *                 description: 사용 시간 (시간 단위)
   *               welfareBookReservationDate:
   *                 type: string
   *                 format: date-time
   *                 description: 예약 일시
   *     responses:
   *       201:
   *         description: 복지 예약 생성 성공
   *       400:
   *         description: 잘못된 요청, 입력된 값이 없음
   *       500:
   *         description: 복지 예약 생성 실패
   */
  static async createWelfareBooking(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력된 값이 없습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const { 
        welfareNo, 
        welfareBookStartDate, 
        welfareBookEndDate, 
        welfareBookUseTime, 
        welfareBookReservationDate,
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
      } = req.body;

      console.log('📝 Welfare booking request data:', {
        userNo,
        welfareNo,
        userName,
        userBirth,
        userGender,
        welfareBookStartDate,
        welfareBookEndDate,
        welfareBookUseTime
      });

      const welfareBookNo = await WelfareBookService.createWelfareBook({
        welfareNo,
        welfareBookStartDate,
        welfareBookEndDate,
        welfareBookUseTime,
        welfareBookReservationDate: welfareBookReservationDate || new Date(),
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
      });

      console.log(`✅ Welfare booking created - BookNo: ${welfareBookNo}, UserNo: ${userNo}, WelfareNo: ${welfareNo}`);

      res.status(201).json({
        message: '복지 예약이 성공적으로 생성되었습니다.',
        welfareBookNo
      });

    } catch (error) {
      console.error('❌ WelfareBookController.createWelfareBooking Error:', error);
      
      if (error.message.includes('존재하지 않습니다')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: '복지 예약 생성 중 오류가 발생했습니다.' 
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare-book/{welfareBookNo}:
   *   delete:
   *     tags:
   *       - 4. 복지 예약 내역
   *     summary: 복지 예약 취소
   *     description: 복지 서비스 예약을 취소하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: welfareBookNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 복지 예약 번호
   *     responses:
   *       200:
   *         description: 복지 예약 취소 성공
   *       400:
   *         description: 복지 예약 취소 실패
   */
  static async delete(req, res, next) {
    try {
      const { welfareBookNo } = req.params;
      const userNo = req.user.userNo;

      const deleted = await WelfareBookService.deleteWelfareBook(welfareBookNo, userNo);

      if (!deleted) {
        return res.status(404).json({ message: '복지 예약 내역을 찾을 수 없습니다.' });
      }

      console.log(`🗑️ Welfare booking cancelled - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);

      res.status(200).json({ 
        message: '복지 예약이 성공적으로 취소되었습니다.' 
      });

    } catch (error) {
      console.error('❌ WelfareBookController.delete Error:', error);
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: '복지 예약 취소에 실패했습니다.' 
      });
    }
  }
  /**
   * @swagger
   * /api/v1/welfare-book/{welfareBookNo}/permanent:
   *   delete:
   *     tags:
   *       - 4. 복지 예약 내역
   *     summary: 복지 예약 완전 삭제
   *     description: 취소된 복지 서비스 예약을 완전히 삭제하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: welfareBookNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 복지 예약 번호
   *     responses:
   *       200:
   *         description: 복지 예약 완전 삭제 성공
   *       400:
   *         description: 취소되거나 완료된 예약만 삭제할 수 있습니다
   *       404:
   *         description: 복지 예약 내역을 찾을 수 없습니다
   *       500:
   *         description: 서버 오류
   */
  static async permanentlyDelete(req, res, next) {
    try {
      const { welfareBookNo } = req.params;
      const userNo = req.user.userNo;

      const deleted = await WelfareBookService.permanentlyDeleteWelfareBook(welfareBookNo, userNo);

      if (!deleted) {
        return res.status(404).json({ message: '복지 예약 내역을 찾을 수 없습니다.' });
      }

      console.log(`🗑️ Welfare booking permanently deleted - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);

      res.status(200).json({ 
        message: '복지 예약이 완전히 삭제되었습니다.' 
      });

    } catch (error) {
      console.error('❌ WelfareBookController.permanentlyDelete Error:', error);
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message.includes('취소되거나 완료된 예약만')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: '복지 예약 삭제에 실패했습니다.' 
      });
    }
  }
}

module.exports = WelfareBookController;
