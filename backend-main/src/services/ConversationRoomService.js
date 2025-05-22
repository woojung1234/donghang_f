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
          conversationRoomIsActive: true
        },
        order: [['conversationRoomUpdatedAt', 'DESC']],
        include: [
          {
            model: ConversationLog,
            as: 'lastMessage',
            required: false,
            limit: 1,
            order: [['conversationLogCreatedAt', 'DESC']],
            attributes: ['conversationLogMessage', 'conversationLogCreatedAt', 'conversationLogSender']
          }
        ]
      });

      return rooms.map(room => ({
        conversationRoomNo: room.conversationRoomNo,
        conversationRoomTitle: room.conversationRoomTitle,
        conversationRoomCreatedAt: room.conversationRoomCreatedAt,
        conversationRoomUpdatedAt: room.conversationRoomUpdatedAt,
        lastMessage: room.lastMessage ? {
          message: room.lastMessage.conversationLogMessage,
          sender: room.lastMessage.conversationLogSender,
          createdAt: room.lastMessage.conversationLogCreatedAt
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
  static async createRoom({ title, userNo }) {
    try {
      // 사용자 존재 확인
      const user = await User.findOne({
        where: { userNo, isActive: true }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const room = await ConversationRoom.create({
        conversationRoomTitle: title,
        userNo,
        conversationRoomCreatedAt: new Date(),
        conversationRoomUpdatedAt: new Date(),
        conversationRoomIsActive: true
      });

      console.log(`🏠 New conversation room created - UserNo: ${userNo}, RoomNo: ${room.conversationRoomNo}, Title: ${title}`);

      return {
        conversationRoomNo: room.conversationRoomNo,
        conversationRoomTitle: room.conversationRoomTitle,
        conversationRoomCreatedAt: room.conversationRoomCreatedAt,
        conversationRoomUpdatedAt: room.conversationRoomUpdatedAt
      };

    } catch (error) {
      console.error('❌ ConversationRoomService.createRoom Error:', error);
      throw error;
    }
  }

  /**
   * 대화방 정보 수정
   */
  static async updateRoom(conversationRoomNo, updateData, userNo) {
    try {
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

      await room.update({
        ...updateData,
        conversationRoomUpdatedAt: new Date()
      });

      console.log(`🏠 Conversation room updated - UserNo: ${userNo}, RoomNo: ${conversationRoomNo}`);

      return {
        conversationRoomNo: room.conversationRoomNo,
        conversationRoomTitle: room.conversationRoomTitle,
        conversationRoomCreatedAt: room.conversationRoomCreatedAt,
        conversationRoomUpdatedAt: room.conversationRoomUpdatedAt
      };

    } catch (error) {
      console.error('❌ ConversationRoomService.updateRoom Error:', error);
      throw error;
    }
  }

  /**
   * 대화방 삭제 (소프트 삭제)
   */
  static async deleteRoom(conversationRoomNo, userNo) {
    try {
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

      await room.update({
        conversationRoomIsActive: false,
        conversationRoomUpdatedAt: new Date()
      });

      console.log(`🗑️ Conversation room deleted - UserNo: ${userNo}, RoomNo: ${conversationRoomNo}`);

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
          conversationRoomIsActive: true
        },
        order: [['conversationRoomUpdatedAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userNo', 'userId', 'userName', 'userType']
          }
        ]
      });

      return rooms.map(room => ({
        conversationRoomNo: room.conversationRoomNo,
        conversationRoomTitle: room.conversationRoomTitle,
        conversationRoomCreatedAt: room.conversationRoomCreatedAt,
        conversationRoomUpdatedAt: room.conversationRoomUpdatedAt,
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
      const { Op } = require('sequelize');
      
      const lastLog = await ConversationLog.findOne({
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            where: { 
              userNo,
              conversationRoomIsActive: true 
            },
            required: true
          }
        ],
        order: [['conversationLogCreatedAt', 'DESC']],
        limit: 1
      });

      return lastLog ? lastLog.conversationLogCreatedAt : null;

    } catch (error) {
      console.error('❌ ConversationRoomService.getLastConversationTime Error:', error);
      throw error;
    }
  }
}

module.exports = ConversationRoomService;
