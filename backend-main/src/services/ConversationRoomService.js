const ConversationRoom = require('../models/ConversationRoom');
const ConversationLog = require('../models/ConversationLog');
const User = require('../models/User');

class ConversationRoomService {
  /**
   * 사용자의 대화방 목록 조회
   */
  static async getRoomsByUser(userNo) {
    try {
      const rooms = await ConversationRoom.findAll({
        where: {
          userNo,
          isActive: true
        },
        order: [['updated_at', 'DESC']], // 컬럼명 수정
        include: [
          {
            model: ConversationLog,
            as: 'lastMessage',
            required: false,
            limit: 1,
            order: [['created_at', 'DESC']], // 컬럼명 수정
            attributes: ['message_content', 'created_at', 'message_type'] // 실제 컬럼명 사용
          }
        ]
      });

      return rooms.map(room => ({
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName,
        conversationRoomCreatedAt: room.createdAt,
        conversationRoomUpdatedAt: room.updatedAt,
        lastMessage: room.lastMessage ? {
          message: room.lastMessage.messageContent, // 실제 필드명 사용
          sender: room.lastMessage.messageType, // 실제 필드명 사용
          createdAt: room.lastMessage.createdAt
        } : null
      }));

    } catch (error) {
      console.error('❌ ConversationRoomService.getRoomsByUser Error:', error);
      throw error;
    }
  }

  /**
   * 새 대화방 생성
   */
  static async createRoom({ roomName, userNo }) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const room = await ConversationRoom.create({
        roomName,
        userNo,
        isActive: true
      });

      console.log(`🏠 New conversation room created - UserNo: ${userNo}, RoomNo: ${room.roomNo}, Title: ${roomName}`);

      return {
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName,
        conversationRoomCreatedAt: room.createdAt,
        conversationRoomUpdatedAt: room.updatedAt
      };

    } catch (error) {
      console.error('❌ ConversationRoomService.createRoom Error:', error);
      throw error;
    }
  }

  /**
   * 대화방 정보 수정
   */
  static async updateRoom(roomNo, updateData, userNo) {
    try {
      const room = await ConversationRoom.findOne({
        where: {
          roomNo,
          userNo,
          isActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      await room.update(updateData);

      console.log(`🏠 Conversation room updated - UserNo: ${userNo}, RoomNo: ${roomNo}`);

      return {
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName,
        conversationRoomCreatedAt: room.createdAt,
        conversationRoomUpdatedAt: room.updatedAt
      };

    } catch (error) {
      console.error('❌ ConversationRoomService.updateRoom Error:', error);
      throw error;
    }
  }

  /**
   * 대화방 삭제 (소프트 삭제)
   */
  static async deleteRoom(roomNo, userNo) {
    try {
      const room = await ConversationRoom.findOne({
        where: {
          roomNo,
          userNo,
          isActive: true
        }
      });

      if (!room) {
        throw new Error('대화방을 찾을 수 없습니다.');
      }

      await room.update({
        isActive: false
      });

      console.log(`🗑️ Conversation room deleted - UserNo: ${userNo}, RoomNo: ${roomNo}`);

      return true;

    } catch (error) {
      console.error('❌ ConversationRoomService.deleteRoom Error:', error);
      throw error;
    }
  }

  /**
   * 모든 대화방 조회 (관리자용)
   */
  static async getAllRooms() {
    try {
      const rooms = await ConversationRoom.findAll({
        where: {
          isActive: true
        },
        order: [['updated_at', 'DESC']], // 컬럼명 수정
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName', 'userType']
          }
        ]
      });

      return rooms.map(room => ({
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName,
        conversationRoomCreatedAt: room.createdAt,
        conversationRoomUpdatedAt: room.updatedAt,
        user: room.user ? {
          userNo: room.user.userNo,
          userId: room.user.userId,
          userName: room.user.userName,
          userType: room.user.userType
        } : null
      }));

    } catch (error) {
      console.error('❌ ConversationRoomService.getAllRooms Error:', error);
      throw error;
    }
  }

  /**
   * 사용자의 마지막 대화 시간 조회
   */
  static async getLastConversationTime(userNo) {
    try {
      // 직접 SQL 쿼리 사용으로 변경 (더 안전함)
      const { sequelize } = require('../models');
      
      const [results] = await sequelize.query(`
        SELECT cl.created_at
        FROM conversation_logs cl
        INNER JOIN conversation_rooms cr ON cl.conversation_room_no = cr.room_no
        WHERE cr.user_no = ? AND cr.is_active = 1
        ORDER BY cl.created_at DESC
        LIMIT 1
      `, {
        replacements: [userNo],
        type: sequelize.QueryTypes.SELECT
      });

      return results.length > 0 ? results[0].created_at : null;

    } catch (error) {
      console.error('❌ ConversationRoomService.getLastConversationTime Error:', error);
      // 오류가 발생해도 null 반환 (서비스 중단 방지)
      return null;
    }
  }
}

module.exports = ConversationRoomService;