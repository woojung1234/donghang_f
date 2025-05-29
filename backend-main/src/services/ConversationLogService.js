const ConversationLog = require('../models/ConversationLog');
const ConversationRoom = require('../models/ConversationRoom');
const logger = require('../utils/logger');

class ConversationLogService {
  /**
   * 대화 로그 저장
   */
  static async saveConversationLog(conversationRoomNo, messageContent, messageType = 'USER', userNo = null) {
    try {
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

      // 대화 로그 저장
      const conversationLog = await ConversationLog.create({
        conversationRoomNo: conversationRoomNo,
        messageContent: messageContent,
        messageType: messageType, // 'USER' 또는 'AI'
        createdAt: new Date()
      });

      // 대화방 최종 업데이트 시간 갱신
      await room.update({
        updatedAt: new Date()
      });

      logger.info(`💬 대화 로그 저장 완료 - RoomNo: ${conversationRoomNo}, Type: ${messageType}`);

      return {
        conversationLogNo: conversationLog.conversationLogNo,
        conversationRoomNo: conversationLog.conversationRoomNo,
        messageContent: conversationLog.messageContent,
        messageType: conversationLog.messageType,
        createdAt: conversationLog.createdAt
      };

    } catch (error) {
      logger.error('❌ ConversationLogService.saveConversationLog Error:', error);
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
          conversationRoomNo: conversationRoomNo
        },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: offset
      });

      return logs.map(log => ({
        conversationLogNo: log.conversationLogNo,
        conversationRoomNo: log.conversationRoomNo,
        messageContent: log.messageContent,
        messageType: log.messageType,
        createdAt: log.createdAt
      }));

    } catch (error) {
      logger.error('❌ ConversationLogService.getConversationLogs Error:', error);
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
          cl.conversation_log_no,
          cl.conversation_room_no,
          cl.message_content,
          cl.message_type,
          cl.created_at,
          cr.room_name
        FROM conversation_logs cl
        INNER JOIN conversation_rooms cr ON cl.conversation_room_no = cr.room_no
        WHERE cr.user_no = ? AND cr.is_active = true
        ORDER BY cl.created_at DESC
        LIMIT ?
      `, {
        replacements: [userNo, limit],
        type: sequelize.QueryTypes.SELECT
      });

      return results.map(result => ({
        conversationLogNo: result.conversation_log_no,
        conversationRoomNo: result.conversation_room_no,
        messageContent: result.message_content,
        messageType: result.message_type,
        createdAt: result.created_at,
        roomName: result.room_name
      }));

    } catch (error) {
      logger.error('❌ ConversationLogService.getRecentConversationLogs Error:', error);
      return [];
    }
  }

  /**
   * 대화 로그 삭제 (소프트 삭제 아님 - 실제 삭제)
   */
  static async deleteConversationLog(conversationLogNo, userNo = null) {
    try {
      // 대화 로그 조회 및 권한 확인
      const log = await ConversationLog.findOne({
        where: {
          conversationLogNo: conversationLogNo
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

      logger.info(`🗑️ 대화 로그 삭제 완료 - LogNo: ${conversationLogNo}`);
      
      return true;

    } catch (error) {
      logger.error('❌ ConversationLogService.deleteConversationLog Error:', error);
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
          conversationRoomNo: conversationRoomNo
        }
      });

      logger.info(`🗑️ 대화방 로그 일괄 삭제 완료 - RoomNo: ${conversationRoomNo}, 삭제 수: ${deletedCount}`);
      
      return deletedCount;

    } catch (error) {
      logger.error('❌ ConversationLogService.deleteAllLogsInRoom Error:', error);
      throw error;
    }
  }
}

module.exports = ConversationLogService;
