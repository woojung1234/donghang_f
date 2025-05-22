const ConversationLog = require('../models/ConversationLog');
const ConversationRoom = require('../models/ConversationRoom');

class ConversationLogService {
  /**
   * 대화 로그 생성
   */
  static async createConversationLog({ conversationRoomNo, message, sender, userNo }) {
    try {
      // 대화방 존재 및 소유권 확인
      const room = await ConversationRoom.findOne({
        where: {
          conversationRoomNo,
          userNo,
          conversationRoomIsActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      const conversationLog = await ConversationLog.create({
        conversationRoomNo,
        conversationLogSender: sender,
        conversationLogMessage: message,
        conversationLogCreatedAt: new Date()
      });

      // 대화방 업데이트 시간 갱신
      await room.update({
        conversationRoomUpdatedAt: new Date()
      });

      console.log(`📝 Conversation log created - LogNo: ${conversationLog.conversationLogNo}, RoomNo: ${conversationRoomNo}`);

      return conversationLog.conversationLogNo;

    } catch (error) {
      console.error('❌ ConversationLogService.createConversationLog Error:', error);
      throw error;
    }
  }

  /**
   * 모든 대화 로그 조회
   */
  static async getAllConversationLogs() {
    try {
      const logs = await ConversationLog.findAll({
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            attributes: ['conversationRoomNo', 'conversationRoomTitle']
          }
        ],
        order: [['conversationLogCreatedAt', 'DESC']]
      });

      return logs.map(log => ({
        conversationLogNo: log.conversationLogNo,
        conversationRoomNo: log.conversationRoomNo,
        conversationLogSender: log.conversationLogSender,
        conversationLogMessage: log.conversationLogMessage,
        conversationLogCreatedAt: log.conversationLogCreatedAt,
        conversationRoom: log.conversationRoom ? {
          conversationRoomNo: log.conversationRoom.conversationRoomNo,
          conversationRoomTitle: log.conversationRoom.conversationRoomTitle
        } : null
      }));

    } catch (error) {
      console.error('❌ ConversationLogService.getAllConversationLogs Error:', error);
      throw error;
    }
  }

  /**
   * 대화 로그 수정
   */
  static async updateConversationLog(conversationLogNo, updateData, userNo) {
    try {
      const log = await ConversationLog.findOne({
        where: { conversationLogNo },
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            where: { userNo, conversationRoomIsActive: true }
          }
        ]
      });

      if (!log) {
        throw new Error('대화 로그를 찾을 수 없습니다.');
      }

      await log.update({
        ...updateData,
        conversationLogUpdatedAt: new Date()
      });

      console.log(`🔄 Conversation log updated - LogNo: ${conversationLogNo}`);

      return true;

    } catch (error) {
      console.error('❌ ConversationLogService.updateConversationLog Error:', error);
      throw error;
    }
  }

  /**
   * 대화 로그 삭제
   */
  static async deleteConversationLog(conversationLogNo, userNo) {
    try {
      const log = await ConversationLog.findOne({
        where: { conversationLogNo },
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            where: { userNo, conversationRoomIsActive: true }
          }
        ]
      });

      if (!log) {
        throw new Error('대화 로그를 찾을 수 없습니다.');
      }

      await log.destroy();

      console.log(`🗑️ Conversation log deleted - LogNo: ${conversationLogNo}`);

      return true;

    } catch (error) {
      console.error('❌ ConversationLogService.deleteConversationLog Error:', error);
      throw error;
    }
  }

  /**
   * 특정 대화방의 로그 조회
   */
  static async getLogsByRoomNo(conversationRoomNo, userNo) {
    try {
      // 대화방 소유권 확인
      const room = await ConversationRoom.findOne({
        where: {
          conversationRoomNo,
          userNo,
          conversationRoomIsActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      const logs = await ConversationLog.findAll({
        where: { conversationRoomNo },
        order: [['conversationLogCreatedAt', 'ASC']]
      });

      return logs.map(log => ({
        conversationLogNo: log.conversationLogNo,
        conversationLogSender: log.conversationLogSender,
        conversationLogMessage: log.conversationLogMessage,
        conversationLogCreatedAt: log.conversationLogCreatedAt
  }));

    } catch (error) {
      console.error('❌ ConversationLogService.getLogsByRoomNo Error:', error);
      throw error;
    }
  }
}

module.exports = ConversationLogService;
