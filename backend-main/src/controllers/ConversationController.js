const ConversationService = require('../services/ConversationService');
const ConversationRoomService = require('../services/ConversationRoomService');
const JwtProvider = require('../config/jwt');
const { validationResult } = require('express-validator');

class ConversationController {
  /**
   * @swagger
   * /api/v1/conversations:
   *   post:
   *     tags:
   *       - 3. 말동무
   *     summary: 말동무 대화
   *     description: 말동무의 답변을 생성합니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - input
   *               - conversationRoomNo
   *             properties:
   *               input:
   *                 type: string
   *                 description: 사용자 입력 메시지
   *                 example: "안녕하세요"
   *               conversationRoomNo:
   *                 type: number
   *                 description: 대화방 번호
   *                 example: 1
   *     responses:
   *       200:
   *         description: 대화 응답 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: 챗봇 응답 메시지
   *                 actionRequired:
   *                   type: boolean
   *                   description: 추가 액션이 필요한지 여부
   *                 totalTokens:
   *                   type: number
   *                   description: 사용된 토큰 수
   *                 conversationLogNo:
   *                   type: number
   *                   description: 대화 로그 번호
   */
  static async conversation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { input, conversationRoomNo } = req.body;
      const userNo = req.user.userNo;
      const clientIp = req.ip || req.connection.remoteAddress;

      console.log(`📌 Received conversation request from IP: ${clientIp}, input=${input}, conversationRoomNo=${conversationRoomNo}`);

      const startTime = Date.now();
      const response = await ConversationService.processConversation({
        input,
        conversationRoomNo,
        userNo
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`📌 Chatbot response: totalTokens=${response.totalTokens}, duration=${duration}ms`);

      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Conversation Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/test:
   *   post:
   *     tags:
   *       - 3. 말동무
   *     summary: 말동무 대화 테스트
   *     description: 말동무의 답변을 생성합니다 (테스트용).
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - input
   *               - conversationRoomNo
   *             properties:
   *               input:
   *                 type: string
   *                 description: 사용자 입력 메시지
   *               conversationRoomNo:
   *                 type: number
   *                 description: 대화방 번호
   *     responses:
   *       200:
   *         description: 대화 응답 성공 (테스트 데이터 포함)
   */
  static async conversationTest(req, res, next) {
    try {
      const { input, conversationRoomNo } = req.body;
      const userNo = req.user.userNo;
      const clientIp = req.ip || req.connection.remoteAddress;

      console.log(`📌 Received TEST conversation request from IP: ${clientIp}, input=${input}, conversationRoomNo=${conversationRoomNo}`);

      const startTime = Date.now();
      const response = await ConversationService.processConversation({
        input,
        conversationRoomNo,
        userNo
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`📌 TEST Chatbot response: totalTokens=${response.totalTokens}, duration=${duration}ms`);

      // 테스트용 예약 결과 추가
      const reservationTest = {
        welfareNo: 1,
        welfareBookStartDate: '2024-09-06',
        welfareBookEndDate: '2024-09-06',
        welfareBookUseTime: 1
      };

      response.actionRequired = true;
      response.reservationResult = reservationTest;

      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Conversation Test Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/rooms:
   *   get:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 목록 조회
   *     description: 사용자의 대화방 목록을 조회합니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 대화방 목록 조회 성공
   */
  static async getConversationRooms(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const rooms = await ConversationRoomService.getRoomsByUser(userNo);

      res.status(200).json({
        message: '대화방 목록 조회 성공',
        rooms
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/rooms:
   *   post:
   *     tags:
   *       - 3. 말동무
   *     summary: 새 대화방 생성
   *     description: 새로운 대화방을 생성합니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: 대화방 제목
   *                 example: "복지 상담"
   *     responses:
   *       201:
   *         description: 대화방 생성 성공
   */
  static async createConversationRoom(req, res, next) {
    try {
      const { title = '새 대화' } = req.body;
      const userNo = req.user.userNo;

      const room = await ConversationRoomService.createRoom({
        title,
        userNo
      });

      res.status(201).json({
        message: '대화방 생성 성공',
        room
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/rooms/{roomNo}:
   *   get:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 내역 조회
   *     description: 특정 대화방의 대화 내역을 조회합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 대화방 번호
   *     responses:
   *       200:
   *         description: 대화 내역 조회 성공
   */
  static async getConversationHistory(req, res, next) {
    try {
      const { roomNo } = req.params;
      const userNo = req.user.userNo;

      const history = await ConversationService.getConversationHistory(roomNo, userNo);

      res.status(200).json({
        message: '대화 내역 조회 성공',
        history
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/rooms/{roomNo}:
   *   put:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 정보 수정
   *     description: 대화방 제목을 수정합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 대화방 번호
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: 새로운 대화방 제목
   *     responses:
   *       200:
   *         description: 대화방 수정 성공
   */
  static async updateConversationRoom(req, res, next) {
    try {
      const { roomNo } = req.params;
      const { title } = req.body;
      const userNo = req.user.userNo;

      const updatedRoom = await ConversationRoomService.updateRoom(roomNo, { title }, userNo);

      res.status(200).json({
        message: '대화방 수정 성공',
        room: updatedRoom
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversations/rooms/{roomNo}:
   *   delete:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 삭제
   *     description: 대화방을 삭제합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 대화방 번호
   *     responses:
   *       200:
   *         description: 대화방 삭제 성공
   */
  static async deleteConversationRoom(req, res, next) {
    try {
      const { roomNo } = req.params;
      const userNo = req.user.userNo;

      await ConversationRoomService.deleteRoom(roomNo, userNo);

      res.status(200).json({
        message: '대화방 삭제 성공'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConversationController;
