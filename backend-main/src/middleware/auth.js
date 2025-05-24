// 개발용 인증 우회 미들웨어 (임시)
const authMiddleware = (req, res, next) => {
  // 개발 환경에서 인증 우회
  console.log('🔑 Authentication bypass for development');
  
  // 기본 사용자 정보 설정 (테스트용)
  req.user = {
    userNo: 1,
    userId: 'test_user',
    userType: 'USER'
  };
  
  next();
};

module.exports = authMiddleware;
