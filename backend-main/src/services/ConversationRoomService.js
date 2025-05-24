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
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: ConversationLog,
            as: 'lastMessage',
            required: false,
            limit: 1,
            order: [['createdAt', 'DESC']],
            attributes: ['message', 'createdAt', 'sender']
          }
        ]
      });

      return rooms.map(room => ({
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName, // roomName 필드를 conversationRoomTitle로 변환
        conversationRoomCreatedAt: room.createdAt,
        conversationRoomUpdatedAt: room.updatedAt,
        lastMessage: room.lastMessage ? {
          message: room.lastMessage.message,
          sender: room.lastMessage.sender,
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

      // roomName 필드 사용
      const room = await ConversationRoom.create({
        roomName, // 올바른 필드명 사용
        userNo,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      console.log(`🏠 New conversation room created - UserNo: ${userNo}, RoomNo: ${room.roomNo}, Title: ${roomName}`);

      return {
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName, // roomName 필드를 conversationRoomTitle로 변환
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

      await room.update({
        ...updateData,
        updatedAt: new Date()
      });

      console.log(`🏠 Conversation room updated - UserNo: ${userNo}, RoomNo: ${roomNo}`);

      return {
        conversationRoomNo: room.roomNo,
        conversationRoomTitle: room.roomName, // roomName 필드를 conversationRoomTitle로 변환
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
        isActive: false,
        updatedAt: new Date()
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
        order: [['updatedAt', 'DESC']],
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
        conversationRoomTitle: room.roomName, // roomName 필드를 conversationRoomTitle로 변환
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
      const { Op } = require('sequelize');
      
      const lastLog = await ConversationLog.findOne({
        include: [
          {
            model: ConversationRoom,
            as: 'conversationRoom',
            where: { 
              userNo,
              isActive: true 
            },
            required: true
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 1
      });

      return lastLog ? lastLog.createdAt : null;

    } catch (error) {
      console.error('❌ ConversationRoomService.getLastConversationTime Error:', error);
      throw error;
    }
  }
}

module.exports = ConversationRoomService;
