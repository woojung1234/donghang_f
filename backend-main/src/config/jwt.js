const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '24h';

class JwtProvider {
  // Generate access token
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
      issuer: 'knockknock'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'knockknock'
    });
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Extract user info from token
  static getUserNoFromToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.userNo;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Extract user info from Authorization header
  static getUserNoFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return this.getUserNoFromToken(token);
  }

  // Generate token pair
  static generateTokenPair(userInfo) {
    const payload = {
      userNo: userInfo.userNo,
      userId: userInfo.userId,
      userType: userInfo.userType
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }
}

module.exports = JwtProvider;
