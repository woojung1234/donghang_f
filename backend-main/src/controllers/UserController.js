// 파일: backend-main/src/controllers/UserController.js
// generateRandomNumber 함수 호출 오류 수정

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const coolsms = require('coolsms-node-sdk').default;

class UserController {
  constructor() {
    // CoolSMS 초기화
    this.messageService = new coolsms(
      process.env.COOLSMS_API_KEY,
      process.env.COOLSMS_API_SECRET
    );
    this.validationMap = new Map(); // SMS 인증번호 저장
    
    // 메서드 바인딩 추가
    this.sendSms = this.sendSms.bind(this);
    this.validationSms = this.validationSms.bind(this);
    this.generateRandomNumber = this.generateRandomNumber.bind(this);
  }

  // 아이디 중복 확인
  async duplicateCheckUserId(req, res, next) {
    try {
      const { userId } = req.params;

      const existingUser = await User.findOne({ 
        where: { userId: userId }
      });

      const isAvailable = !existingUser;
      const message = isAvailable ? 
        '사용가능한 아이디입니다.' : 
        '이미 사용중인 아이디입니다.';

      res.status(200).json({
        message: message,
        result: isAvailable
      });

    } catch (error) {
      next(error);
    }
  }

  // SMS 전송
  async sendSms(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { phone } = req.body;
      // 6자리 랜덤 숫자 생성 (메서드 호출 방식 수정)
      const validationNum = this.generateRandomNumber();

      try {
        // CoolSMS API 호출 시도
        if (this.messageService && process.env.COOLSMS_API_KEY) {
          const response = await this.messageService.sendMessage({
            to: phone,
            from: process.env.COOLSMS_SENDER_NUMBER,
            text: `[똑똑] 인증번호는 ${validationNum}입니다.`
          });
        } else {
          // 개발 환경에서 CoolSMS 설정이 없는 경우 콘솔에 출력
          console.log(`[개발용] ${phone}로 전송할 인증번호: ${validationNum}`);
        }

        // SMS 전송 성공시 인증번호 저장 (5분 후 만료)
        this.validationMap.set(phone, validationNum);
        setTimeout(() => {
          this.validationMap.delete(phone);
        }, 5 * 60 * 1000); // 5분

        res.status(200).json({
          message: '인증번호 전송이 완료되었습니다.',
          result: true,
          // 개발환경에서만 인증번호 포함 (실제 운영에서는 제거)
          ...(process.env.NODE_ENV === 'development' && { validationNum })
        });

      } catch (smsError) {
        console.error('SMS 전송 실패:', smsError);
        
        // SMS 전송 실패해도 개발환경에서는 인증번호 저장
        if (process.env.NODE_ENV === 'development') {
          this.validationMap.set(phone, validationNum);
          setTimeout(() => {
            this.validationMap.delete(phone);
          }, 5 * 60 * 1000);

          res.status(200).json({
            message: '인증번호 전송이 완료되었습니다. (개발모드)',
            result: true,
            validationNum // 개발환경에서만 표시
          });
        } else {
          res.status(200).json({
            message: 'SMS 전송에 실패했습니다.',
            result: false
          });
        }
      }

    } catch (error) {
      next(error);
    }
  }

  // 인증번호 검증
  async validationSms(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { phone, validationNum } = req.body;
      const storedValidationNum = this.validationMap.get(phone);

      let message = '';
      let result = false;
      let status = 200;

      if (!storedValidationNum) {
        message = '인증번호가 만료되었습니다. 다시 시도해주세요.';
        status = 400;
      } else if (storedValidationNum === validationNum) {
        message = '인증이 완료되었습니다.';
        result = true;
        this.validationMap.delete(phone); // 인증 완료 후 삭제
      } else {
        message = '잘못된 인증번호입니다.';
      }

      res.status(status).json({
        message: message,
        result: result
      });

    } catch (error) {
      next(error);
    }
  }

  // 회원가입
  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userData = req.body;

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(userData.userPassword, 12);

      // 사용자 생성
      const newUser = await User.create({
        ...userData,
        userPassword: hashedPassword,
        userType: 'PROTEGE'
      });

      res.status(200).json({
        message: '회원가입에 성공하였습니다.',
        userNo: newUser.userNo,
        userId: newUser.userId
      });

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          message: '이미 존재하는 아이디 또는 전화번호입니다.'
        });
      }
      next(error);
    }
  }

  // 회원 조회
  async readUser(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const user = await User.findByPk(userNo, {
        attributes: { exclude: ['userPassword', 'simplePassword'] }
      });

      if (!user) {
        return res.status(404).json({
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      res.status(200).json(user);

    } catch (error) {
      next(error);
    }
  }

  // 회원 정보 수정
  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const updateData = req.body;

      const user = await User.findByPk(userNo);
      if (!user) {
        return res.status(404).json({
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      await user.update(updateData);

      // 업데이트된 사용자 정보 반환 (비밀번호 제외)
      const updatedUser = await User.findByPk(userNo, {
        attributes: { exclude: ['userPassword', 'simplePassword'] }
      });

      res.status(200).json(updatedUser);

    } catch (error) {
      next(error);
    }
  }

  // 회원 탈퇴
  async deleteUser(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const user = await User.findByPk(userNo);
      if (!user) {
        return res.status(404).json({
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 소프트 삭제 (isActive를 false로)
      await user.update({ isActive: false });

      res.status(200).json({
        message: '탈퇴가 완료되었습니다.',
        result: true
      });

    } catch (error) {
      next(error);
    }
  }

  // 간편 결제 비밀번호 조회
  async readPaymentPassword(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const user = await User.findByPk(userNo);
      if (!user) {
        return res.status(404).json({
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      const hasSimplePassword = !!user.simplePassword;

      res.status(200).json({
        result: hasSimplePassword,
        message: hasSimplePassword ? 
          '간편 결제 비밀번호가 등록되어 있습니다.' : 
          '간편 결제 비밀번호가 등록되지 않았습니다.'
      });

    } catch (error) {
      next(error);
    }
  }

  // 간편 결제 비밀번호 등록
  async createPaymentPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const { simplePassword } = req.body;

      const user = await User.findByPk(userNo);
      if (!user) {
        return res.status(404).json({
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // 간편 비밀번호 해시화
      const hashedSimplePassword = await bcrypt.hash(simplePassword, 12);
      await user.update({ simplePassword: hashedSimplePassword });

      res.status(200).json({
        message: '간편 결제 비밀번호가 등록되었습니다.',
        result: true
      });

    } catch (error) {
      next(error);
    }
  }

  // 간편 결제 비밀번호 검증
  async validatePaymentPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const userNo = req.user.userNo;
      const { simplePassword } = req.body;

      const user = await User.findByPk(userNo);
      if (!user || !user.simplePassword) {
        return res.status(400).json({
          message: '간편 결제 비밀번호가 설정되지 않았습니다.',
          result: false
        });
      }

      // 비밀번호 검증
      const isValid = await bcrypt.compare(simplePassword, user.simplePassword);

      res.status(200).json({
        message: isValid ? '인증에 성공했습니다.' : '비밀번호가 올바르지 않습니다.',
        result: isValid
      });

    } catch (error) {
      next(error);
    }
  }

  // 6자리 랜덤 숫자 생성 (메서드 정의 위치 확인)
  generateRandomNumber() {
    if (process.env.NODE_ENV === 'development') {
        return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = new UserController();