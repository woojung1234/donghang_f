const ConversationRoomService = require('../services/ConversationRoomService');
const { validationResult } = require('express-validator');

class ConversationRoomController {
  /**
   * @swagger
   * /api/v1/conversation-room:
   *   post:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 생성
   *     description: 로그인 한 유저의 대화방을 생성합니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       201:
   *         description: 대화방 생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 conversationRoomNo:
   *                   type: number
   *                   description: 생성된 대화방 번호
   */
  static async createConversationRoom(req, res, next) {
    try {
      const userNo = req.user.userNo;
      // title 필드를 roomName으로 매핑하여 전달
      const roomData = {
        roomName: req.body.title || '새 대화',
        userNo
      };

      const roomNo = await ConversationRoomService.createRoom(roomData);

      console.log(`🏠 New conversation room created - UserNo: ${userNo}, RoomNo: ${roomNo.conversationRoomNo}`);

      res.status(201).json({
        conversationRoomNo: roomNo.conversationRoomNo
      });

    } catch (error) {
      console.error('❌ ConversationRoomController.createConversationRoom Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-room:
   *   get:
   *     tags:
   *       - 3. 말동무
   *     summary: 모든 대화방 조회 [Not Use]
   *     description: 모든 대화방을 조회합니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 대화방 목록 조회 성공
   */
  static async readAll(req, res, next) {
    try {
      const userNo = req.user.userNo;
      const rooms = await ConversationRoomService.getAllRooms();

      res.status(200).json(rooms);

    } catch (error) {
      console.error('❌ ConversationRoomController.readAll Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-room/last-conversation-time:
   *   get:
   *     tags:
   *       - 3. 말동무
   *     summary: 마지막 대화 시간 조회
   *     description: 마지막으로 대화한 시간을 조회합니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 마지막 대화 시간 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 conversationEndAt:
   *                   type: string
   *                   format: date-time
   *                   description: 마지막 대화 시간
   */
  static async readLastConversationTime(req, res, next) {
    try {
      const userNo = req.user.userNo;

      const lastConversationTime = await ConversationRoomService.getLastConversationTime(userNo);

      res.status(200).json({
        conversationEndAt: lastConversationTime
      });

    } catch (error) {
      console.error('❌ ConversationRoomController.readLastConversationTime Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-room/{conversationRoomNo}:
   *   put:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 수정 [Not Use]
   *     description: 특정 대화방을 수정합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationRoomNo
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
   *                 description: 대화방 제목
   *     responses:
   *       200:
   *         description: 대화방 수정 성공
   */
  static async updateConversationRoom(req, res, next) {
    try {
      const { conversationRoomNo } = req.params;
      const { title } = req.body;
      const userNo = req.user.userNo;

      // title 필드를 roomName으로 매핑하여 전달
      await ConversationRoomService.updateRoom(conversationRoomNo, { roomName: title }, userNo);

      console.log(`🔄 Conversation room updated - RoomNo: ${conversationRoomNo}`);

      res.status(200).json({
        message: 'The conversation room has been successfully updated.'
      });

    } catch (error) {
      console.error('❌ ConversationRoomController.updateConversationRoom Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-room/{conversationRoomNo}:
   *   delete:
   *     tags:
   *       - 3. 말동무
   *     summary: 대화방 삭제 [Not Use]
   *     description: 특정 대화방을 삭제합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationRoomNo
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
      const { conversationRoomNo } = req.params;
      const userNo = req.user.userNo;

      await ConversationRoomService.deleteRoom(conversationRoomNo, userNo);

      console.log(`🗑️ Conversation room deleted - RoomNo: ${conversationRoomNo}`);

      res.status(200).json({
        message: 'The conversation room has been successfully deleted.'
      });

    } catch (error) {
      console.error('❌ ConversationRoomController.deleteConversationRoom Error:', error);
      next(error);
    }
  }
}

module.exports = ConversationRoomController;
