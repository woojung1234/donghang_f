const express = require('express');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const WelfareBookController = require('../controllers/WelfareBookController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   GET /api/v1/welfare/bookings
 * @desc    복지 서비스 예약 목록 조회 (프론트엔드 호환)
 * @access  Private
 */
router.get('/bookings', async (req, res) => {
  try {
    const userNo = req.user.userNo;
    const { status, page = 1, limit = 10 } = req.query;

    // 기존 컨트롤러 재사용
    req.params = {}; // 기존 라우트와 호환성 위해
    await WelfareBookController.readAllByUserNo(req, res);
  } catch (error) {
    console.error('❌ GET /bookings Error:', error);
    res.status(500).json({ 
      message: '예약 목록 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/welfare/bookings/:id
 * @desc    특정 예약 상세 조회
 * @access  Private
 */
router.get('/bookings/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 예약 ID를 입력해주세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '잘못된 요청입니다.',
        errors: errors.array()
      });
    }

    // 기존 컨트롤러와 호환되도록 파라미터 매핑
    req.params.welfareBookNo = req.params.id;
    await WelfareBookController.readDetail(req, res);
  } catch (error) {
    console.error('❌ GET /bookings/:id Error:', error);
    res.status(500).json({ 
      message: '예약 상세 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/v1/welfare/bookings
 * @desc    복지 서비스 예약 생성 (프론트엔드 호환)
 * @access  Private
 */
router.post('/bookings', [
  body('welfareId')
    .notEmpty()
    .withMessage('복지 서비스 ID를 입력해주세요.'),
  body('serviceName')
    .notEmpty()
    .withMessage('서비스명을 입력해주세요.'),
  body('bookingDate')
    .isISO8601()
    .withMessage('올바른 예약일을 입력해주세요. (YYYY-MM-DD 형식)'),
  body('bookingTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('올바른 시간을 입력해주세요. (HH:MM 형식)'),
  body('duration')
    .optional()
    .isString()
    .withMessage('서비스 소요시간을 문자열로 입력해주세요.'),
  body('paymentAmount')
    .isInt({ min: 0 })
    .withMessage('결제 금액은 0 이상의 숫자여야 합니다.'),
  body('userInfo')
    .isObject()
    .withMessage('사용자 정보를 입력해주세요.'),
  body('userInfo.name')
    .notEmpty()
    .withMessage('이름을 입력해주세요.'),
  body('userInfo.phone')
    .matches(/^[0-9-+()\\s]+$/)
    .withMessage('올바른 전화번호를 입력해주세요.'),
  body('userInfo.address')
    .notEmpty()
    .withMessage('주소를 입력해주세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const userNo = req.user.userNo;
    const {
      welfareId,
      serviceName,
      serviceProvider,
      bookingDate,
      bookingTime,
      duration,
      paymentAmount,
      userInfo,
      status = 'PENDING'
    } = req.body;

    // 기존 WelfareBookService 활용을 위한 데이터 변환
    const bookingData = {
      welfareNo: welfareId, // 프론트엔드의 welfareId를 백엔드의 welfareNo로 매핑
      welfareBookStartDate: bookingDate,
      welfareBookEndDate: bookingDate, // 하루 서비스라고 가정
      welfareBookUseTime: parseInt(duration) || 1, // 시간 단위로 변환
      welfareBookReservationDate: new Date(),
      userNo
    };

    // 기존 컨트롤러 로직 재사용하기 위해 req.body 수정
    req.body = bookingData;
    
    // 임시로 새로운 응답 형식으로 반환
    const WelfareBookService = require('../services/WelfareBookService');
    
    const welfareBookNo = await WelfareBookService.createWelfareBook(bookingData);

    console.log(`✅ New welfare booking created - BookNo: ${welfareBookNo}, UserNo: ${userNo}`);

    res.status(201).json({
      id: welfareBookNo,
      welfareBookNo,
      welfareId,
      serviceName,
      serviceProvider,
      bookingDate,
      bookingTime,
      duration,
      paymentAmount,
      userInfo,
      status,
      createdAt: new Date().toISOString(),
      message: '예약이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('❌ POST /bookings Error:', error);
    
    if (error.message.includes('존재하지 않습니다')) {
      return res.status(400).json({ 
        message: '사용자 또는 복지 서비스 정보를 찾을 수 없습니다.' 
      });
    }
    
    res.status(500).json({ 
      message: '예약 생성 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/v1/welfare/bookings/:id/cancel
 * @desc    복지 서비스 예약 취소
 * @access  Private
 */
router.put('/bookings/:id/cancel', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 예약 ID를 입력해주세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '잘못된 요청입니다.',
        errors: errors.array()
      });
    }

    // 기존 컨트롤러와 호환되도록 파라미터 매핑
    req.params.welfareBookNo = req.params.id;
    await WelfareBookController.delete(req, res);
  } catch (error) {
    console.error('❌ PUT /bookings/:id/cancel Error:', error);
    res.status(500).json({ 
      message: '예약 취소 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/welfare/services/available
 * @desc    이용 가능한 복지 서비스 목록 조회
 * @access  Private
 */
router.get('/services/available', async (req, res) => {
  try {
    // 가상 데이터 반환 (실제로는 DB에서 조회)
    const availableServices = [
      {
        id: 'daily-care',
        name: '일상가사 돌봄',
        description: '일상적인 가사일 도움 서비스',
        provider: '지역복지센터',
        duration: '2시간',
        price: 15000,
        availableDates: ['2025-05-29', '2025-05-30', '2025-06-01', '2025-06-02'],
        timeSlots: ['09:00', '11:00', '14:00', '16:00'],
        category: '생활지원'
      },
      {
        id: 'home-nursing',
        name: '가정간병 돌봄',
        description: '환자 또는 거동불편자 간병 서비스',
        provider: '의료복지센터',
        duration: '4시간',
        price: 35000,
        availableDates: ['2025-05-29', '2025-05-31', '2025-06-01', '2025-06-03'],
        timeSlots: ['08:00', '12:00', '16:00', '20:00'],
        category: '의료지원'
      },
      {
        id: 'comprehensive-care',
        name: '하나 돌봄',
        description: '종합적인 돌봄 서비스',
        provider: '종합복지관',
        duration: '3시간',
        price: 25000,
        availableDates: ['2025-05-30', '2025-05-31', '2025-06-02', '2025-06-04'],
        timeSlots: ['10:00', '13:00', '15:00', '18:00'],
        category: '종합돌봄'
      }
    ];

    console.log(`📋 Available services retrieved - Count: ${availableServices.length}`);

    res.status(200).json({
      services: availableServices,
      total: availableServices.length,
      message: '이용 가능한 서비스 목록입니다.'
    });

  } catch (error) {
    console.error('❌ GET /services/available Error:', error);
    res.status(500).json({ 
      message: '서비스 목록 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/welfare/bookings/stats
 * @desc    예약 통계 조회
 * @access  Private
 */
router.get('/bookings/stats', async (req, res) => {
  try {
    const userNo = req.user.userNo;
    
    // 실제로는 DB에서 통계 조회
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    console.log(`📊 Booking stats retrieved for UserNo: ${userNo}`);

    res.status(200).json(stats);
  } catch (error) {
    console.error('❌ GET /bookings/stats Error:', error);
    res.status(500).json({ 
      message: '예약 통계 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

module.exports = router;
