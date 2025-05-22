const JwtProvider = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: '인증 토큰이 필요합니다.',
        error: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7);
    const decoded = JwtProvider.verifyToken(token);
    
    // Add user info to request object
    req.user = {
      userNo: decoded.userNo,
      userId: decoded.userId,
      userType: decoded.userType
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: '유효하지 않은 토큰입니다.',
      error: 'INVALID_TOKEN'
    });
  }
};

module.exports = authMiddleware;
