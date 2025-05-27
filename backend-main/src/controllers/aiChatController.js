const aiChatService = require('../services/aiChatService');
const logger = require('../utils/logger');

class AIChatController {
  /**
   * AI 채팅 메시지 처리
   */
  static async processMessage(req, res) {
    try {
      const { message, sessionId } = req.body;
      const userNo = req.user.userNo;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: '메시지가 필요합니다.'
        });
      }

      logger.info(`AI 채팅 요청 - 사용자: ${userNo}, 세션: ${sessionId || 'default'}, 메시지: ${message}`);

      const result = await aiChatService.processMessage(
        message, 
        userNo, 
        sessionId || 'default'
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('AI 채팅 처리 오류:', error);
      res.status(500).json({
        success: false,
        message: '채팅 처리 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 채팅 세션 초기화
   */
  static async resetSession(req, res) {
    try {
      const { sessionId } = req.body;
      const userNo = req.user.userNo;

      if (sessionId) {
        aiChatService.sessionStates.delete(sessionId);
        logger.info(`채팅 세션 초기화 - 사용자: ${userNo}, 세션: ${sessionId}`);
      }

      res.json({
        success: true,
        message: '채팅 세션이 초기화되었습니다.'
      });

    } catch (error) {
      logger.error('채팅 세션 초기화 오류:', error);
      res.status(500).json({
        success: false,
        message: '세션 초기화 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 채팅 세션 상태 조회
   */
  static async getSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const userNo = req.user.userNo;

      const sessionState = aiChatService.getSessionState(sessionId || 'default');

      res.json({
        success: true,
        data: {
          sessionId: sessionId || 'default',
          userNo,
          state: sessionState
        }
      });

    } catch (error) {
      logger.error('채팅 세션 상태 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '세션 상태 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = AIChatController;
