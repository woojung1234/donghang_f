const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '토큰이 제공되지 않았습니다.' 
      });
    }

    // "Bearer TOKEN" 형식에서 토큰 부분만 추출
    const token = authHeader.split(' ')[1];
    
    // JWT 토큰 검증
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET이 설정되지 않았습니다.');
    }

    const decoded = jwt.verify(token, secret);
    
    // 토큰에서 추출한 실제 사용자 정보를 req.user에 설정
    req.user = {
      userNo: decoded.userNo,        // 실제 로그인한 사용자 번호
      userId: decoded.userId,        // 실제 로그인한 사용자 ID
      userType: decoded.userType     // 실제 사용자 타입
    };

    console.log(`🔑 인증된 사용자: ${req.user.userId} (번호: ${req.user.userNo})`);
    
    next();
    
  } catch (error) {
    console.error('JWT 검증 오류:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '토큰이 만료되었습니다.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};

module.exports = authMiddleware;
