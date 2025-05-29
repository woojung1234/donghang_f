const express = require('express');
const router = express.Router();
const WelfareBook = require('../models/WelfareBook');

// 간단한 예약 테스트 엔드포인트 (인증 없이)
router.post('/test-reserve', async (req, res) => {
    try {
        console.log('🧪 테스트 예약 요청:', req.body);
        
        const { welfareNo, userName, userBirth, userGender, userAddress, userPhone } = req.body;
        
        // 하드코딩된 복지서비스 가격
        const welfareServices = {
            1: { price: 30000, name: '일상가사 돌봄' },
            2: { price: 40000, name: '가정간병 돌봄' },
            3: { price: 20000, name: '정서지원 돌봄' }
        };
        
        const service = welfareServices[welfareNo];
        if (!service) {
            return res.status(400).json({ message: '유효하지 않은 복지서비스입니다.' });
        }
        
        // 간단한 예약 생성
        const welfareBook = await WelfareBook.create({
            welfareNo,
            userNo: 1, // 테스트용 고정 userNo
            userName,
            userBirth,
            userGender,
            userAddress,
            userDetailAddress: req.body.userDetailAddress || '',
            userPhone,
            userHeight: req.body.userHeight ? parseInt(req.body.userHeight) : null,
            userWeight: req.body.userWeight ? parseInt(req.body.userWeight) : null,
            userMedicalInfo: req.body.userMedicalInfo || '',
            welfareBookStartDate: req.body.welfareBookStartDate,
            welfareBookEndDate: req.body.welfareBookEndDate,
            welfareBookUseTime: 3, // 고정 3시간
            welfareBookTotalPrice: service.price * 3,
            welfareBookReservationDate: new Date(),
            specialRequest: req.body.specialRequest || '',
            welfareBookIsCancel: false,
            welfareBookIsComplete: false
        });
        
        console.log('✅ 테스트 예약 성공:', welfareBook.welfareBookNo);
        
        res.status(201).json({
            message: '예약이 성공적으로 생성되었습니다.',
            welfareBookNo: welfareBook.welfareBookNo,
            service: service.name,
            totalPrice: service.price * 3
        });
        
    } catch (error) {
        console.error('❌ 테스트 예약 실패:', error);
        res.status(500).json({ 
            message: '예약 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
