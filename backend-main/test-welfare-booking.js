const axios = require('axios');

async function testWelfareBookingAPI() {
    try {
        console.log('🧪 복지서비스 예약 API 테스트 시작...');

        // 테스트용 예약 데이터 (실제 프론트에서 보낸 데이터와 동일)
        const bookingData = {
            welfareNo: 2,
            userName: '강건우',
            userBirth: '1999-12-23',
            userGender: '남성',
            userAddress: '전북 김제시 입석로 336-86',
            userDetailAddress: '',
            userPhone: '01074127378',
            userHeight: '',
            userWeight: '',
            userMedicalInfo: '',
            welfareBookStartDate: '2025-05-30',
            welfareBookEndDate: '2025-05-30',
            welfareBookUseTime: 1,
            welfareBookReservationDate: new Date().toISOString(),
            specialRequest: ''
        };

        console.log('📝 예약 데이터:', JSON.stringify(bookingData, null, 2));

        // 테스트 API 호출 (JWT 토큰 없이)
        const response = await axios.post('http://localhost:9090/api/v1/test-welfare/test-reserve', bookingData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ 예약 성공!');
        console.log('응답:', response.data);

    } catch (error) {
        console.error('❌ 예약 실패!');
        console.error('상태 코드:', error.response?.status);
        console.error('에러 메시지:', error.response?.data);
        console.error('전체 에러:', error.message);
    }
}

// JWT 토큰 없이 테스트하기 위해 사용자 인증 우회 테스트
async function testWithoutAuth() {
    try {
        // 먼저 복지서비스 목록이 정상적으로 나오는지 확인
        console.log('📋 복지서비스 목록 테스트...');
        const welfareResponse = await axios.get('http://localhost:9090/api/v1/welfare');
        console.log('복지서비스 목록:', welfareResponse.data);
        
        await testWelfareBookingAPI();
    } catch (error) {
        console.error('테스트 실패:', error.message);
    }
}

testWithoutAuth();
