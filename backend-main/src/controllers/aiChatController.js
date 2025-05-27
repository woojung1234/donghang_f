const aiChatService = require('../services/aiChatService');
const logger = require('../utils/logger');

class AIChatController {
  /**
   * AI 채팅 메시지 처리
   */
  static async processMessage(req, res) {
    try {
      const { message, sessionId } = req.body;
      const userNo = req.user?.userNo;

      // 입력 유효성 검사
      if (!message) {
        logger.warn('빈 메시지 입력 시도', { userNo, sessionId });
        return res.status(400).json({
          success: false,
          message: '메시지가 필요합니다.'
        });
      }

      // 사용자 인증 확인
      if (!userNo) {
        logger.warn('인증되지 않은 사용자의 메시지 처리 시도', { sessionId, message: message.substring(0, 50) });
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      const sessionIdToUse = sessionId || 'default';
      logger.info(`AI 채팅 요청 - 사용자: ${userNo}, 세션: ${sessionIdToUse}, 메시지: ${message.substring(0, 100)}`);

      // 메시지 처리 시도
      try {
        const result = await aiChatService.processMessage(
          message, 
          userNo, 
          sessionIdToUse
        );

        logger.info(`AI 응답 생성 성공 - 타입: ${result.type}, 사용자: ${userNo}`);
        res.json({
          success: true,
          data: result
        });
      } catch (serviceError) {
        logger.error('AI 서비스 처리 오류:', serviceError);
        
        // 사용자에게 보여줄 오류 메시지
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? `채팅 처리 중 오류: ${serviceError.message}` 
          : '채팅 처리 중 오류가 발생했습니다.';
        
        // 기본 응답 제공 (사용자 경험 개선)
        const fallbackResponse = {
          type: 'error',
          content: '죄송합니다. 현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          needsVoice: true
        };
        
        res.status(200).json({
          success: false,
          message: errorMessage,
          data: fallbackResponse
        });
      }
    } catch (error) {
      logger.error('AI 채팅 컨트롤러 오류:', error);
      res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
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
      const userNo = req.user?.userNo;

      if (!userNo) {
        logger.warn('인증되지 않은 사용자의 세션 초기화 시도');
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      const sessionIdToReset = sessionId || 'default';
      
      if (sessionIdToReset) {
        aiChatService.sessionStates.delete(sessionIdToReset);
        logger.info(`채팅 세션 초기화 - 사용자: ${userNo}, 세션: ${sessionIdToReset}`);
      }

      res.json({
        success: true,
        message: '채팅 세션이 초기화되었습니다.'
      });

    } catch (error) {
      logger.error('채팅 세션 초기화 오류:', error);
      res.status(500).json({
        success: false,
        message: '세션 초기화 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 채팅 세션 상태 조회
   */
  static async getSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const userNo = req.user?.userNo;

      if (!userNo) {
        logger.warn('인증되지 않은 사용자의 세션 상태 조회 시도');
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      const sessionIdToCheck = sessionId || 'default';
      const sessionState = aiChatService.getSessionState(sessionIdToCheck);
      logger.info(`세션 상태 조회 - 사용자: ${userNo}, 세션: ${sessionIdToCheck}`);

      res.json({
        success: true,
        data: {
          sessionId: sessionIdToCheck,
          userNo,
          state: sessionState
        }
      });

    } catch (error) {
      logger.error('채팅 세션 상태 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '세션 상태 조회 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AIChatController;
