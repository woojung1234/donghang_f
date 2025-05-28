const express = require('express');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const WelfareBookController = require('../controllers/WelfareBookController');
const WelfareBookService = require('../services/WelfareBookService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 라우터 시작 로그
console.log('🔧 Welfare-bookings router loaded');

// 테스트용 라우트 (인증 없음) - 서비스 목록 조회
/**
 * @route   GET /api/v1/welfare/services/available
 * @desc    이용 가능한 복지 서비스 목록 조회 (테스트용 - 인증 없음)
 * @access  Public
 */
router.get('/services/available', async (req, res) => {
  try {
    console.log('📋 GET /services/available - Request received');
    
    // 가상 데이터 반환 (실제로는 Welfare 테이블에서 조회)
    const availableServices = [
      {
        id: 'daily-care',
        welfareNo: 1,
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
        welfareNo: 2,
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
        welfareNo: 3,
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

    console.log(`✅ Available services retrieved - Count: ${availableServices.length}`);

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

// 인증이 필요한 라우트들에만 미들웨어 적용
router.use(authMiddleware);

/**
 * @route   GET /api/v1/welfare/bookings
 * @desc    복지 서비스 예약 목록 조회 (실제 DB 사용)
 * @access  Private
 */
router.get('/bookings', async (req, res) => {
  try {
    const userNo = req.user.userNo;
    const { status, page = 1, limit = 10 } = req.query;

    console.log(`📋 GET /bookings - UserNo: ${userNo}, Query:`, req.query);

    // DB 연결 테스트를 위한 try-catch
    let welfareBooks;
    try {
      welfareBooks = await WelfareBookService.getAllByUserNo(userNo);
      console.log(`✅ DB Query successful - Found ${welfareBooks.length} bookings`);
    } catch (dbError) {
      console.error('❌ DB Query failed:', dbError.message);
      // DB 실패 시 빈 배열 반환
      welfareBooks = [];
    }

    // 프론트엔드 호환 형식으로 변환
    const bookings = welfareBooks.map(book => ({
      id: book.welfareBookNo,
      welfareBookNo: book.welfareBookNo,
      welfareId: book.welfare ? book.welfare.welfareNo : null,
      serviceName: book.welfare ? book.welfare.welfareName : '서비스명 없음',
      serviceProvider: book.welfare ? book.welfare.welfareCategory : '제공기관',
      bookingDate: book.welfareBookStartDate,
      bookingTime: '09:00', // 기본값 (실제로는 별도 시간 필드 필요)
      duration: `${book.welfareBookUseTime}시간`,
      paymentAmount: book.welfareBookTotalPrice,
      status: book.welfareBookIsCancel ? 'CANCELLED' : 
              (book.welfareBookIsComplete ? 'COMPLETED' : 'CONFIRMED'),
      userInfo: {
        name: '사용자', // 실제로는 User 테이블에서 가져와야 함
        phone: '010-0000-0000',
        address: '주소 정보'
      },
      createdAt: book.welfareBookReservationDate
    }));

    console.log(`✅ Bookings response prepared - Count: ${bookings.length}`);

    res.status(200).json({
      bookings: bookings,
      total: bookings.length,
      page: parseInt(page),
      limit: parseInt(limit),
      message: '예약 목록 조회 성공'
    });

  } catch (error) {
    console.error('❌ GET /bookings Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: '예약 목록 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/welfare/bookings/:id
 * @desc    특정 예약 상세 조회 (실제 DB 사용)
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
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        message: '잘못된 요청입니다.',
        errors: errors.array()
      });
    }

    const bookingId = req.params.id;
    const userNo = req.user.userNo;

    console.log(`🔍 GET /bookings/${bookingId} - UserNo: ${userNo}`);

    // DB 연결 테스트를 위한 try-catch
    let welfareBook;
    try {
      welfareBook = await WelfareBookService.getDetailById(bookingId, userNo);
      console.log(`✅ DB Query successful - Found booking:`, !!welfareBook);
    } catch (dbError) {
      console.error('❌ DB Query failed:', dbError.message);
      return res.status(500).json({
        message: 'DB 연결 오류가 발생했습니다.',
        error: dbError.message
      });
    }

    if (!welfareBook) {
      return res.status(404).json({
        message: '예약 정보를 찾을 수 없습니다.'
      });
    }

    // 프론트엔드 호환 형식으로 변환
    const booking = {
      id: welfareBook.welfareBookNo,
      welfareBookNo: welfareBook.welfareBookNo,
      welfareId: welfareBook.welfare ? welfareBook.welfare.welfareNo : null,
      serviceName: welfareBook.welfare ? welfareBook.welfare.welfareName : '서비스명 없음',
      serviceProvider: welfareBook.welfare ? welfareBook.welfare.welfareCategory : '제공기관',
      bookingDate: welfareBook.welfareBookStartDate,
      bookingTime: '09:00', // 기본값
      duration: `${welfareBook.welfareBookUseTime}시간`,
      paymentAmount: welfareBook.welfareBookTotalPrice,
      status: welfareBook.welfareBookIsCancel ? 'CANCELLED' : 
              (welfareBook.welfareBookIsComplete ? 'COMPLETED' : 'CONFIRMED'),
      userInfo: {
        name: welfareBook.user ? welfareBook.user.userName : '사용자',
        phone: '010-0000-0000',
        address: '주소 정보'
      },
      createdAt: welfareBook.welfareBookReservationDate
    };

    console.log(`✅ Booking detail response prepared`);
    res.status(200).json(booking);

  } catch (error) {
    console.error('❌ GET /bookings/:id Error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ 
      message: '예약 상세 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/v1/welfare/bookings
 * @desc    복지 서비스 예약 생성 (실제 DB 저장)
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
      console.log('❌ Validation errors:', errors.array());
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

    console.log(`✅ POST /bookings - UserNo: ${userNo}, Service: ${serviceName}`);
    console.log('Request body:', req.body);

    // duration에서 숫자 추출 (예: "2시간" -> 2)
    let useTime = 1;
    if (duration) {
      const timeMatch = duration.match(/(\d+)/);
      if (timeMatch) {
        useTime = parseInt(timeMatch[1]);
      }
    }

    // welfareId를 숫자로 변환 (예: "daily-care" -> 1, "home-nursing" -> 2)
    let welfareNo = 1;
    if (welfareId === 'home-nursing') welfareNo = 2;
    else if (welfareId === 'comprehensive-care') welfareNo = 3;

    console.log(`Mapping: welfareId(${welfareId}) -> welfareNo(${welfareNo}), useTime: ${useTime}`);

    // DB 저장 시도
    let welfareBookNo;
    try {
      const bookingData = {
        welfareNo: welfareNo,
        welfareBookStartDate: bookingDate,
        welfareBookEndDate: bookingDate, // 하루 서비스라고 가정
        welfareBookUseTime: useTime,
        welfareBookReservationDate: new Date(),
        userNo
      };

      console.log('Creating booking with data:', bookingData);
      welfareBookNo = await WelfareBookService.createWelfareBook(bookingData);
      console.log(`✅ Booking saved to DB - BookNo: ${welfareBookNo}`);
    } catch (dbError) {
      console.error('❌ DB Save failed:', dbError.message);
      console.error('DB Error stack:', dbError.stack);
      
      return res.status(500).json({
        message: 'DB 저장 중 오류가 발생했습니다.',
        error: dbError.message
      });
    }

    // 성공 응답
    const newBooking = {
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
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      message: '예약이 성공적으로 생성되어 데이터베이스에 저장되었습니다.'
    };

    console.log(`✅ Booking creation successful - Response prepared`);
    res.status(201).json(newBooking);

  } catch (error) {
    console.error('❌ POST /bookings Error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('존재하지 않습니다')) {
      return res.status(400).json({ 
        message: '사용자 또는 복지 서비스 정보를 찾을 수 없습니다.',
        error: error.message
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
 * @desc    복지 서비스 예약 취소 (실제 DB 업데이트)
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
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        message: '잘못된 요청입니다.',
        errors: errors.array()
      });
    }

    const bookingId = req.params.id;
    const userNo = req.user.userNo;

    console.log(`🗑️ PUT /bookings/${bookingId}/cancel - UserNo: ${userNo}`);

    // DB 업데이트 시도
    let cancelled;
    try {
      cancelled = await WelfareBookService.deleteWelfareBook(bookingId, userNo);
      console.log(`✅ Booking cancelled in DB - Success: ${cancelled}`);
    } catch (dbError) {
      console.error('❌ DB Update failed:', dbError.message);
      return res.status(500).json({
        message: 'DB 업데이트 중 오류가 발생했습니다.',
        error: dbError.message
      });
    }

    if (!cancelled) {
      return res.status(404).json({
        message: '예약 정보를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      id: parseInt(bookingId),
      status: 'CANCELLED',
      message: '예약이 성공적으로 취소되어 데이터베이스에 반영되었습니다.',
      cancelledAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PUT /bookings/:id/cancel Error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: '예약 취소 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/v1/welfare/bookings/stats
 * @desc    예약 통계 조회 (실제 DB 사용)
 * @access  Private
 */
router.get('/bookings/stats', async (req, res) => {
  try {
    const userNo = req.user.userNo;
    
    console.log(`📊 GET /bookings/stats - UserNo: ${userNo}`);

    // DB 조회 시도
    let stats;
    try {
      stats = await WelfareBookService.getBookingStats(userNo);
      console.log(`✅ Stats retrieved from DB:`, stats);
    } catch (dbError) {
      console.error('❌ DB Query failed:', dbError.message);
      // DB 실패 시 기본값 반환
      stats = {
        totalCount: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0
      };
    }

    res.status(200).json({
      total: stats.totalCount,
      pending: stats.pendingCount,
      confirmed: stats.pendingCount, // pending과 같다고 가정
      completed: stats.completedCount,
      cancelled: stats.cancelledCount
    });
    
  } catch (error) {
    console.error('❌ GET /bookings/stats Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: '예약 통계 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

console.log('✅ Welfare-bookings router setup complete');
module.exports = router;
