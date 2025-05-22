const bcrypt = require('bcryptjs');
const User = require('../models/User');
const JwtProvider = require('../config/jwt');
const { validationResult } = require('express-validator');

class AuthController {
  // ID/Password Login
  static async idLogin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { userId, userPassword } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { 
          userId: userId,
          isActive: true 
        }
      });

      if (!user) {
        return res.status(401).json({
          message: '아이디 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // Validate password
      const isValidPassword = await bcrypt.compare(userPassword, user.userPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          message: '아이디 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate tokens
      const tokens = JwtProvider.generateTokenPair({
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType
      });

      console.log(`🔑 ID/Password Login Success - UserNo: ${user.userNo}, UserType: ${user.userType}`);

      res.status(200).json({
        message: '로그인 성공',
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

    } catch (error) {
      next(error);
    }
  }

  // Simple Password Login
  static async simpleLogin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { userId, simplePassword } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { 
          userId: userId,
          isActive: true 
        }
      });

      if (!user || !user.simplePassword) {
        return res.status(401).json({
          message: '간편 비밀번호가 설정되지 않았거나 올바르지 않습니다.'
        });
      }

      // Validate simple password
      const isValidPassword = await bcrypt.compare(simplePassword, user.simplePassword);
      if (!isValidPassword) {
        return res.status(401).json({
          message: '간편 비밀번호가 올바르지 않습니다.'
        });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate tokens
      const tokens = JwtProvider.generateTokenPair({
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType
      });

      res.status(200).json({
        message: '로그인 성공',
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

    } catch (error) {
      next(error);
    }
  }

  // Biometric Login
  static async bioLogin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { userId, biometricData } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { 
          userId: userId,
          isActive: true 
        }
      });

      if (!user || !user.biometricData) {
        return res.status(401).json({
          message: '생체 인증이 설정되지 않았거나 올바르지 않습니다.'
        });
      }

      // Validate biometric data (simplified - in real app, use proper biometric validation)
      if (user.biometricData !== biometricData) {
        return res.status(401).json({
          message: '생체 인증에 실패했습니다.'
        });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate tokens
      const tokens = JwtProvider.generateTokenPair({
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType
      });

      res.status(200).json({
        message: '로그인 성공',
        userNo: user.userNo,
        userId: user.userId,
        userType: user.userType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req, res, next) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, just return success
      res.status(200).json({
        message: '로그아웃 되었습니다.'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
