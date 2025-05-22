const ConversationLogService = require('../services/ConversationLogService');
const { validationResult } = require('express-validator');

class ConversationLogController {
  /**
   * @swagger
   * /api/v1/conversation-log:
   *   post:
   *     tags:
   *       - 대화 내역
   *     summary: 대화 내역 생성 [Not Use]
   *     description: 특정 대화방의 대화 내용을 추가합니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - conversationRoomNo
   *               - message
   *               - sender
   *             properties:
   *               conversationRoomNo:
   *                 type: number
   *                 description: 대화방 번호
   *               message:
   *                 type: string
   *                 description: 대화 메시지
   *               sender:
   *                 type: string
   *                 enum: [USER, BOT]
   *                 description: 발신자 타입
   *     responses:
   *       201:
   *         description: 대화 내역 생성 성공
   */
  static async createConversationLog(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { conversationRoomNo, message, sender } = req.body;
      const userNo = req.user.userNo;

      const logNo = await ConversationLogService.createConversationLog({
        conversationRoomNo,
        message,
        sender,
        userNo
      });

      console.log(`📝 Conversation log created - LogNo: ${logNo}, RoomNo: ${conversationRoomNo}`);

      res.status(201).json({
        message: '대화 내역이 생성되었습니다.',
        conversationLogNo: logNo
      });

    } catch (error) {
      console.error('❌ ConversationLogController.createConversationLog Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-log:
   *   get:
   *     tags:
   *       - 대화 내역
   *     summary: 모든 대화 내역 조회 [Not Use]
   *     description: 모든 대화 내역을 조회합니다.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 대화 내역 조회 성공
   */
  static async getAllConversationLogs(req, res, next) {
    try {
      const conversationLogs = await ConversationLogService.getAllConversationLogs();

      res.status(200).json(conversationLogs);

    } catch (error) {
      console.error('❌ ConversationLogController.getAllConversationLogs Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-log/{conversationLogNo}:
   *   put:
   *     tags:
   *       - 대화 내역
   *     summary: 대화 내역 수정 [Not Use]
   *     description: 특정 대화 내역을 수정합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationLogNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 대화 로그 번호
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               message:
   *                 type: string
   *                 description: 수정할 메시지
   *     responses:
   *       200:
   *         description: 대화 내역 수정 성공
   */
  static async updateConversationLog(req, res, next) {
    try {
      const { conversationLogNo } = req.params;
      const { message } = req.body;
      const userNo = req.user.userNo;

      await ConversationLogService.updateConversationLog(conversationLogNo, { message }, userNo);

      console.log(`🔄 Conversation log updated - LogNo: ${conversationLogNo}`);

      res.status(200).json({
        message: 'The conversation log has been successfully updated.'
      });

    } catch (error) {
      console.error('❌ ConversationLogController.updateConversationLog Error:', error);
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/conversation-log/{conversationLogNo}:
   *   delete:
   *     tags:
   *       - 대화 내역
   *     summary: 대화 내역 삭제 [Not Use]
   *     description: 특정 대화 내역을 삭제합니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationLogNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 대화 로그 번호
   *     responses:
   *       200:
   *         description: 대화 내역 삭제 성공
   */
  static async deleteConversationLog(req, res, next) {
    try {
      const { conversationLogNo } = req.params;
      const userNo = req.user.userNo;

      await ConversationLogService.deleteConversationLog(conversationLogNo, userNo);

      console.log(`🗑️ Conversation log deleted - LogNo: ${conversationLogNo}`);

      res.status(200).json({
        message: 'The conversation log has been successfully deleted.'
      });

    } catch (error) {
      console.error('❌ ConversationLogController.deleteConversationLog Error:', error);
      next(error);
    }
  }
}

module.exports = ConversationLogController;
