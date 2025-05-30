const ConversationLog = require('../models/ConversationLog');
const ConversationRoom = require('../models/ConversationRoom');
const logger = require('../utils/logger');

class ConversationLogService {
  /**
   * 대화 로그 저장
   */
  static async saveConversationLog(conversationRoomNo, messageContent, messageType = 'USER', userNo = null) {
    try {
      // userNo가 필수이므로 확인
      if (!userNo) {
        throw new Error('사용자 정보가 필요합니다.');
      }

      // 대화방 존재 여부 확인
      const room = await ConversationRoom.findOne({
        where: {
          roomNo: conversationRoomNo,
          isActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      // 대화 로그 저장 (필드명 수정)
      const conversationLog = await ConversationLog.create({
        roomNo: conversationRoomNo,  // conversationRoomNo -> roomNo
        userNo: userNo,              // userNo 추가
        messageContent: messageContent,
        messageType: messageType, // 'USER' 또는 'AI'
        createdAt: new Date()
      });

      // 대화방 최종 업데이트 시간 갱신
      await room.update({
        updatedAt: new Date()
      });

      logger.info(`💬 대화 로그 저장 완료 - RoomNo: ${conversationRoomNo}, Type: ${messageType}, UserNo: ${userNo}`);

      return {
        logNo: conversationLog.logNo,               // conversationLogNo -> logNo
        roomNo: conversationLog.roomNo,             // conversationRoomNo -> roomNo
        userNo: conversationLog.userNo,             // userNo 추가
        messageContent: conversationLog.messageContent,
        messageType: conversationLog.messageType,
        createdAt: conversationLog.createdAt
      };

    } catch (error) {
      logger.error('❌ ConversationLogService.saveConversationLog Error:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * 대화방의 대화 로그 조회
   */
  static async getConversationLogs(conversationRoomNo, limit = 50, offset = 0) {
    try {
      const logs = await ConversationLog.findAll({
        where: {
          roomNo: conversationRoomNo  // conversationRoomNo -> roomNo
        },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: offset
      });

      return logs.map(log => ({
        logNo: log.logNo,               // conversationLogNo -> logNo
        roomNo: log.roomNo,             // conversationRoomNo -> roomNo
        userNo: log.userNo,             // userNo 추가
        messageContent: log.messageContent,
        messageType: log.messageType,
        createdAt: log.createdAt
      }));

    } catch (error) {
      logger.error('❌ ConversationLogService.getConversationLogs Error:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * 사용자의 최근 대화 로그 조회
   */
  static async getRecentConversationLogs(userNo, limit = 10) {
    try {
      const { sequelize } = require('../models');
      
      const results = await sequelize.query(`
        SELECT 
          cl.log_no,
          cl.room_no,
          cl.user_no,
          cl.message_content,
          cl.message_type,
          cl.created_at,
          cr.room_name
        FROM conversation_logs cl
        INNER JOIN conversation_rooms cr ON cl.room_no = cr.room_no
        WHERE cr.user_no = ? AND cr.is_active = true
        ORDER BY cl.created_at DESC
        LIMIT ?
      `, {
        replacements: [userNo, limit],
        type: sequelize.QueryTypes.SELECT
      });

      return results.map(result => ({
        logNo: result.log_no,
        roomNo: result.room_no,
        userNo: result.user_no,
        messageContent: result.message_content,
        messageType: result.message_type,
        createdAt: result.created_at,
        roomName: result.room_name
      }));

    } catch (error) {
      logger.error('❌ ConversationLogService.getRecentConversationLogs Error:', error.message, error.stack);
      return [];
    }
  }

  /**
   * 대화 로그 삭제 (소프트 삭제 아님 - 실제 삭제)
   */
  static async deleteConversationLog(logNo, userNo = null) {
    try {
      // 대화 로그 조회 및 권한 확인
      const log = await ConversationLog.findOne({
        where: {
          logNo: logNo  // conversationLogNo -> logNo
        },
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            where: userNo ? { userNo: userNo } : {},
            required: true
          }
        ]
      });

      if (!log) {
        throw new Error('대화 로그를 찾을 수 없거나 권한이 없습니다.');
      }

      await log.destroy();

      logger.info(`🗑️ 대화 로그 삭제 완료 - LogNo: ${logNo}`);
      
      return true;

    } catch (error) {
      logger.error('❌ ConversationLogService.deleteConversationLog Error:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * 대화방의 모든 로그 삭제
   */
  static async deleteAllLogsInRoom(conversationRoomNo, userNo = null) {
    try {
      // 대화방 존재 및 권한 확인
      const room = await ConversationRoom.findOne({
        where: {
          roomNo: conversationRoomNo,
          ...(userNo && { userNo: userNo }),
          isActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없거나 권한이 없습니다.');
      }

      // 해당 대화방의 모든 로그 삭제
      const deletedCount = await ConversationLog.destroy({
        where: {
          roomNo: conversationRoomNo  // conversationRoomNo -> roomNo
        }
      });

      logger.info(`🗑️ 대화방 로그 일괄 삭제 완료 - RoomNo: ${conversationRoomNo}, 삭제 수: ${deletedCount}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('❌ ConversationLogService.deleteAllLogsInRoom Error:', error.message, error.stack);
      throw error;
    }
  }
}

module.exports = ConversationLogService;
